import { DatabaseSync } from 'node:sqlite';
import type { AccessScope, BackendAdapter, Query, ScopedBackend } from '../../../core/adapters.js';
import type { NewRecord, StoredRecord } from '../../../core/models.js';
import { DomainError } from '../../../core/errors.js';
import { cloneJson } from '../../../core/hashing.js';
import { RecordPolicy } from '../shared/record-policy.js';

export class SqliteBackend implements BackendAdapter {
  readonly capabilities = Object.freeze({ conditional_writes: true, atomic_writes: true, history: true, scoped_queries: true, export_import: false, distributed_fencing: false });
  protected readonly db: DatabaseSync;
  private transactionDepth = 0;
  private readonly recordPolicy: RecordPolicy;
  constructor(path: string, clock: () => string = () => new Date().toISOString(), options: { readOnly?: boolean } = {}) {
    this.recordPolicy = new RecordPolicy((scope, id, revision) => this.read(scope, id, revision), clock);
    this.db = new DatabaseSync(path, { timeout: 2000, readOnly: options.readOnly ?? false });
    try {
      const app = this.db.prepare('PRAGMA application_id').get()?.['application_id'];
      const existing = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
      if ((app !== 0 && app !== 1296253773) || (app === 0 && existing.length > 0)) throw new DomainError('INCOMPATIBLE_VERSION', 'Destination is not a Manu Control Center store.');
      if (app === 1296253773 && this.db.prepare("SELECT value FROM metadata WHERE key='schema_version'").get()?.['value'] !== '1') throw new DomainError('INCOMPATIBLE_VERSION', 'Unsupported store version.');
      if (app === 1296253773) {
        // An initialized store needs no DDL or header rewrite on each connection.
        if (!options.readOnly) this.db.exec('PRAGMA foreign_keys=ON');
        return;
      }
      if (options.readOnly) {
        throw new DomainError('INCOMPATIBLE_VERSION', 'Read-only inspection requires an initialized store.');
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
    const record = this.recordPolicy.create(scope, input);
    if (record.kind === 'action') {
      const existing = this.db.prepare('SELECT record_id FROM effects WHERE instance_id=? AND logical_key=?').get(scope.instance_id, record.data.logical_key);
      if (existing) {
        const saved = this.read(scope, String(existing['record_id'])) as StoredRecord<'action'>;
        if (saved.data.payload_hash !== record.data.payload_hash || saved.data.destination !== record.data.destination) throw new DomainError('CONFLICT', 'Effect key already has another payload or destination.');
        return saved;
      }
    }
    if (this.db.prepare('SELECT id FROM records WHERE instance_id=? AND id=?').get(scope.instance_id, record.id)) throw new DomainError('CONFLICT', 'Identity is unavailable.');
    this.recordPolicy.validateReferences(scope, record);
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
    const record = this.recordPolicy.update(scope, input, before);
    const result = this.db.prepare('UPDATE records SET revision=?,document=? WHERE instance_id=? AND id=? AND revision=?').run(record.revision, JSON.stringify(record), scope.instance_id, record.id, expectedRevision);
    if (result.changes !== 1) throw new DomainError('CONFLICT', 'Conditional write lost ownership.');
    this.persistAuxiliary(record);
    return cloneJson(record);
  }
  private persistAuxiliary(record: StoredRecord): void {
    this.db.prepare('INSERT INTO history VALUES (?,?,?,?)').run(record.instance_id, record.id, record.revision, JSON.stringify(record));
    this.db.prepare('DELETE FROM access WHERE instance_id=? AND id=?').run(record.instance_id, record.id);
    const writers = new Set([record.access.owner_id, ...record.access.writers]);
    for (const actor of new Set([...writers, ...record.access.readers])) this.db.prepare('INSERT INTO access VALUES (?,?,?,?)').run(record.instance_id, record.id, actor, writers.has(actor) ? 1 : 0);
  }
}
