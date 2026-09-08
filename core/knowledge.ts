import { DomainError } from './errors.js';
import { hashJson, hashText } from './hashing.js';
import type { AccessScope, ScopedBackend } from './adapters.js';
import type { Ref, StoredRecord } from './models.js';

export const MAX_CAPTURE_BYTES = 1024 * 1024;
export const LOCAL_SOURCE_SCOPE = 'local-text-snapshot';
export interface CaptureInput {
  project_id: string; source_id: string; request_key: string; locator: string;
  content: string; expected_revision: string | null;
}
export interface CaptureReceipt {
  source_ref: Ref; capture_ref: Ref; project_ref: Ref; content_hash: string; replayed: boolean;
}
export interface SourceQuery { text?: string; limit?: number; after_id?: string }
export interface SourceMatch {
  source_ref: Ref; project_ref: Ref; locator: string; observed_at: string;
  authority: StoredRecord<'source'>['data']['authority']; segment_id: string; excerpt: string;
}
export interface SourcePage {
  matches: SourceMatch[]; next_cursor: string | null;
  coverage: { scope: 'current_accessible_project_sources'; matching: 'literal_case_sensitive'; query: string | null; excerpt_characters: number };
}
export interface SourceVersion { source_ref: Ref; locator: string; observed_at: string; recorded_at: string }
export interface KnowledgeStore {
  capture(input: CaptureInput): CaptureReceipt;
  source(projectId: string, sourceId: string, revision?: string): StoredRecord<'source'>;
  history(projectId: string, sourceId: string, options?: { limit?: number; after_revision?: string }): { versions: SourceVersion[]; next_cursor: string | null };
  search(projectId: string, query?: SourceQuery): SourcePage;
  context(projectId: string, query?: SourceQuery): { project: { ref: Ref; purpose: string; status: string; responsible: string; next_action: string | null }; sources: SourcePage };
}
export const recordRef = (record: { id: string; revision: string }): Ref => ({ id: record.id, revision: record.revision });
export function requiredText(value: unknown, name: string, maximum = 512): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum || value.includes('\0')) throw new DomainError('INVALID_INPUT', `Invalid ${name}.`, { maximum_characters: maximum });
}
export function validateCaptureText(value: unknown): asserts value is string {
  requiredText(value, 'capture content', MAX_CAPTURE_BYTES);
  const bytes = new TextEncoder().encode(value);
  if (bytes.byteLength > MAX_CAPTURE_BYTES || new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes) !== value) throw new DomainError('INVALID_INPUT', 'Capture requires valid Unicode text within the byte limit.', { maximum_bytes: MAX_CAPTURE_BYTES });
}
export function assertCaptureInput(input: CaptureInput): void {
  if (!input || typeof input !== 'object' || Object.keys(input).sort().join(',') !== 'content,expected_revision,locator,project_id,request_key,source_id') throw new DomainError('INVALID_INPUT', 'Invalid capture input fields.');
  for (const field of ['project_id', 'source_id', 'request_key', 'locator'] as const) requiredText(input[field], field, field === 'locator' ? 4096 : 512);
  if (input.expected_revision !== null) requiredText(input.expected_revision, 'expected_revision');
  validateCaptureText(input.content);
}
export function readProject(store: ScopedBackend, id: string): StoredRecord<'project'> {
  requiredText(id, 'project_id');
  const project = store.get(id);
  if (project.kind !== 'project') throw new DomainError('NOT_FOUND', 'Project is unavailable in this scope.');
  return project;
}
function optionalRecord(store: ScopedBackend, id: string): StoredRecord | null {
  try { return store.get(id); }
  catch (error) { if (error instanceof DomainError && error.code === 'NOT_FOUND') return null; throw error; }
}

