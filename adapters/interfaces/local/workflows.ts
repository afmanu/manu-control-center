import { DomainError } from '../../../core/errors.js';
import type { CompleteWorkflow, PrepareWorkflow, WorkflowStore } from '../../../core/workflows.js';
import { SqliteWorkflowBackend } from '../../backends/sqlite/workflows.js';
import { existingLocalKnowledge } from './knowledge-instance.js';

function use<T>(input: unknown, directory: string, actor: string, write: boolean, authorize: boolean, work: (store: WorkflowStore, project: string) => T): T {
  const { request, path } = existingLocalKnowledge(input, directory, actor);
  const backend = new SqliteWorkflowBackend(path, undefined, { readOnly: !write });
  try { return work(backend.forWorkflows({ instance_id: request.instance_id, actor_id: actor, can_authorize: authorize }), request.project.id); }
  finally { backend.close(); }
}
function payload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || 'project_id' in value) throw new DomainError('INVALID_INPUT', 'The host binds the workflow project.');
  return value as Record<string, unknown>;
}
export function prepareLocalWorkflow(input: unknown, directory: string, actor: string, value: unknown) {
  const data = payload(value);
  return use(input, directory, actor, true, false, (store, project_id) => store.prepare({ ...data, project_id } as PrepareWorkflow));
}
export function readLocalWorkflow(input: unknown, directory: string, actor: string, runId: string) {
  return use(input, directory, actor, false, false, (store, project) => store.read(project, runId));
}
/** The CLI caller explicitly supplies a review of this exact artifact; source data cannot authorize it. */
export function completeLocalWorkflow(input: unknown, directory: string, actor: string, value: unknown) {
  const data = payload(value);
  return use(input, directory, actor, true, true, (store, project_id) => store.complete({ ...data, project_id } as unknown as CompleteWorkflow));
}
