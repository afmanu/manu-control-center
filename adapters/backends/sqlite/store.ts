import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import type { AccessScope, BackendAdapter, Query, ScopedBackend } from '../../../core/adapters.js';
import type { NewRecord, StoredRecord, Ref, RecordKind } from '../../../core/models.js';
import { DomainError } from '../../../core/errors.js';
import { assertRecord } from '../../../core/validation.js';
import { assertInitial, assertMutation } from '../../../core/state.js';
import { assertAuthorized } from '../../../core/policy.js';
import { cloneJson, decisionContentHash, hashJson } from '../../../core/hashing.js';

export class SqliteBackend implements BackendAdapter {
  readonly capabilities = Object.freeze({ conditional_writes: true, atomic_writes: true, history: true, scoped_queries: true, export_import: false, distributed_fencing: false });
  protected readonly db: DatabaseSync;
  private transactionDepth = 0;
  constructor(path: string, private readonly clock: () => string = () => new Date().toISOString(), options: { readOnly?: boolean } = {}) {
    this.db = new DatabaseSync(path, { timeout: 2000, readOnly: options.readOnly ?? false });
    try {
      const app = this.db.prepare('PRAGMA application_id').get()?.['application_id'];
      const existing = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
      if ((app !== 0 && app !== 1296253773) || (app === 0 && existing.length > 0)) throw new DomainError('INCOMPATIBLE_VERSION', 'Destination is not a Manu Control Center store.');
      if (app === 1296253773 && this.db.prepare("SELECT value FROM metadata WHERE key='schema_version'").get()?.['value'] !== '1') throw new DomainError('INCOMPATIBLE_VERSION', 'Unsupported store version.');
      if (options.readOnly) {
        if (app !== 1296253773) throw new DomainError('INCOMPATIBLE_VERSION', 'Read-only inspection requires an initialized store.');
        return;
      }
      this.db.exec(`PRAGMA foreign_keys=ON; BEGIN IMMEDIATE;
        CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
        CREATE TABLE IF NOT EXISTS records (instance_id TEXT NOT NULL, id TEXT NOT NULL, kind TEXT NOT NULL, revision TEXT NOT NULL, document TEXT NOT NULL, PRIMARY KEY(instance_id,id)) STRICT;
        CREATE TABLE IF NOT EXISTS history (instance_id TEXT NOT NULL, id TEXT NOT NULL, revision TEXT NOT NULL, document TEXT NOT NULL, PRIMARY KEY(instance_id,id,revision)) STRICT;
        CREATE TABLE IF NOT EXISTS access (instance_id TEXT NOT NULL, id TEXT NOT NULL, actor_id TEXT NOT NULL, can_write INTEGER NOT NULL, PRIMARY KEY(instance_id,id,actor_id), FOREIGN KEY(instance_id,id) REFERENCES records(instance_id,id)) STRICT;
        CREATE TABLE IF NOT EXISTS effects (instance_id TEXT NOT NULL, logical_key TEXT NOT NULL, record_id TEXT NOT NULL, PRIMARY KEY(instance_id,logical_key), FOREIGN KEY(instance_id,record_id) REFERENCES records(instance_id,id)) STRICT;
        INSERT OR IGNORE INTO metadata VALUES ('schema_version','1');
        PRAGMA application_id=1296253773; COMMIT;`);
      if (this.db.prepare("SELECT value FROM metadata WHERE key='schema_version'").get()?.['value'] !== '1') throw new DomainError('INCOMPATIBLE_VERSION', 'Unsupported store version.');
    } catch (error) { this.db.close(); throw error; }
  }
  close(): void { this.db.close(); }
  forScope(input: AccessScope): ScopedBackend {
    if (!input.instance_id?.trim() || !input.actor_id?.trim()) throw new DomainError('INVALID_INPUT', 'An explicit instance and actor scope is required.');
    const scope = Object.freeze({ ...input });
    return {
      get: (id, revision) => this.read(scope, id, revision),
      query: query => this.query(scope, query ?? {}),
      create: record => this.transaction(() => this.create(scope, record)),
      update: (record, expectedRevision) => this.transaction(() => this.update(scope, record, expectedRevision)),
      history: id => {
        const rows = this.db.prepare('SELECT h.document FROM history h JOIN access a ON a.instance_id=h.instance_id AND a.id=h.id WHERE h.instance_id=? AND h.id=? AND a.actor_id=? ORDER BY h.rowid').all(scope.instance_id, id, scope.actor_id);
        if (rows.length === 0) throw new DomainError('NOT_FOUND', 'History is unavailable in this scope.');
        return rows.map(row => JSON.parse(String(row['document'])) as StoredRecord);
      },
      link: record => this.transaction(() => {
        if (record.kind !== 'relation') throw new DomainError('INVALID_INPUT', 'link requires a relation.');
        return this.create(scope, record) as StoredRecord<'relation'>;
      }),
    };
  }
  protected transaction<T>(work: () => T): T {
    if (this.transactionDepth > 0) return work();
    try { this.db.exec('BEGIN IMMEDIATE'); }
    catch (error) {
      if (error && typeof error === 'object' && 'errcode' in error && [5, 6].includes(Number(error.errcode))) throw new DomainError('CONFLICT', 'Store is busy; retry after re-reading.', {}, true);
      throw error;
    }
    this.transactionDepth++;
    try { const result = work(); this.db.exec('COMMIT'); return result; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
    finally { this.transactionDepth--; }
  }
  private read(scope: AccessScope, id: string, revision?: string): StoredRecord {
    const row = this.db.prepare(`SELECT r.document FROM records r JOIN access a ON a.instance_id=r.instance_id AND a.id=r.id WHERE r.instance_id=? AND r.id=? AND a.actor_id=?`).get(scope.instance_id, id, scope.actor_id);
    if (!row) throw new DomainError('NOT_FOUND', 'Record is unavailable in this scope.');
    if (revision === undefined) return JSON.parse(String(row['document'])) as StoredRecord;
    const historical = this.db.prepare('SELECT h.document FROM history h JOIN access a ON a.instance_id=h.instance_id AND a.id=h.id WHERE h.instance_id=? AND h.id=? AND h.revision=? AND a.actor_id=?').get(scope.instance_id, id, revision, scope.actor_id);
    if (!historical) throw new DomainError('NOT_FOUND', 'Record revision is unavailable in this scope.');
    return JSON.parse(String(historical['document'])) as StoredRecord;
  }
  private query(scope: AccessScope, query: Query): { records: StoredRecord[]; next_cursor: string | null } {
    const limit = query.limit ?? 50;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || (query.after_id !== undefined && typeof query.after_id !== 'string')) throw new DomainError('INVALID_INPUT', 'Invalid page request.');
    const rows = this.db.prepare(`SELECT r.document,r.id FROM records r JOIN access a ON a.instance_id=r.instance_id AND a.id=r.id
      WHERE r.instance_id=? AND a.actor_id=? AND (? IS NULL OR r.kind=?) AND (? IS NULL OR r.id>?) ORDER BY r.id LIMIT ?`)
      .all(scope.instance_id, scope.actor_id, query.kind ?? null, query.kind ?? null, query.after_id ?? null, query.after_id ?? null, limit + 1);
    const page = rows.slice(0, limit);
    return { records: page.map(row => JSON.parse(String(row['document'])) as StoredRecord), next_cursor: rows.length > limit ? String(page.at(-1)!['id']) : null };
  }
  private create(scope: AccessScope, input: NewRecord): StoredRecord {
    const now = this.clock();
    const record = assertRecord({ ...cloneJson(input), revision: randomUUID(), created_at: now, updated_at: now } as StoredRecord);
    if (record.instance_id !== scope.instance_id || record.access.owner_id !== scope.actor_id) throw new DomainError('FORBIDDEN', 'Create must use the bound instance and owner.');
    if (record.kind === 'authorization' && !scope.can_authorize) throw new DomainError('FORBIDDEN', 'Only a trusted grant issuer can issue authorization.');
    assertInitial(record);
    if (record.kind === 'action') {
      const existing = this.db.prepare('SELECT record_id FROM effects WHERE instance_id=? AND logical_key=?').get(scope.instance_id, record.data.logical_key);
      if (existing) {
        const saved = this.read(scope, String(existing['record_id'])) as StoredRecord<'action'>;
        if (saved.data.payload_hash !== record.data.payload_hash || saved.data.destination !== record.data.destination) throw new DomainError('CONFLICT', 'Effect key already has another payload or destination.');
        return saved;
      }
    }
    if (this.db.prepare('SELECT id FROM records WHERE instance_id=? AND id=?').get(scope.instance_id, record.id)) throw new DomainError('CONFLICT', 'Identity is unavailable.');
    this.validateReferences(scope, record);
    this.db.prepare('INSERT INTO records VALUES (?,?,?,?,?)').run(scope.instance_id, record.id, record.kind, record.revision, JSON.stringify(record));
    this.persistAuxiliary(record);
    if (record.kind === 'action') this.db.prepare('INSERT INTO effects VALUES (?,?,?)').run(scope.instance_id, record.data.logical_key, record.id);
    return cloneJson(record);
  }
  private update(scope: AccessScope, input: StoredRecord, expectedRevision: string): StoredRecord {
    if (input.instance_id !== scope.instance_id) throw new DomainError('FORBIDDEN', 'Record belongs to another instance.');
    const before = this.read(scope, input.id);
    const permission = this.db.prepare('SELECT can_write FROM access WHERE instance_id=? AND id=? AND actor_id=?').get(scope.instance_id, input.id, scope.actor_id);
    if (permission?.['can_write'] !== 1) throw new DomainError('FORBIDDEN', 'Write access required.');
    if (before.revision !== expectedRevision || input.revision !== expectedRevision) throw new DomainError('CONFLICT', 'Revision changed.', { current_revision: before.revision });
    const record = assertRecord({ ...cloneJson(input), revision: randomUUID(), updated_at: this.clock() } as StoredRecord);
    if (Date.parse(record.updated_at) < Date.parse(before.updated_at)) throw new DomainError('CONFLICT', 'Store clock moved backwards.');
    assertMutation(before, record);
    if (scope.actor_id !== before.access.owner_id && hashJson(before.access) !== hashJson(record.access)) throw new DomainError('FORBIDDEN', 'Only the owner can change access.');
    if (record.kind === 'authorization' && !scope.can_authorize) throw new DomainError('FORBIDDEN', 'Only a trusted grant issuer can change authorization.');
    this.validateReferences(scope, record);
    if (before.kind === 'decision' && record.kind === 'decision' && (before.data.status !== record.data.status || (record.data.status !== 'proposed' && (decisionContentHash(before) !== decisionContentHash(record) || hashJson(before.data.promotion) !== hashJson(record.data.promotion))))) {
      if (!record.data.promotion || record.data.actor_id !== scope.actor_id) throw new DomainError('FORBIDDEN', 'Decision change needs actor and current promotion provenance.');
      record.data.promotion.at = record.updated_at;
      this.checkGrant(scope, record.data.promotion.grant_ref, record, record.data.status === 'active' ? 'decision.promote' : 'decision.change_status', `instance:${scope.instance_id}`, decisionContentHash(record));
    }
    if (record.kind === 'action' && before.kind === 'action' && record.data.status === 'in_flight' && before.data.status !== 'in_flight') {
      if (!record.data.grant_ref) throw new DomainError('AUTH_REQUIRED', 'Effect invocation requires a grant.');
      this.checkGrant(scope, record.data.grant_ref, record, record.data.effect_name, record.data.destination, record.data.payload_hash);
    }
    if (record.kind === 'run' && record.data.status === 'succeeded') for (const reference of record.data.action_refs) {
      const action = this.read(scope, reference.id);
      if (action.kind !== 'action' || action.data.status !== 'confirmed') throw new DomainError('EFFECT_UNKNOWN', 'Run cannot succeed with unconfirmed effects.');
    }
    const result = this.db.prepare('UPDATE records SET revision=?,document=? WHERE instance_id=? AND id=? AND revision=?').run(record.revision, JSON.stringify(record), scope.instance_id, record.id, expectedRevision);
    if (result.changes !== 1) throw new DomainError('CONFLICT', 'Conditional write lost ownership.');
    this.persistAuxiliary(record);
    return cloneJson(record);
  }
  private checkGrant(scope: AccessScope, ref: Ref, record: StoredRecord, operation: string, destination: string, content_hash: string): void {
    const grant = this.read(scope, ref.id);
    if (grant.kind !== 'authorization' || grant.revision !== ref.revision) throw new DomainError('FORBIDDEN', 'Grant is no longer current.');
    assertAuthorized({ instance_id: scope.instance_id, actor_id: scope.actor_id, operation, resource_id: record.id, destination, content_hash }, grant, record.updated_at);
  }
  private persistAuxiliary(record: StoredRecord): void {
    this.db.prepare('INSERT INTO history VALUES (?,?,?,?)').run(record.instance_id, record.id, record.revision, JSON.stringify(record));
    this.db.prepare('DELETE FROM access WHERE instance_id=? AND id=?').run(record.instance_id, record.id);
    const writers = new Set([record.access.owner_id, ...record.access.writers]);
    for (const actor of new Set([...writers, ...record.access.readers])) this.db.prepare('INSERT INTO access VALUES (?,?,?,?)').run(record.instance_id, record.id, actor, writers.has(actor) ? 1 : 0);
  }
  private validateReferences(scope: AccessScope, record: StoredRecord): void {
    const load = (reference: Ref, kind?: RecordKind): StoredRecord => {
      const target = this.read(scope, reference.id, reference.revision);
      if (kind && target.kind !== kind) throw new DomainError('INVALID_INPUT', `Reference must point to ${kind}.`);
      return target;
    };
    const data = record.data;
    if ('project_ref' in data && data.project_ref) load(data.project_ref, 'project');
    if ('source_refs' in data) for (const reference of data.source_refs) load(reference, 'source');
    if ('decision_refs' in data) for (const reference of data.decision_refs) load(reference, 'decision');
    if ('evidence' in data) for (const item of data.evidence) {
      const source = load(item.source, 'source') as StoredRecord<'source'>;
      if (!source.data.segments.some(segment => segment.id === item.segment_id)) throw new DomainError('INVALID_INPUT', 'Evidence segment is unavailable.');
    }
    if (record.kind === 'capture') {
      const source = load(record.data.source_ref, 'source') as StoredRecord<'source'>;
      if (record.data.segment_ids.some(id => !source.data.segments.some(segment => segment.id === id))) throw new DomainError('INVALID_INPUT', 'Capture references unknown segment.');
    }
    if (record.kind === 'relation') { load(record.data.from); load(record.data.to); }
    if ('job_ref' in data) load(data.job_ref, 'job');
    if ('run_ref' in data) load(data.run_ref, 'run');
    if ('input_refs' in data) for (const reference of data.input_refs) load(reference);
    if ('output_refs' in data) for (const reference of data.output_refs) load(reference);
    if ('action_refs' in data) for (const reference of data.action_refs) load(reference, 'action');
    if ('grant_ref' in data && data.grant_ref) load(data.grant_ref, 'authorization');
    if (record.kind === 'decision' && record.data.promotion) load(record.data.promotion.grant_ref, 'authorization');
    if (record.kind === 'run') {
      const job = load(record.data.job_ref, 'job') as StoredRecord<'job'>;
      if (hashJson(job.data.workflow) !== hashJson(record.data.workflow)) throw new DomainError('INVALID_INPUT', 'Run workflow differs from its pinned job.');
      if (record.data.previous_run) {
        const previous = load(record.data.previous_run, 'run') as StoredRecord<'run'>;
        if (previous.data.job_ref.id !== job.id) throw new DomainError('INVALID_INPUT', 'Previous attempt belongs to another job.');
      }
    }
  }
}
