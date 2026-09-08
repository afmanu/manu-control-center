import { DomainError } from './errors.js';
import { exactFields, workflowRef } from './workflows.js';
import { requiredText, assertCaptureInput } from './knowledge.js';
import type { Budget, JsonObject, Ref, StoredRecord, VersionRef } from './models.js';
import type { CompleteWorkflow, PrepareWorkflow, Selection } from './workflows.js';

export const coordinatorVersion = '0.1.0-coordinated';
export const agentCoordinatorVersion = '0.1.0-coordinated-agent';
export const defaultCoordinatorBudget: Budget = { max_steps: 50, max_attempts: 3, timeout_ms: 86400000, max_tokens: null, max_cost: null };
export interface DeliveryWorkflow { project_id: string; request_key: string; workflow: 'deliver-approved-artifact'; source_policy: 'snapshot'; delivery: { artifact_ref: Ref; destination: string; target_id: string } }
export type CoordinatedRequest = (PrepareWorkflow & { runtime?: VersionRef }) | DeliveryWorkflow;
export type CoordinatorInput = CoordinatedRequest & { budget: Budget };
export interface Lease { run_id: string; executor_id: string; fencing_token: number }
export interface RunRequest { project_id: string; run_ref: Ref }
export interface ClaimRequest extends RunRequest { executor_id: string; lease_ms: number }
export interface GrantRequest extends RunRequest { grant_id: string; valid_until: string }
export interface ReviseRequest extends RunRequest { source_ref: Ref; selections: Selection[] }
export interface CoordinatorResult {
  job: StoredRecord<'job'>; run: StoredRecord<'run'>; steps: StoredRecord<'step'>[]; actions: StoredRecord<'action'>[];
  artifact: StoredRecord<'artifact'> | null; next_action: string; replayed: boolean;
}
export interface EffectRequest { attempt: number; action_id: string; logical_key: string; destination: string; payload_hash: string; payload: JsonObject }
export interface EffectObservation { status: 'confirmed' | 'no_effect_proven' | 'unknown'; receipt: JsonObject | null }
/** Trusted host registration. Source text cannot choose an implementation or fabricate target evidence. */
export interface EffectTarget {
  id: string; version: string; simulated: true;
  invoke(request: EffectRequest): Promise<EffectObservation>;
  reconcile(request: EffectRequest): Promise<EffectObservation>;
  verify(request: EffectRequest, observation: EffectObservation): Promise<boolean>;
}
export interface CoordinatorStore {
  submit(input: CoordinatorInput): CoordinatorResult;
  read(projectId: string, runId: string): CoordinatorResult;
  claim(input: ClaimRequest): { lease: Lease; result: CoordinatorResult };
  renew(projectId: string, lease: Lease, leaseMs: number): CoordinatorResult;
  pause(projectId: string, lease: Lease): CoordinatorResult;
  advance(projectId: string, lease: Lease): Promise<CoordinatorResult>;
  review(input: CompleteWorkflow): CoordinatorResult;
  revise(input: ReviseRequest): CoordinatorResult;
  authorize(input: GrantRequest): StoredRecord<'authorization'>;
  cancel(input: RunRequest): CoordinatorResult;
  reconcile(projectId: string, lease: Lease): Promise<CoordinatorResult>;
  retry(input: RunRequest): CoordinatorResult;
}
export function assertCoordinatorInput(input: CoordinatorInput): void {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new DomainError('INVALID_INPUT', 'Supply a coordinated request object.');
  exactFields(input, ['project_id', 'request_key', 'workflow', 'source_policy', 'budget', ...('runtime' in input ? ['runtime'] : []), ...(input?.workflow === 'meeting-to-brief' ? ['meeting'] : input?.workflow === 'deliver-approved-artifact' ? ['delivery'] : [])]);
  requiredText(input.project_id, 'project_id'); requiredText(input.request_key, 'request_key');
  if (!['meeting-to-brief', 'project-status', 'deliver-approved-artifact'].includes(input.workflow) || !['snapshot', 'fresh'].includes(input.source_policy)) throw new DomainError('INVALID_INPUT', 'Unknown coordinated workflow or source policy.');
  exactFields(input.budget, ['max_steps', 'max_attempts', 'timeout_ms', 'max_tokens', 'max_cost']);
  const bounds = { max_steps: 1000, max_attempts: 10, timeout_ms: 2592000000 };
  for (const key of ['max_steps', 'max_attempts', 'timeout_ms'] as const) if (!Number.isSafeInteger(input.budget[key]) || input.budget[key] < 1 || input.budget[key] > bounds[key]) throw new DomainError('INVALID_INPUT', 'Invalid coordinator budget.', { field: key, maximum: bounds[key] });
  if (input.budget.max_tokens !== null || input.budget.max_cost !== null) throw new DomainError('CAPABILITY_UNAVAILABLE', 'This coordinator cannot enforce hard token or monetary limits. Use null; reported runtime usage is observed after completion.');
  if ('runtime' in input) {
    if (String(input.workflow) === 'deliver-approved-artifact') throw new DomainError('INVALID_INPUT', 'Runtime synthesis cannot deliver effects.');
    exactFields(input.runtime, ['id', 'version']); requiredText(input.runtime!.id, 'runtime.id'); requiredText(input.runtime!.version, 'runtime.version');
  }
  if (input.workflow === 'meeting-to-brief') {
    exactFields(input.meeting, ['source', 'selections']); const source = input.meeting.source;
    exactFields(source, source && 'capture' in source ? ['capture'] : ['ref']);
    if ('capture' in source) { exactFields(source.capture, ['source_id', 'request_key', 'locator', 'content', 'expected_revision']); assertCaptureInput({ ...source.capture, project_id: input.project_id }); }
    else workflowRef(source.ref);
    if (input.runtime) {
      if (!('ref' in source) || !Array.isArray(input.meeting.selections) || input.meeting.selections.length !== 0) throw new DomainError('INVALID_INPUT', 'Agent meetings require a captured source reference and empty classifications.');
    } else if (!Array.isArray(input.meeting.selections) || !input.meeting.selections.length || input.meeting.selections.length > 200) throw new DomainError('INVALID_INPUT', 'Supply bounded human classification.');
  }
  if (input.workflow === 'deliver-approved-artifact') {
    exactFields(input.delivery, ['artifact_ref', 'destination', 'target_id']); workflowRef(input.delivery.artifact_ref);
    requiredText(input.delivery.target_id, 'target_id'); requiredText(input.delivery.destination, 'destination');
    if (input.source_policy !== 'snapshot' || !input.delivery.destination.startsWith('simulator:')) throw new DomainError('FORBIDDEN', 'M3.4 delivery only supports an exact approved snapshot and simulator destinations.');
  }
}
export const knowledgeStages = ['input', 'context', 'extract', 'draft', 'evaluate', 'review', 'complete'] as const;
export const stageDependencies: Record<string, string[]> = { input: [], context: ['input'], extract: ['input'], draft: ['context', 'extract'], evaluate: ['draft'], review: ['evaluate'], complete: ['review'], deliver: [] };
export function affectedStages(roots: string[]): string[] {
  const affected = new Set(roots); let changed = true;
  while (changed) { changed = false; for (const [id, dependencies] of Object.entries(stageDependencies)) if (!affected.has(id) && dependencies.some(id => affected.has(id))) { affected.add(id); changed = true; } }
  return [...affected];
}
