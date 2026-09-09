import type { CoordinatorResult } from './coordinator.js';
import type { Ref } from './models.js';
import { DomainError } from './errors.js';
import { requiredText, recordRef } from './knowledge.js';

export interface SessionQuery {
  limit?: number;
  after_run_id?: string;
  after_source_id?: string;
  after_decision_id?: string;
  after_claim_id?: string;
  after_capture_id?: string;
}
export interface SessionAction {
  operation: 'session-continue' | 'review' | 'inspect' | 'wait' | 'none';
  reason: string;
  run_ref: Ref;
}
export function sessionQuery(query: SessionQuery): number {
  if (!query || typeof query !== 'object' || Array.isArray(query) || Object.keys(query).some(key => !['limit', 'after_run_id', 'after_source_id', 'after_decision_id', 'after_claim_id', 'after_capture_id'].includes(key))) throw new DomainError('INVALID_INPUT', 'Invalid session query.');
  const limit = query.limit ?? 10;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 25) throw new DomainError('INVALID_INPUT', 'Session page size must be 1 to 25.');
  for (const [key, value] of Object.entries(query)) if (key !== 'limit') requiredText(value, key);
  return limit;
}
/** Advisory snapshot only. The coordinator revalidates every mutation and never trusts this view. */
export function sessionAction(result: CoordinatorResult, now: string): SessionAction {
  const run_ref = recordRef(result.run), status = result.run.data.status;
  const state = result.run.data.checkpoint;
  const action = (operation: SessionAction['operation'], reason: string): SessionAction => ({ operation, reason, run_ref });
  if (['succeeded', 'cancelled'].includes(status)) return action('none', 'This attempt is complete; do not replay it.');
  if (!state) return action('inspect', 'Context is unavailable; inspect owned execution metadata before cancellation or reconciliation.');
  if (status === 'failed') return action('inspect', 'Inspect the failure and consumed usage before an explicit retry.');
  if (Date.parse(String(state['deadline'])) <= Date.parse(now)) return action('inspect', 'The original job deadline has expired.');
  if (['blocked', 'cancel_requested'].includes(status)) return action('inspect', 'Resolve the recorded blocker or reconcile the pending cancellation explicitly.');
  if (status === 'waiting_input') return action('review', 'Inspect the exact draft and evidence; owner review is required.');
  const lease = state['lease'] as { expires_at?: string } | null;
  if (status === 'running' && lease?.expires_at && Date.parse(lease.expires_at) > Date.parse(now)) return action('wait', 'Another executor holds an unexpired lease.');
  if (result.job.data.workflow.id === 'deliver-approved-artifact') return action('inspect', 'Delivery and reconciliation use their explicit coordinator commands.');
  return action('session-continue', 'Claim the current revision and advance one existing knowledge-workflow step.');
}