/** Adapter-only composition: the caller MUST hold one atomic write transaction around this function. */
export function captureInTransaction(store: ScopedBackend, scope: AccessScope, input: CaptureInput, observedAt: string): CaptureReceipt {
  assertCaptureInput(input);
  let project = readProject(store, input.project_id);
  if (project.access.owner_id !== scope.actor_id) throw new DomainError('FORBIDDEN', 'M3.1 capture requires the project owner.');
  const captureId = `capture:${hashJson(['mcc-capture-v1', scope.instance_id, scope.actor_id, input.request_key])}`;
  const existingCapture = optionalRecord(store, captureId);
  if (existingCapture) {
    if (existingCapture.kind !== 'capture' || existingCapture.data.project_ref.id !== project.id || existingCapture.data.source_ref.id !== input.source_id || existingCapture.data.dedup_key !== input.request_key) throw new DomainError('CONFLICT', 'Capture key belongs to another request.');
    const source = store.get(input.source_id, existingCapture.data.source_ref.revision);
    const current = store.get(input.source_id);
    if (source.kind !== 'source' || current.kind !== 'source' || current.data.project_ref?.id !== project.id || source.data.project_ref?.id !== project.id || source.data.locator !== input.locator || source.data.scope !== LOCAL_SOURCE_SCOPE || source.data.segments.length !== 1 || source.data.segments[0]!.id !== 'body' || source.data.segments[0]!.text !== input.content) throw new DomainError('CONFLICT', 'Capture key already has different content, source or destination.');
    return { source_ref: recordRef(source), capture_ref: recordRef(existingCapture), project_ref: existingCapture.data.project_ref, content_hash: hashText(input.content), replayed: true };
  }
  const current = optionalRecord(store, input.source_id);
  let source: StoredRecord<'source'>;
  if (current) {
    if (current.kind !== 'source' || current.access.owner_id !== scope.actor_id || current.data.project_ref?.id !== project.id || current.data.scope !== LOCAL_SOURCE_SCOPE || current.data.authority !== 'unverified' || current.data.segments.length !== 1 || current.data.segments[0]!.id !== 'body') throw new DomainError('CONFLICT', 'Source identity is not an editable local capture in this project.');
    if (current.revision !== input.expected_revision) throw new DomainError('CONFLICT', 'Source revision changed or an explicit revision is required.', { current_revision: current.revision });
    source = current;
    if (current.data.segments[0]!.text !== input.content || current.data.locator !== input.locator) {
      source = store.update({ ...current, data: { ...current.data, project_ref: recordRef(project), locator: input.locator, observed_at: observedAt, valid_from: observedAt, valid_to: null, segments: [{ id: 'body', text: input.content, speaker: null }] } }, current.revision) as StoredRecord<'source'>;
    }
  } else {
    if (input.expected_revision !== null) throw new DomainError('CONFLICT', 'Expected source revision is unavailable.');
    source = store.create({ kind: 'source', schema_version: '0.1.0-draft', id: input.source_id, instance_id: scope.instance_id, access: structuredClone(project.access),
      data: { project_ref: recordRef(project), locator: input.locator, scope: LOCAL_SOURCE_SCOPE, observed_at: observedAt, valid_from: observedAt, valid_to: null, authority: 'unverified', segments: [{ id: 'body', text: input.content, speaker: null }] } }) as StoredRecord<'source'>;
  }
  const refs = project.data.source_refs.map(ref => ref.id === source.id ? recordRef(source) : ref);
  if (!refs.some(ref => ref.id === source.id)) refs.push(recordRef(source));
  if (hashJson(refs) !== hashJson(project.data.source_refs)) project = store.update({ ...project, data: { ...project.data, source_refs: refs } }, project.revision) as StoredRecord<'project'>;
  const permitted = new Set([project.access.owner_id, ...project.access.readers, ...project.access.writers]);
  const access = { owner_id: scope.actor_id, readers: source.access.readers.filter(id => permitted.has(id)), writers: source.access.writers.filter(id => permitted.has(id)) };
  const capture = store.create({ kind: 'capture', schema_version: '0.1.0-draft', id: captureId, instance_id: scope.instance_id, access,
    data: { project_ref: recordRef(project), source_ref: recordRef(source), segment_ids: ['body'], processing_status: 'pending', dedup_key: input.request_key, reason: null } });
  return { source_ref: recordRef(source), capture_ref: recordRef(capture), project_ref: recordRef(project), content_hash: hashText(input.content), replayed: false };
}
