import { DomainError } from '../../../core/errors.js';
import type { ArtifactApprovalInput, ArtifactForkInput, DecisionChangeInput, DecisionGrantInput, DecisionGrantRevocationInput, DraftInput, ReviewKind, ReviewQuery, ReviewStore, SourceCheckInput } from '../../../core/review.js';
import { SqliteReviewBackend } from '../../backends/sqlite/review.js';
import { existingLocalKnowledge } from './knowledge-instance.js';

function boundInput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || 'project_id' in value || 'kind' in value) throw new DomainError('INVALID_INPUT', 'Use an operation payload; project and kind are bound by the host.');
  return value as Record<string, unknown>;
}
function use<T>(input: unknown, directory: string, actor: string, write: boolean, authorize: boolean, work: (store: ReviewStore, projectId: string) => T): T {
  const { request, path } = existingLocalKnowledge(input, directory, actor);
  const backend = new SqliteReviewBackend(path, undefined, { readOnly: !write });
  try { return work(backend.forReview({ instance_id: request.instance_id, actor_id: actor, can_authorize: authorize }), request.project.id); }
  finally { backend.close(); }
}
export function saveLocalDraft(input: unknown, directory: string, actor: string, kind: ReviewKind, value: unknown) {
  const payload = boundInput(value);
  return use(input, directory, actor, true, false, (store, project) => store.save({ ...payload, kind, project_id: project } as DraftInput));
}
/** Explicit trusted-host grant issuance; never expose this capability to source-controlled input. */
export function grantLocalDecision(input: unknown, directory: string, actor: string, value: unknown) {
  const payload = boundInput(value);
  return use(input, directory, actor, true, true, (store, project) => store.grantDecision({ ...payload, project_id: project } as unknown as DecisionGrantInput));
}
export function changeLocalDecision(input: unknown, directory: string, actor: string, value: unknown) {
  const payload = boundInput(value);
  return use(input, directory, actor, true, false, (store, project) => store.changeDecision({ ...payload, project_id: project } as unknown as DecisionChangeInput));
}
export function revokeLocalDecisionGrant(input: unknown, directory: string, actor: string, value: unknown) {
  const payload = boundInput(value);
  return use(input, directory, actor, true, true, (store, project) => store.revokeDecisionGrant({ ...payload, project_id: project } as unknown as DecisionGrantRevocationInput));
}
/** Calling this entry point is an explicit owner approval of the requested revision/policy. */
export function approveLocalArtifact(input: unknown, directory: string, actor: string, value: unknown) {
  const payload = boundInput(value);
  return use(input, directory, actor, true, true, (store, project) => store.approveArtifact({ ...payload, project_id: project } as unknown as ArtifactApprovalInput));
}
export function forkLocalArtifact(input: unknown, directory: string, actor: string, value: unknown) {
  const payload = boundInput(value);
  return use(input, directory, actor, true, false, (store, project) => store.forkArtifact({ ...payload, project_id: project } as unknown as ArtifactForkInput));
}
export function checkLocalSources(input: unknown, directory: string, actor: string, value: unknown) {
  const payload = boundInput(value);
  return use(input, directory, actor, false, false, (store, project) => store.checkSources({ ...payload, project_id: project } as unknown as SourceCheckInput));
}
export const queryLocalKnowledge = (input: unknown, directory: string, actor: string, query: ReviewQuery) => use(input, directory, actor, false, false, (store, project) => store.query(project, query));
export const readLocalKnowledgeRecord = (input: unknown, directory: string, actor: string, id: string, kind: ReviewKind, options?: { revision?: string; as_of?: string }) => use(input, directory, actor, false, false, (store, project) => store.record(project, id, kind, options));
