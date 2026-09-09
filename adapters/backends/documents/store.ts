import { closeSync, constants, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { AccessScope, BackendAdapter, Query, ScopedBackend } from '../../../core/adapters.js';
import type { NewRecord, StoredRecord } from '../../../core/models.js';
import { DomainError } from '../../../core/errors.js';
import { cloneJson, hashText } from '../../../core/hashing.js';
import { assertRecord } from '../../../core/validation.js';
import { RecordPolicy } from '../shared/record-policy.js';

interface Entry { instance_id: string; id: string; versions: string[] }
interface Head { format: 'mcc-documents-v1'; entries: Entry[] }
const MAX_BYTES = 16 * 1024 * 1024;
const MAX_VERSIONS = 10_000;
const failure = () => new DomainError('INCOMPATIBLE_VERSION', 'Document store is incomplete, damaged or unsupported.');
const hasCode = (error: unknown, code: string) => error !== null && typeof error === 'object' && 'code' in error && error.code === code;
const keys = (value: object, expected: string[]) => Object.keys(value).sort().join(',') === [...expected].sort().join(',');
const visible = (record: StoredRecord, scope: AccessScope) => record.access.owner_id === scope.actor_id || record.access.readers.includes(scope.actor_id) || record.access.writers.includes(scope.actor_id);

/** Local document persistence. One HEAD publication commits a record and its history/access together. */
export class DocumentBackend implements BackendAdapter {
  readonly capabilities = Object.freeze({ conditional_writes: true, atomic_writes: true, history: true, scoped_queries: true, export_import: false, distributed_fencing: false });
  private closed = false;
  private readonly readOnly: boolean;
  constructor(private readonly directory: string, private readonly clock: () => string = () => new Date().toISOString(), options: { readOnly?: boolean } = {}) {
    this.readOnly = options.readOnly ?? false;
    if (!['darwin', 'linux'].includes(process.platform)) throw new DomainError('CAPABILITY_UNAVAILABLE', 'Document store requires the tested macOS or Linux local filesystem profile.');
    if (!isAbsolute(directory)) throw new DomainError('INVALID_INPUT', 'Document store requires an absolute directory.');
    if (!existsSync(directory) && !options.readOnly) {
      // An incomplete new directory is retained after failure; never adopt or erase unknown files.
      try { mkdirSync(directory, { mode: 0o700 }); }
      catch (error) { if (!hasCode(error, 'EEXIST')) throw error; this.head(); return; }
      mkdirSync(join(directory, 'documents'), { mode: 0o700 });
      this.writeFile(join(directory, 'HEAD.json'), JSON.stringify({ format: 'mcc-documents-v1', entries: [] }));
      this.syncDirectory(directory);
    }
    this.head();
  }
  close(): void { this.closed = true; }
  forScope(input: AccessScope): ScopedBackend {
    if (!input.instance_id?.trim() || !input.actor_id?.trim()) throw new DomainError('INVALID_INPUT', 'An explicit instance and actor scope is required.');
    const scope = Object.freeze({ ...input });
    return {
      get: (id, revision) => this.read(this.head(), scope, id, revision),
      query: query => this.query(this.head(), scope, query ?? {}),
      history: id => {
        const head = this.head(); this.read(head, scope, id);
        return this.entry(head, scope, id)!.versions.map(hash => this.document(hash, scope.instance_id, id));
      },
      create: record => this.write(head => this.create(head, scope, record)),
      update: (record, revision) => this.write(head => this.update(head, scope, record, revision)),
      link: record => {
        if (record.kind !== 'relation') throw new DomainError('INVALID_INPUT', 'link requires a relation.');
        return this.write(head => this.create(head, scope, record)) as StoredRecord<'relation'>;
      },
    };
  }
  private assertDirectory(path: string): void {
    const stat = lstatSync(path);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw failure();
  }
  private readFile(path: string): string {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_BYTES) throw failure();
    const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try { return readFileSync(fd, 'utf8'); } finally { closeSync(fd); }
  }
  private head(): Head {
    if (this.closed) throw new DomainError('CONFLICT', 'Document store is closed.');
    try {
      this.assertDirectory(this.directory); this.assertDirectory(join(this.directory, 'documents'));
      const head = JSON.parse(this.readFile(join(this.directory, 'HEAD.json'))) as Head;
      if (!head || head.format !== 'mcc-documents-v1' || !keys(head, ['format', 'entries']) || !Array.isArray(head.entries)) throw failure();
      const identities = new Set<string>(); let count = 0;
      for (const entry of head.entries) {
        if (!entry || !keys(entry, ['instance_id', 'id', 'versions']) || typeof entry.instance_id !== 'string' || !entry.instance_id.trim() || typeof entry.id !== 'string' || !entry.id.trim() || !Array.isArray(entry.versions) || !entry.versions.length || entry.versions.some(hash => typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) || new Set(entry.versions).size !== entry.versions.length) throw failure();
        const key = JSON.stringify([entry.instance_id, entry.id]);
        if (identities.has(key)) throw failure(); identities.add(key); count += entry.versions.length;
      }
      if (count > MAX_VERSIONS) throw failure();
      return head;
    } catch (error) { if (error instanceof DomainError) throw error; throw failure(); }
  }
  private entry(head: Head, scope: AccessScope, id: string): Entry | undefined {
    return head.entries.find(entry => entry.instance_id === scope.instance_id && entry.id === id);
  }
  private document(hash: string, instance: string, id: string): StoredRecord {
    try {
      const text = this.readFile(join(this.directory, 'documents', hash + '.json'));
      if (hashText(text) !== hash) throw failure();
      const record = assertRecord(JSON.parse(text));
      if (record.instance_id !== instance || record.id !== id) throw failure();
      return record;
    } catch { throw failure(); }
  }
  private read(head: Head, scope: AccessScope, id: string, revision?: string): StoredRecord {
    const entry = this.entry(head, scope, id);
    if (!entry) throw new DomainError('NOT_FOUND', 'Record is unavailable in this scope.');
    const current = this.document(entry.versions.at(-1)!, scope.instance_id, id);
    if (!visible(current, scope)) throw new DomainError('NOT_FOUND', 'Record is unavailable in this scope.');
    if (revision === undefined || revision === current.revision) return current;
    for (const hash of entry.versions) {
      const record = this.document(hash, scope.instance_id, id);
      if (record.revision === revision) return record;
    }
    throw new DomainError('NOT_FOUND', 'Record revision is unavailable in this scope.');
  }
  private query(head: Head, scope: AccessScope, query: Query): { records: StoredRecord[]; next_cursor: string | null } {
    const limit = query.limit ?? 50;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || (query.after_id !== undefined && typeof query.after_id !== 'string')) throw new DomainError('INVALID_INPUT', 'Invalid page request.');
    // UTF-8 ordering matches SQLite BINARY ordering, including supplementary Unicode IDs.
    const records = head.entries.filter(entry => entry.instance_id === scope.instance_id)
      .map(entry => this.document(entry.versions.at(-1)!, entry.instance_id, entry.id))
      .filter(record => visible(record, scope) && (query.kind === undefined || query.kind === record.kind) && (query.after_id === undefined || Buffer.compare(Buffer.from(record.id), Buffer.from(query.after_id)) > 0))
      .sort((a, b) => Buffer.compare(Buffer.from(a.id), Buffer.from(b.id)));
    const page = records.slice(0, limit);
    return { records: page, next_cursor: records.length > limit ? page.at(-1)!.id : null };
  }
  private policy(head: Head): RecordPolicy { return new RecordPolicy((scope, id, revision) => this.read(head, scope, id, revision), this.clock); }
  private create(head: Head, scope: AccessScope, input: NewRecord): StoredRecord {
    const policy = this.policy(head), record = policy.create(scope, input);
    if (record.kind === 'action') {
      for (const entry of head.entries.filter(entry => entry.instance_id === scope.instance_id)) {
        const existing = this.document(entry.versions.at(-1)!, entry.instance_id, entry.id);
        if (existing.kind === 'action' && existing.data.logical_key === record.data.logical_key) {
          this.read(head, scope, existing.id);
          if (existing.data.payload_hash !== record.data.payload_hash || existing.data.destination !== record.data.destination) throw new DomainError('CONFLICT', 'Effect key already has another payload or destination.');
          return existing;
        }
      }
    }
    if (this.entry(head, scope, record.id)) throw new DomainError('CONFLICT', 'Identity is unavailable.');
    policy.validateReferences(scope, record);
    this.persist(head, record); return cloneJson(record);
  }
  private update(head: Head, scope: AccessScope, input: StoredRecord, revision: string): StoredRecord {
    if (input.instance_id !== scope.instance_id) throw new DomainError('FORBIDDEN', 'Record belongs to another instance.');
    const before = this.read(head, scope, input.id);
    if (before.access.owner_id !== scope.actor_id && !before.access.writers.includes(scope.actor_id)) throw new DomainError('FORBIDDEN', 'Write access required.');
    if (before.revision !== revision || input.revision !== revision) throw new DomainError('CONFLICT', 'Revision changed.', { current_revision: before.revision });
    const record = this.policy(head).update(scope, input, before);
    this.persist(head, record); return cloneJson(record);
  }
  private write<T>(work: (head: Head) => T): T {
    if (this.readOnly) throw new DomainError('FORBIDDEN', 'Document store is read-only.');
    this.head();
    const lock = join(this.directory, '.write-lock');
    try { mkdirSync(lock, { mode: 0o700 }); }
    catch (error) {
      if (hasCode(error, 'EEXIST')) throw new DomainError('CONFLICT', 'Document store writer lock exists. Re-read after the writer exits; abandoned locks require offline inspection.', {}, true);
      throw error;
    }
    try { return work(this.head()); }
    finally { rmdirSync(lock); }
  }
  private writeFile(path: string, content: string): void {
    const fd = openSync(path, 'wx', 0o600);
    try { writeFileSync(fd, content, 'utf8'); fsyncSync(fd); } finally { closeSync(fd); }
  }
  private syncDirectory(path: string): void {
    const fd = openSync(path, 'r'); try { fsyncSync(fd); } finally { closeSync(fd); }
  }
  private persist(head: Head, record: StoredRecord): void {
    const content = JSON.stringify(record, null, 2) + '\n';
    const hash = hashText(content), file = join(this.directory, 'documents', hash + '.json');
    if (Buffer.byteLength(content) > MAX_BYTES || head.entries.reduce((sum, entry) => sum + entry.versions.length, 0) >= MAX_VERSIONS) throw new DomainError('CAPABILITY_UNAVAILABLE', 'Document store size limit reached.');
    const entry = this.entry(head, { instance_id: record.instance_id, actor_id: record.access.owner_id }, record.id);
    if (entry) entry.versions.push(hash);
    else head.entries.push({ instance_id: record.instance_id, id: record.id, versions: [hash] });
    const manifest = JSON.stringify(head, null, 2) + '\n';
    if (Buffer.byteLength(manifest) > MAX_BYTES) throw new DomainError('CAPABILITY_UNAVAILABLE', 'Document index size limit reached.');
    this.writeFile(file, content); this.syncDirectory(join(this.directory, 'documents'));
    const staged = join(this.directory, '.write-lock', randomUUID() + '.json');
    try {
      this.writeFile(staged, manifest);
      renameSync(staged, join(this.directory, 'HEAD.json'));
      this.syncDirectory(this.directory);
    } finally { if (existsSync(staged)) unlinkSync(staged); }
  }
}
