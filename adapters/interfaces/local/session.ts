import { SqliteSessionBackend } from '../../backends/sqlite/session.js';
import { existingLocalKnowledge } from './knowledge-instance.js';
import { sessionAction, type SessionQuery } from '../../../core/session.js';
import { operateLocalCoordinator } from './coordinator.js';
import { exactFields, workflowRef } from '../../../core/workflows.js';
import { requiredText } from '../../../core/knowledge.js';
import { DomainError } from '../../../core/errors.js';
import type { CoordinatorResult, Lease } from '../../../core/coordinator.js';
import type { Ref } from '../../../core/models.js';

export function readLocalSession(input: unknown, directory: string, actor: string, query: SessionQuery = {}) {
  const { request, path } = existingLocalKnowledge(input, directory, actor);
  const backend = new SqliteSessionBackend(path, undefined, new Map(), { readOnly: true });
  try { return backend.session({ instance_id: request.instance_id, actor_id: actor }, request.project.id, query); }
  finally { backend.close(); }
}
/** A single explicit step, never approval, grant issuance, automatic retry or delivery. */
export async function continueLocalSession(input: unknown, directory: string, actor: string, value: { run_ref: Ref; executor_id: string }) {
  exactFields(value, ['run_ref', 'executor_id']); workflowRef(value.run_ref); requiredText(value.executor_id, 'executor_id');
  const current = await operateLocalCoordinator(input, directory, actor, 'read', { run_id: value.run_ref.id }) as CoordinatorResult;
  if (current.run.revision !== value.run_ref.revision) throw new DomainError('CONFLICT', 'Session run revision changed. Regenerate the handoff.');
  const action = sessionAction(current, new Date().toISOString());
  if (action.operation !== 'session-continue') throw new DomainError('CONFLICT', action.reason);
  const claimed = await operateLocalCoordinator(input, directory, actor, 'claim', { run_ref: value.run_ref, executor_id: value.executor_id, lease_ms: 60000 }) as { lease: Lease };
  return operateLocalCoordinator(input, directory, actor, 'advance', { lease: claimed.lease });
}
