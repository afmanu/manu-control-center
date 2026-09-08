import { closeSync, constants, fstatSync, openSync, readSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DomainError } from '../../../core/errors.js';
import { MAX_CAPTURE_BYTES, requiredText, validateCaptureText } from '../../../core/knowledge.js';
import type { KnowledgeStore, SourceQuery } from '../../../core/knowledge.js';
import { assertRequest } from '../../../builder/planner.js';
import { SqliteKnowledgeBackend } from '../../backends/sqlite/knowledge.js';
import { inspectLocalInstallation, readLocalManifest, readLocalPlan } from './installation.js';

export interface LocalCaptureInput {
  source_id: string; request_key: string; expected_revision: string | null;
  text?: string; file?: string;
}
/** Read a bounded UTF-8 snapshot. File contents are data, never host instructions. */
export function readLocalTextFile(path: string): { content: string; locator: string } {
  requiredText(path, 'file path', 4096);
  let file: number | undefined;
  try {
    const canonical = realpathSync(path);
    file = openSync(canonical, constants.O_RDONLY | constants.O_NONBLOCK | constants.O_NOFOLLOW);
    const before = fstatSync(file, { bigint: true });
    if (!before.isFile() || before.size > BigInt(MAX_CAPTURE_BYTES)) throw new DomainError('INVALID_INPUT', 'Capture requires a regular UTF-8 file within the byte limit.', { maximum_bytes: MAX_CAPTURE_BYTES });
    const buffer = Buffer.alloc(MAX_CAPTURE_BYTES + 1);
    let size = 0, count: number;
    do { count = readSync(file, buffer, size, buffer.length - size, null); size += count; } while (count && size < buffer.length);
    const after = fstatSync(file, { bigint: true });
    if (size > MAX_CAPTURE_BYTES) throw new DomainError('INVALID_INPUT', 'Capture file exceeds the byte limit.', { maximum_bytes: MAX_CAPTURE_BYTES });
    if (before.size !== after.size || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs || after.size !== BigInt(size)) throw new DomainError('CONFLICT', 'Source file changed during capture; retry with a stable file.');
    const content = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buffer.subarray(0, size));
    validateCaptureText(content);
    return { content, locator: pathToFileURL(canonical).href };
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw new DomainError('INVALID_INPUT', 'Cannot read a regular UTF-8 source file.');
  } finally { if (file !== undefined) closeSync(file); }
}
function existing(input: unknown, directory: string, actor: string) {
  const request = assertRequest(input);
  requiredText(actor, 'actor');
  if (actor !== request.owner_id) throw new DomainError('FORBIDDEN', 'Local knowledge commands require the installation owner.');
  const inspection = inspectLocalInstallation(request, directory);
  if (!inspection.store_exists || !inspection.installation_revision) throw new DomainError('NOT_FOUND', 'Create or resume the foundation before using knowledge commands.');
  const plan = readLocalPlan(request, inspection.destination), manifest = readLocalManifest(request, inspection.destination);
  if (!plan || !manifest || manifest.state === 'partial') throw new DomainError('CONFLICT', 'Resume the incomplete foundation before using knowledge commands.');
  return { request, path: join(inspection.destination, 'store.sqlite') };
}
function read<T>(input: unknown, directory: string, actor: string, work: (store: KnowledgeStore, projectId: string) => T): T {
  const { request, path } = existing(input, directory, actor);
  const backend = new SqliteKnowledgeBackend(path, undefined, { readOnly: true });
  try { return work(backend.forKnowledge({ instance_id: request.instance_id, actor_id: actor }), request.project.id); }
  finally { backend.close(); }
}
export function captureLocalSource(input: unknown, directory: string, actor: string, capture: LocalCaptureInput) {
  if (!capture || typeof capture !== 'object' || Object.keys(capture).some(key => !['source_id', 'request_key', 'expected_revision', 'text', 'file'].includes(key)) || (capture.text === undefined) === (capture.file === undefined)) throw new DomainError('INVALID_INPUT', 'Specify exactly one source: text or file.');
  requiredText(capture.source_id, 'source_id'); requiredText(capture.request_key, 'request_key');
  if (capture.expected_revision !== null) requiredText(capture.expected_revision, 'expected_revision');
  const { request, path } = existing(input, directory, actor);
  const source = capture.file !== undefined ? readLocalTextFile(capture.file) : { content: capture.text!, locator: `text:${encodeURIComponent(capture.source_id)}` };
  validateCaptureText(source.content);
  const backend = new SqliteKnowledgeBackend(path);
  try { return backend.forKnowledge({ instance_id: request.instance_id, actor_id: actor }).capture({ project_id: request.project.id, source_id: capture.source_id, request_key: capture.request_key, expected_revision: capture.expected_revision, ...source }); }
  finally { backend.close(); }
}
export const readLocalSource = (input: unknown, directory: string, actor: string, sourceId: string, revision?: string) => read(input, directory, actor, (store, project) => store.source(project, sourceId, revision));
export const readLocalSourceHistory = (input: unknown, directory: string, actor: string, sourceId: string, options?: { limit?: number; after_revision?: string }) => read(input, directory, actor, (store, project) => store.history(project, sourceId, options));
export const searchLocalSources = (input: unknown, directory: string, actor: string, query: SourceQuery) => read(input, directory, actor, (store, project) => store.search(project, query));
export const readLocalContext = (input: unknown, directory: string, actor: string, query?: SourceQuery) => read(input, directory, actor, (store, project) => store.context(project, query));
