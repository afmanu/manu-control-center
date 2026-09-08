import { DomainError } from './errors.js';
import { hashJson } from './hashing.js';
import type { StoredRecord, SourcePolicy, Ref, Budget } from './models.js';

const runEdges: Record<string, string[]> = {
  queued: ['running', 'failed', 'cancel_requested'], running: ['waiting_input', 'blocked', 'paused', 'succeeded', 'failed', 'cancel_requested'],
  waiting_input: ['queued', 'failed', 'cancel_requested'], blocked: ['queued', 'failed', 'cancel_requested'], paused: ['queued', 'failed', 'cancel_requested'],
  cancel_requested: ['cancelled'], succeeded: [], failed: [], cancelled: [],
};
const actionEdges: Record<string, string[]> = { prepared: ['in_flight', 'rejected'], in_flight: ['confirmed', 'failed', 'unknown'], unknown: ['confirmed', 'failed'], failed: ['prepared'], confirmed: [], rejected: [] };
const stepEdges: Record<string, string[]> = { pending: ['running', 'skipped'], running: ['waiting_input', 'succeeded', 'failed'], waiting_input: ['pending', 'failed'], succeeded: [], failed: [], skipped: [] };
const decisionEdges: Record<string, string[]> = { proposed: ['active'], active: ['superseded', 'revoked'], superseded: [], revoked: [] };
const jobEdges: Record<string, string[]> = { queued: ['active', 'failed', 'cancelled'], active: ['succeeded', 'failed', 'cancelled'], succeeded: [], failed: [], cancelled: [] };
const fail = (message: string): never => { throw new DomainError('CONFLICT', message); };
export function assertInitial(record: StoredRecord): void {
  const states: Record<string, string> = { job: 'queued', run: 'queued', step: 'pending', action: 'prepared', decision: 'proposed' };
  if ('status' in record.data && states[record.kind] && record.data.status !== states[record.kind]) fail(`Initial ${record.kind} state must be ${states[record.kind]}.`);
  if (record.kind === 'action' && (record.data.attempts !== 0 || record.data.receipt_refs.length !== 0 || record.data.reconciliation !== 'not_checked')) fail('New action cannot contain prior attempts or receipts.');
  if (record.kind === 'artifact' && record.data.status !== 'draft') fail('Artifacts must be created as drafts.');
}
export function assertMutation(before: StoredRecord, after: StoredRecord): void {
  if (before.kind !== after.kind || before.id !== after.id || before.instance_id !== after.instance_id || before.created_at !== after.created_at || before.access.owner_id !== after.access.owner_id) fail('Record identity, kind, creation and owner are immutable.');
  const graphs: Record<string, Record<string, string[]>> = { run: runEdges, action: actionEdges, step: stepEdges, decision: decisionEdges, job: jobEdges };
  const graph = graphs[before.kind];
  if (graph && 'status' in before.data && 'status' in after.data && before.data.status !== after.data.status && !graph[before.data.status]?.includes(after.data.status)) fail(`Invalid ${before.kind} transition: ${before.data.status} -> ${after.data.status}`);
  if (before.kind === 'artifact' && after.kind === 'artifact' && before.data.status === 'approved' && hashJson(before.data) !== hashJson(after.data)) fail('Approved artifact content and acceptance are immutable.');
  if (before.kind === 'job' && after.kind === 'job') {
    const { status: previousStatus, ...previous } = before.data;
    const { status: nextStatus, ...next } = after.data;
    if (hashJson(previous) !== hashJson(next)) fail('Job inputs, definition and budget are pinned.');
    if (['succeeded', 'failed', 'cancelled'].includes(previousStatus) && previousStatus !== nextStatus) fail('Terminal job cannot reopen.');
  }
  if (before.kind === 'decision' && after.kind === 'decision' && ['superseded', 'revoked'].includes(before.data.status) && hashJson(before.data) !== hashJson(after.data)) fail('Historical decision is immutable.');
  if (before.kind === 'run' && after.kind === 'run') {
    if (hashJson([before.data.job_ref, before.data.workflow, before.data.previous_run]) !== hashJson([after.data.job_ref, after.data.workflow, after.data.previous_run])) fail('Run ownership and definition are pinned.');
    if (['succeeded', 'failed', 'cancelled'].includes(before.data.status) && hashJson(before.data) !== hashJson(after.data)) fail('Terminal run is immutable; create a new attempt.');
  }
  if (before.kind === 'step' && after.kind === 'step') {
    if (hashJson([before.data.run_ref, before.data.step_id]) !== hashJson([after.data.run_ref, after.data.step_id])) fail('Step identity is immutable.');
    if (after.data.fencing_token < before.data.fencing_token || (after.data.owner_id !== before.data.owner_id && after.data.fencing_token <= before.data.fencing_token)) fail('Owner changes require an increased fencing token.');
  }
  if (before.kind === 'action' && after.kind === 'action') {
    if (['confirmed', 'rejected'].includes(before.data.status) && hashJson(before.data) !== hashJson(after.data)) fail('Terminal action evidence is immutable.');
    const identity = (record: StoredRecord<'action'>) => [record.data.job_ref, record.data.step_id, record.data.effect_name, record.data.logical_key, record.data.destination, record.data.payload_hash];
    if (hashJson(identity(before)) !== hashJson(identity(after))) fail('Logical effect identity, destination and payload are immutable.');
    if (before.data.attempts > 0 && !(before.data.status === 'failed' && after.data.status === 'prepared') && hashJson(before.data.grant_ref) !== hashJson(after.data.grant_ref)) fail('Authorization provenance of an attempted effect is immutable.');
    const started = before.data.status === 'prepared' && after.data.status === 'in_flight';
    if (after.data.attempts !== before.data.attempts + (started ? 1 : 0)) fail('Attempt count must increase exactly once before invocation.');
    if (before.data.status === 'unknown' && after.data.status === 'confirmed' && after.data.reconciliation !== 'effect_confirmed') fail('Unknown effect requires confirmation evidence.');
    if (after.data.status === 'failed' && ['in_flight', 'unknown'].includes(before.data.status) && after.data.reconciliation !== 'no_effect_proven') fail('Failure without effect requires proof.');
    if (before.data.status === 'failed' && after.data.status === 'prepared' && before.data.reconciliation !== 'no_effect_proven') fail('Unsafe effect retry.');
    if (before.data.receipt_refs.some(receipt => !after.data.receipt_refs.includes(receipt))) fail('Receipt evidence cannot be removed.');
    if (['confirmed', 'rejected'].includes(before.data.status) && hashJson(before.data) !== hashJson(after.data)) fail('Terminal action is immutable.');
  }
}
export function resolveSourceVersions(policy: SourcePolicy, pinned: Ref[], current: Ref[], available: Ref[]): { refs: Ref[]; invalidate: boolean } {
  if (!['snapshot', 'fresh'].includes(policy) || [pinned, current].some(refs => new Set(refs.map(item => item.id)).size !== refs.length)) throw new DomainError('INVALID_INPUT', 'Ambiguous source policy or identities.');
  const chosen = policy === 'snapshot' ? pinned : pinned.map(reference => {
    const found = current.find(item => item.id === reference.id);
    if (!found) throw new DomainError('NOT_FOUND', 'Current source unavailable.');
    return found;
  });
  if (chosen.some(reference => !available.some(item => item.id === reference.id && item.revision === reference.revision))) throw new DomainError('CAPABILITY_UNAVAILABLE', 'Required source history is unavailable.');
  return { refs: chosen.map(reference => ({ ...reference })), invalidate: hashJson(chosen) !== hashJson(pinned) };
}
export function assertBudget(budget: Budget, usage: { steps: number; attempts: number; elapsed_ms: number; tokens: number; cost: number }): void {
  if (Object.values(usage).some(value => !Number.isFinite(value) || value < 0)) throw new DomainError('INVALID_INPUT', 'Usage must be finite and nonnegative.');
  if (usage.steps >= budget.max_steps || usage.attempts >= budget.max_attempts || usage.elapsed_ms >= budget.timeout_ms || (budget.max_tokens !== null && usage.tokens >= budget.max_tokens) || (budget.max_cost !== null && usage.cost >= budget.max_cost)) throw new DomainError('BUDGET_EXCEEDED', 'Budget prevents starting another operation.');
}
