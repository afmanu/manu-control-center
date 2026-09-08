import { assertAsOf, assertInstant } from '../../../core/time.js';
import { versionSelection, versionArguments } from './temporal.js';
import { SqliteBackend } from './store.js';
import { DomainError } from '../../../core/errors.js';
import { captureInTransaction, readProject, recordRef, requiredText } from '../../../core/knowledge.js';
import type { KnowledgeStore, SourcePage, SourceQuery, SourceVersion } from '../../../core/knowledge.js';
import type { AccessScope, ScopedBackend } from '../../../core/adapters.js';
import type { StoredRecord } from '../../../core/models.js';

const EXCERPT_CHARACTERS = 240;
function pageLimit(value = 20): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > 100) throw new DomainError('INVALID_INPUT', 'Page limit must be an integer from 1 to 100.');
  return value;
}
export class SqliteKnowledgeBackend extends SqliteBackend {
  constructor(path: string, protected readonly observedClock = () => new Date().toISOString(), options: { readOnly?: boolean } = {}) {
    super(path, observedClock, options);
    this.db.function('mcc_timestamp', { deterministic: true }, value => {
      const time = typeof value === 'string' ? Date.parse(value) : NaN;
      return Number.isFinite(time) ? time : null;
    });
  }
  forKnowledge(input: AccessScope): KnowledgeStore {
    const scope = Object.freeze({ ...input }), store = this.forScope(scope);
    return {
      capture: value => this.transaction(() => captureInTransaction(store, scope, value, this.observedClock())),
      source: (projectId, sourceId, revision) => this.snapshot(() => this.sourceRecord(store, scope, projectId, sourceId, revision)),
      sourceAt: (projectId, sourceId, asOf) => this.snapshot(() => this.sourceRecord(store, scope, projectId, sourceId, undefined, asOf)),
      history: (projectId, sourceId, options = {}) => this.snapshot(() => {
        if (!options || typeof options !== 'object' || Object.keys(options).some(key => !['limit', 'after_revision'].includes(key))) throw new DomainError('INVALID_INPUT', 'Invalid source history options.');
        this.sourceRecord(store, scope, projectId, sourceId);
        const limit = pageLimit(options.limit);
        let after = 0;
        if (options.after_revision !== undefined) {
          requiredText(options.after_revision, 'after_revision');
          const cursor = this.db.prepare("SELECT rowid FROM history WHERE instance_id=? AND id=? AND revision=? AND json_extract(document,'$.data.project_ref.id')=?").get(scope.instance_id, sourceId, options.after_revision, projectId);
          if (!cursor) throw new DomainError('NOT_FOUND', 'Source history cursor is unavailable.');
          after = Number(cursor['rowid']);
        }
        const rows = this.db.prepare(`SELECT h.revision, json_extract(h.document,'$.data.locator') AS locator,
          json_extract(h.document,'$.data.observed_at') AS observed_at, json_extract(h.document,'$.updated_at') AS recorded_at
          FROM history h JOIN access a ON a.instance_id=h.instance_id AND a.id=h.id
          WHERE h.instance_id=? AND h.id=? AND a.actor_id=? AND h.rowid>? AND json_extract(h.document,'$.data.project_ref.id')=? ORDER BY h.rowid LIMIT ?`)
          .all(scope.instance_id, sourceId, scope.actor_id, after, projectId, limit + 1);
        const versions: SourceVersion[] = rows.slice(0, limit).map(row => ({ source_ref: { id: sourceId, revision: String(row['revision']) }, locator: String(row['locator']), observed_at: String(row['observed_at']), recorded_at: String(row['recorded_at']) }));
        return { versions, next_cursor: rows.length > limit ? versions.at(-1)!.source_ref.revision : null };
      }),
      search: (projectId, query = {}) => this.snapshot(() => { this.projectVersion(store, scope, projectId, query?.as_of); return this.searchSources(scope, projectId, query); }),
      context: (projectId, query = {}) => this.snapshot(() => {
        const project = this.projectVersion(store, scope, projectId, query?.as_of);
        // Do not expose raw project reference lists: their targets may have narrower ACLs.
        return { project: { ref: recordRef(project), purpose: project.data.purpose, status: project.data.status, responsible: project.data.responsible, next_action: project.data.next_action }, sources: this.searchSources(scope, projectId, query) };
      }),
    };
  }
  protected snapshot<T>(work: () => T): T {
    this.db.exec('BEGIN');
    try { const result = work(); this.db.exec('COMMIT'); return result; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  protected recordVersion(store: ScopedBackend, scope: AccessScope, id: string, revision?: string, asOf?: string): StoredRecord {
    requiredText(id, 'record_id');
    const current = store.get(id); // Current permissions apply even to historical data.
    if (revision !== undefined && asOf !== undefined) throw new DomainError('INVALID_INPUT', 'Choose an exact revision or as_of, not both.');
    if (revision !== undefined) { requiredText(revision, 'revision'); return store.get(id, revision); }
    if (asOf === undefined) return current;
    assertAsOf(asOf, this.observedClock());
    const row = this.db.prepare("SELECT document FROM history WHERE instance_id=? AND id=? AND mcc_timestamp(json_extract(document,'$.updated_at'))<=? ORDER BY rowid DESC LIMIT 1").get(scope.instance_id, id, Date.parse(asOf));
    if (!row) throw new DomainError('NOT_FOUND', 'Record was not available at the requested recorded time.');
    return JSON.parse(String(row['document'])) as StoredRecord;
  }
  protected projectVersion(store: ScopedBackend, scope: AccessScope, projectId: string, asOf?: string): StoredRecord<'project'> {
    readProject(store, projectId);
    const project = this.recordVersion(store, scope, projectId, undefined, asOf);
    if (project.kind !== 'project') throw new DomainError('NOT_FOUND', 'Project is unavailable.');
    return project;
  }
  protected sourceRecord(store: ScopedBackend, scope: AccessScope, projectId: string, sourceId: string, revision?: string, asOf?: string): StoredRecord<'source'> {
    this.projectVersion(store, scope, projectId, asOf);
    const current = store.get(sourceId);
    if (current.kind !== 'source' || current.data.project_ref?.id !== projectId) throw new DomainError('NOT_FOUND', 'Source is unavailable in this project.');
    const source = this.recordVersion(store, scope, sourceId, revision, asOf);
    if (source.kind !== 'source' || source.data.project_ref?.id !== projectId) throw new DomainError('NOT_FOUND', 'Source revision is unavailable in this project.');
    return source;
  }
  private searchSources(scope: AccessScope, projectId: string, query: SourceQuery): SourcePage {
    if (!query || typeof query !== 'object' || Object.keys(query).some(key => !['text', 'limit', 'after_id', 'as_of', 'valid_at'].includes(key))) throw new DomainError('INVALID_INPUT', 'Invalid source query.');
    const limit = pageLimit(query.limit);
    if (query.as_of !== undefined) assertAsOf(query.as_of, this.observedClock());
    if (query.valid_at !== undefined) assertInstant(query.valid_at, 'valid_at');
    if (query.text !== undefined) requiredText(query.text, 'search text', 2000);
    if (query.after_id !== undefined) requiredText(query.after_id, 'after_id');
    // Both project and source access are part of the SQL relation before matching/pagination.
    const rows = this.db.prepare(`WITH selected AS (${versionSelection(query.as_of)}), visible AS (
      SELECT r.id,r.revision,r.document FROM selected r
      JOIN records c ON c.instance_id=r.instance_id AND c.id=r.id AND json_extract(c.document,'$.data.project_ref.id')=?
      JOIN access sa ON sa.instance_id=r.instance_id AND sa.id=r.id AND sa.actor_id=?
      JOIN records p ON p.instance_id=r.instance_id AND p.id=json_extract(r.document,'$.data.project_ref.id') AND p.kind='project'
      JOIN access pa ON pa.instance_id=p.instance_id AND pa.id=p.id AND pa.actor_id=?
      WHERE r.instance_id=? AND json_extract(r.document,'$.kind')='source' AND p.id=? AND (? IS NULL OR r.id>?)
      AND (? IS NULL OR (mcc_timestamp(json_extract(r.document,'$.data.valid_from'))<=? AND (json_extract(r.document,'$.data.valid_to') IS NULL OR mcc_timestamp(json_extract(r.document,'$.data.valid_to'))>?)))
    ), matched AS (
      SELECT v.*, (SELECT j.value FROM json_each(v.document,'$.data.segments') j
        WHERE ? IS NULL OR instr(json_extract(j.value,'$.text'),?)>0 ORDER BY CAST(j.key AS INTEGER) LIMIT 1) AS segment FROM visible v
    ) SELECT id,revision,json_extract(document,'$.data.project_ref') AS project_ref,
      json_extract(document,'$.data.locator') AS locator,json_extract(document,'$.data.observed_at') AS observed_at,
      json_extract(document,'$.data.authority') AS authority,json_extract(segment,'$.id') AS segment_id,
      substr(json_extract(segment,'$.text'),max(1,instr(json_extract(segment,'$.text'),coalesce(?,''))-80),?) AS excerpt
      FROM matched WHERE segment IS NOT NULL ORDER BY id LIMIT ?`)
      .all(...versionArguments(scope.instance_id, query.as_of), projectId, scope.actor_id, scope.actor_id, scope.instance_id, projectId, query.after_id ?? null, query.after_id ?? null, query.valid_at ?? null, query.valid_at ? Date.parse(query.valid_at) : null, query.valid_at ? Date.parse(query.valid_at) : null, query.text ?? null, query.text ?? null, query.text ?? null, EXCERPT_CHARACTERS, limit + 1);
    const matches = rows.slice(0, limit).map(row => ({ source_ref: { id: String(row['id']), revision: String(row['revision']) }, project_ref: JSON.parse(String(row['project_ref'])), locator: String(row['locator']), observed_at: String(row['observed_at']), authority: String(row['authority']) as StoredRecord<'source'>['data']['authority'], segment_id: String(row['segment_id']), excerpt: String(row['excerpt']) }));
    return { matches, next_cursor: rows.length > limit ? matches.at(-1)!.source_ref.id : null, coverage: { scope: query.as_of ? 'historical_accessible_project_sources' : 'current_accessible_project_sources', matching: 'literal_case_sensitive', query: query.text ?? null, excerpt_characters: EXCERPT_CHARACTERS, ...(query.as_of || query.valid_at ? { temporal: { recorded_as_of: query.as_of ?? this.observedClock(), valid_at: query.valid_at ?? null, validity_scope: 'source_availability_not_claim_truth' as const } } : {}) } };
  }
}
