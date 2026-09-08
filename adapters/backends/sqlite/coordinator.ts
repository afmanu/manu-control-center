import { SqliteWorkflowBackend, type WorkflowCheckpoint } from './workflows.js';
import { DomainError } from '../../../core/errors.js';
import { effectKey, hashJson } from '../../../core/hashing.js';
import { assertInstant } from '../../../core/time.js';
import { recordRef, requiredText } from '../../../core/knowledge.js';
import { assertSemanticReview, exactFields, extractMeeting, workflowRef } from '../../../core/workflows.js';
import { affectedStages, assertCoordinatorInput, coordinatorVersion, knowledgeStages } from '../../../core/coordinator.js';
import type { ClaimRequest, CoordinatedRequest, CoordinatorInput, CoordinatorResult, CoordinatorStore, EffectObservation, EffectRequest, EffectTarget, GrantRequest, Lease, ReviseRequest, RunRequest } from '../../../core/coordinator.js';
import type { CompleteWorkflow } from '../../../core/workflows.js';
import type { AccessScope } from '../../../core/adapters.js';
import type { JsonObject, NewRecord, RecordData, RecordKind, Ref, StoredRecord } from '../../../core/models.js';

interface State {
  profile: 'coordinator-v1'; request_hash: string; request: CoordinatedRequest; attempt: number; generation: number;
  deadline: string; lease: { executor_id: string; token: number; expires_at: string } | null; epoch: number;
  started_steps: number; steps: Record<string, string>; invalidated: { refs: Ref[]; reason: string; at: string }[];
  prepared: WorkflowCheckpoint | null; review: CompleteWorkflow | null; review_hash: string | null;
  local_grant: Ref | null; needs_classification: boolean; next_action: string;
}
interface Context { scope: AccessScope; run: StoredRecord<'run'>; job: StoredRecord<'job'>; state: State }
const json = (value: unknown): JsonObject => JSON.parse(JSON.stringify(value)) as JsonObject;
const terminal = (status: string) => ['succeeded', 'failed', 'cancelled'].includes(status);
const nowMs = (value: string) => { assertInstant(value, 'coordinator clock'); return Date.parse(value); };

/** One SQLite authority and fixed registered handlers. Raw host APIs are not worker capabilities. */
export class SqliteCoordinatorBackend extends SqliteWorkflowBackend {
  constructor(path: string, clock = () => new Date().toISOString(), private readonly targets: ReadonlyMap<string, EffectTarget> = new Map(), options: { readOnly?: boolean } = {}) { super(path, clock, options); }
  forCoordinator(input: AccessScope): CoordinatorStore {
    const scope = Object.freeze({ ...input });
    return {
      submit: value => this.transaction(() => this.submit(scope, value)),
      read: (project, run) => this.snapshot(() => this.view(this.context(scope, project, run, false, false))),
      claim: value => this.transaction(() => this.claim(scope, value)),
      renew: (project, lease, duration) => this.transaction(() => { const ctx = this.ownedLease(scope, project, lease); this.duration(duration); ctx.state.lease!.expires_at = new Date(this.time() + duration).toISOString(); this.save(ctx); return this.view(ctx); }),
      pause: (project, lease) => this.transaction(() => { const ctx = this.ownedLease(scope, project, lease); return this.stop(ctx, 'paused', 'Paused by the current executor. Claim again to continue.'); }),
      advance: (project, lease) => this.advance(scope, project, lease),
      review: value => this.transaction(() => this.reviewResult(scope, value)),
      revise: value => this.transaction(() => this.revise(scope, value)),
      authorize: value => this.transaction(() => this.authorize(scope, value)),
      cancel: value => this.transaction(() => this.cancel(scope, value)),
      reconcile: (project, lease) => this.reconcile(scope, project, lease),
      retry: value => this.transaction(() => this.retry(scope, value)),
    };
  }
  private time() { return nowMs(this.observedClock()); }
  private createRecord<K extends RecordKind>(scope: AccessScope, kind: K, id: string, data: RecordData[K]): StoredRecord<K> {
    return this.forScope(scope).create({ kind, id, schema_version: '0.1.0-draft', instance_id: scope.instance_id, access: { owner_id: scope.actor_id, readers: [], writers: [] }, data } as NewRecord) as StoredRecord<K>;
  }
  private updateRecord<K extends RecordKind>(scope: AccessScope, record: StoredRecord<K>, data: RecordData[K]): StoredRecord<K> {
    return this.forScope(scope).update({ ...record, data } as StoredRecord, record.revision) as StoredRecord<K>;
  }
  private latest(scope: AccessScope, job: string): string {
    const row = this.db.prepare("SELECT id FROM records WHERE instance_id=? AND kind='run' AND json_extract(document,'$.data.job_ref.id')=? AND json_extract(document,'$.data.checkpoint.profile')='coordinator-v1' ORDER BY json_extract(document,'$.data.checkpoint.attempt') DESC LIMIT 1").get(scope.instance_id, job);
    if (!row) throw new DomainError('NOT_FOUND', 'Coordinated run is unavailable.'); return String(row['id']);
  }
  private context(scope: AccessScope, project: string, runId: string, current = false, dependencies = true): Context {
    this.workflowOwner(scope, project);
    const store = this.forScope(scope), run = store.get(runId);
    if (run.kind !== 'run' || run.data.workflow.version !== coordinatorVersion || run.access.owner_id !== scope.actor_id) throw new DomainError('NOT_FOUND', 'Coordinated run is unavailable.');
    const state = run.data.checkpoint as unknown as State;
    if (state?.profile !== 'coordinator-v1' || state.request.project_id !== project) throw new DomainError('NOT_FOUND', 'Run does not belong to this project/profile.');
    const job = store.get(run.data.job_ref.id);
    if (job.kind !== 'job' || job.access.owner_id !== scope.actor_id || (current && this.latest(scope, job.id) !== run.id)) throw new DomainError('CONFLICT', 'This is not the current job attempt.');
    const ctx = { scope, run, job, state }; if (dependencies) this.access(ctx); return ctx;
  }
  private access(ctx: Context) {
    const request = ctx.state.request, review = this.forReview(ctx.scope);
    if (request.workflow === 'deliver-approved-artifact') review.record(request.project_id, request.delivery.artifact_ref.id, 'artifact', { revision: request.delivery.artifact_ref.revision });
    if (request.workflow === 'meeting-to-brief' && 'ref' in request.meeting.source) this.forKnowledge(ctx.scope).source(request.project_id, request.meeting.source.ref.id, request.meeting.source.ref.revision);
    const prepared = ctx.state.prepared;
    if (prepared) {
      for (const ref of prepared.source_refs) this.forKnowledge(ctx.scope).source(request.project_id, ref.id, ref.revision);
      for (const ref of prepared.record_refs) review.record(request.project_id, ref.ref.id, ref.kind, { revision: ref.ref.revision });
      review.record(request.project_id, prepared.artifact_ref.id, 'artifact', { revision: prepared.artifact_ref.revision });
    }
  }
  private save(ctx: Context, status = ctx.run.data.status, cause = ctx.run.data.cause) {
    ctx.run = this.updateRecord(ctx.scope, ctx.run, { ...ctx.run.data, status, cause, checkpoint: json(ctx.state), executor_id: ctx.state.lease?.executor_id ?? (status === 'running' ? ctx.scope.actor_id : null) });
  }
  private actions(ctx: Context): StoredRecord<'action'>[] {
    return ctx.run.data.action_refs.map(ref => { const action = this.forScope(ctx.scope).get(ref.id); if (action.kind !== 'action' || action.data.job_ref.id !== ctx.job.id) throw new DomainError('CONFLICT', 'Invalid coordinated action.'); return action; });
  }
  private step(ctx: Context, name: string) {
    const record = this.forScope(ctx.scope).get(ctx.state.steps[name]!);
    if (record.kind !== 'step' || record.data.run_ref.id !== ctx.run.id) throw new DomainError('CONFLICT', 'Invalid coordinated step.'); return record;
  }
  private view(ctx: Context, replayed = false): CoordinatorResult {
    try { this.access(ctx); } catch (error) {
      if (!(error instanceof DomainError && ['NOT_FOUND', 'FORBIDDEN'].includes(error.code))) throw error;
      return { job: { ...ctx.job, data: { ...ctx.job.data, input_refs: [] } }, run: { ...ctx.run, data: { ...ctx.run.data, checkpoint: null, output_refs: [], action_refs: [] } }, steps: [], actions: [], artifact: null, next_action: 'Context access was revoked. Only owned execution metadata is visible; cancellation and reconciliation remain available.', replayed };
    }
    const ref = ctx.state.prepared?.artifact_ref ?? (ctx.state.request.workflow === 'deliver-approved-artifact' ? ctx.state.request.delivery.artifact_ref : null);
    const artifact = ref ? this.forReview(ctx.scope).record(ctx.state.request.project_id, ref.id, 'artifact', { revision: ref.revision }) as StoredRecord<'artifact'> : null;
    return { job: ctx.job, run: ctx.run, steps: Object.keys(ctx.state.steps).map(name => this.step(ctx, name)), actions: this.actions(ctx), artifact, next_action: ctx.state.next_action, replayed };
  }
  private matching(ctx: Context, ref: Ref) { workflowRef(ref); if (ctx.run.revision !== ref.revision) throw new DomainError('CONFLICT', 'Run revision changed.', { current_revision: ctx.run.revision }); }
  private duration(value: number) { if (!Number.isSafeInteger(value) || value < 1 || value > 60000) throw new DomainError('INVALID_INPUT', 'Lease duration must be 1 to 60000 milliseconds.'); }
  private ownedLease(scope: AccessScope, project: string, lease: Lease): Context {
    exactFields(lease, ['run_id', 'executor_id', 'fencing_token']); requiredText(lease.run_id, 'run_id'); requiredText(lease.executor_id, 'executor_id');
    const ctx = this.context(scope, project, lease.run_id, true, false), current = ctx.state.lease;
    if (ctx.run.data.status !== 'cancel_requested') this.access(ctx);
    if (!current || current.executor_id !== lease.executor_id || current.token !== lease.fencing_token || this.time() >= nowMs(current.expires_at) || !['running', 'cancel_requested'].includes(ctx.run.data.status)) throw new DomainError('CONFLICT', 'Executor lease expired, was released or was fenced out.');
    return ctx;
  }
  private stop(ctx: Context, status: 'blocked' | 'paused' | 'waiting_input' | 'failed', reason: string): CoordinatorResult {
    ctx.state.lease = null; ctx.state.next_action = reason;
    this.save(ctx, status, reason);
    if (status === 'failed' && (ctx.state.attempt >= ctx.job.data.budget.max_attempts || !this.budget(ctx, 1))) {
      ctx.job = this.updateRecord(ctx.scope, ctx.job, { ...ctx.job.data, status: 'failed' });
    }
    return this.view(ctx);
  }
  private budget(ctx: Context, newSteps: number): boolean {
    return this.time() < nowMs(ctx.state.deadline) && ctx.state.started_steps + newSteps <= ctx.job.data.budget.max_steps;
  }
  private makeSteps(ctx: Context, names: readonly string[]) {
    for (const name of names) {
      const step = this.createRecord(ctx.scope, 'step', `${ctx.run.id}:g${ctx.state.generation}:${name}`, { run_ref: recordRef(ctx.run), step_id: name, status: 'pending', input_refs: [], output_refs: [], owner_id: null, fencing_token: 0, checkpoint: { generation: ctx.state.generation } });
      ctx.state.steps[name] = step.id;
    }
  }
  private succeedStep(ctx: Context, name: string, inputs: Ref[], outputs: Ref[]) {
    let step = this.step(ctx, name); if (step.data.status === 'succeeded') return;
    const token = ctx.state.epoch;
    if (step.data.status !== 'running') ctx.state.started_steps++;
    step = this.updateRecord(ctx.scope, step, { ...step.data, status: 'running', owner_id: ctx.state.lease?.executor_id ?? ctx.scope.actor_id, fencing_token: token, input_refs: inputs });
    this.updateRecord(ctx.scope, step, { ...step.data, status: 'succeeded', output_refs: outputs });
  }
  private submit(scope: AccessScope, input: CoordinatorInput): CoordinatorResult {
    assertCoordinatorInput(input); if (!scope.can_authorize) throw new DomainError('FORBIDDEN', 'Submitting coordinated local work requires the trusted owner host.');
    const project = this.workflowOwner(scope, input.project_id), { budget, ...request } = input;
    const jobId = `coordinator:${hashJson([scope.instance_id, scope.actor_id, input.request_key])}`;
    let existing: StoredRecord | null = null;
    try { existing = this.forScope(scope).get(jobId); } catch (error) { if (!(error instanceof DomainError && error.code === 'NOT_FOUND')) throw error; }
    if (existing) {
      const ctx = this.context(scope, input.project_id, this.latest(scope, jobId));
      if (ctx.state.request_hash !== hashJson(input)) throw new DomainError('CONFLICT', 'Request key belongs to different coordinated work.'); return this.view(ctx, true);
    }
    const refs = [recordRef(project)];
    if (request.workflow === 'deliver-approved-artifact') {
      const artifact = this.forReview(scope).record(project.id, request.delivery.artifact_ref.id, 'artifact', { revision: request.delivery.artifact_ref.revision });
      if (artifact.kind !== 'artifact' || artifact.data.status !== 'approved' || artifact.access.owner_id !== scope.actor_id) throw new DomainError('FORBIDDEN', 'Delivery requires an exact owner-approved artifact.');
      refs.push(recordRef(artifact), ...artifact.data.source_refs);
    } else if (request.workflow === 'meeting-to-brief' && 'ref' in request.meeting.source) {
      const ref = request.meeting.source.ref; this.forKnowledge(scope).source(project.id, ref.id, ref.revision); refs.push(ref);
    }
    let job = this.createRecord(scope, 'job', jobId, { workflow: { id: input.workflow, version: coordinatorVersion }, input_refs: refs, dedup_key: jobId, source_policy: input.source_policy, status: 'queued', budget });
    job = this.updateRecord(scope, job, { ...job.data, status: 'active' });
    const state: State = { profile: 'coordinator-v1', request_hash: hashJson(input), request, attempt: 1, generation: 0, deadline: new Date(this.time() + budget.timeout_ms).toISOString(), lease: null, epoch: 0, started_steps: 0, steps: {}, invalidated: [], prepared: null, review: null, review_hash: null, local_grant: null, needs_classification: false, next_action: 'Claim this run to perform the next permitted step.' };
    const run = this.createRecord(scope, 'run', `${job.id}:run:1`, { job_ref: recordRef(job), workflow: job.data.workflow, previous_run: null, status: 'queued', executor_id: null, checkpoint: json(state), output_refs: [], action_refs: [], accepted: false, cause: null });
    const ctx = { scope, run, job, state }; this.makeSteps(ctx, request.workflow === 'deliver-approved-artifact' ? ['deliver', 'complete'] : knowledgeStages);
    if (request.workflow === 'deliver-approved-artifact') { this.deliveryAction(ctx); state.next_action = 'Authorize the exact simulated delivery, then claim the run.'; }
    else this.prepareGrant(ctx);
    this.save(ctx); return this.view(ctx);
  }
  private claim(scope: AccessScope, input: ClaimRequest): { lease: Lease; result: CoordinatorResult } {
    exactFields(input, ['project_id', 'run_ref', 'executor_id', 'lease_ms']); requiredText(input.executor_id, 'executor_id'); this.duration(input.lease_ms);
    const ctx = this.context(scope, input.project_id, input.run_ref.id, true, false); this.matching(ctx, input.run_ref);
    if (ctx.run.data.status !== 'cancel_requested') this.access(ctx);
    if (terminal(ctx.run.data.status)) throw new DomainError('CONFLICT', 'A terminal attempt cannot be claimed.');
    if (ctx.state.lease && this.time() < nowMs(ctx.state.lease.expires_at)) throw new DomainError('CONFLICT', 'Another live executor owns this run.');
    for (const action of this.actions(ctx)) if (action.data.status === 'in_flight') this.updateRecord(scope, action, { ...action.data, status: 'unknown' });
    if (ctx.run.data.status === 'running') { ctx.state.lease = null; this.save(ctx, 'paused', 'Previous lease expired; reconcile any in-flight effect.'); }
    if (!['queued', 'cancel_requested'].includes(ctx.run.data.status)) this.save(ctx, 'queued', null);
    ctx.state.epoch++; ctx.state.lease = { executor_id: input.executor_id, token: ctx.state.epoch, expires_at: new Date(this.time() + input.lease_ms).toISOString() };
    this.save(ctx, ctx.run.data.status === 'cancel_requested' ? 'cancel_requested' : 'running', null);
    return { lease: { run_id: ctx.run.id, executor_id: input.executor_id, fencing_token: ctx.state.epoch }, result: this.view(ctx) };
  }
  private action(ctx: Context, stage: string, name: string, destination: string, payload: JsonObject): StoredRecord<'action'> {
    const logicalKey = effectKey(ctx.scope.instance_id, ctx.job.id, stage, name), id = `action:${logicalKey}`, hash = hashJson(payload);
    let existing: StoredRecord | null = null;
    try { existing = this.forScope(ctx.scope).get(id); } catch (error) { if (!(error instanceof DomainError && error.code === 'NOT_FOUND')) throw error; }
    let action: StoredRecord<'action'>;
    if (existing) {
      if (existing.kind !== 'action' || existing.data.payload_hash !== hash || existing.data.destination !== destination || existing.data.effect_name !== name) throw new DomainError('CONFLICT', 'Logical effect identity belongs to different content or destination.'); action = existing;
    } else action = this.createRecord(ctx.scope, 'action', id, { job_ref: recordRef(ctx.job), step_id: stage, effect_name: name, logical_key: logicalKey, destination, payload, payload_hash: hash, grant_ref: null, status: 'prepared', attempts: 0, receipt_refs: [], reconciliation: 'not_checked' });
    if (!ctx.run.data.action_refs.some(ref => ref.id === id)) ctx.run = this.updateRecord(ctx.scope, ctx.run, { ...ctx.run.data, action_refs: [...ctx.run.data.action_refs, recordRef(action)] });
    return action;
  }
  private prepareAction(ctx: Context) { return this.action(ctx, `g${ctx.state.generation}:prepare`, 'workflow.prepare', `instance:${ctx.scope.instance_id}`, json({ request: ctx.state.request })); }
  private deliveryAction(ctx: Context) {
    const request = ctx.state.request; if (request.workflow !== 'deliver-approved-artifact') throw new DomainError('INVALID_INPUT', 'Run is not a delivery.');
    const artifact = this.forReview(ctx.scope).record(request.project_id, request.delivery.artifact_ref.id, 'artifact', { revision: request.delivery.artifact_ref.revision });
    if (artifact.kind !== 'artifact' || artifact.data.status !== 'approved') throw new DomainError('FORBIDDEN', 'Delivery requires an approved artifact.');
    return this.action(ctx, 'deliver', 'artifact.deliver.simulated', request.delivery.destination, { artifact_ref: json(request.delivery.artifact_ref), content: artifact.data.content, content_hash: artifact.data.content_hash, target_id: request.delivery.target_id, target_version: '0.1.0-simulator' });
  }
  private issue(ctx: Context, action: StoredRecord<'action'>, id: string, until: string): StoredRecord<'authorization'> {
    if (!ctx.scope.can_authorize) throw new DomainError('FORBIDDEN', 'Only the trusted owner host can issue effect grants.');
    requiredText(id, 'grant_id'); assertInstant(until, 'valid_until');
    if (Date.parse(until) <= this.time() || Date.parse(until) > nowMs(ctx.state.deadline)) throw new DomainError('INVALID_INPUT', 'Grant expiry must be in the future and no later than the job deadline.');
    if (!['prepared', 'failed'].includes(action.data.status)) throw new DomainError('CONFLICT', 'Only an unstarted or proven-no-effect action can receive a grant.');
    const data = { actor_id: ctx.scope.actor_id, operation: action.data.effect_name, resource_id: action.id, destination: action.data.destination, content_hash: action.data.payload_hash, valid_from: this.observedClock(), valid_until: until, revoked: false };
    let old: StoredRecord | null = null;
    try { old = this.forScope(ctx.scope).get(id); } catch (error) { if (!(error instanceof DomainError && error.code === 'NOT_FOUND')) throw error; }
    if (old && (old.kind !== 'authorization' || hashJson({ ...old.data, valid_from: data.valid_from }) !== hashJson(data))) throw new DomainError('CONFLICT', 'Grant identity belongs to a different scope or revoked authorization.');
    const grant = (old ?? this.createRecord(ctx.scope, 'authorization', id, data)) as StoredRecord<'authorization'>;
    this.updateRecord(ctx.scope, action, { ...action.data, status: action.data.status === 'failed' ? 'prepared' : action.data.status, grant_ref: recordRef(grant) });
    return grant;
  }
  private prepareGrant(ctx: Context) {
    const action = this.prepareAction(ctx); ctx.state.local_grant = recordRef(this.issue(ctx, action, `${action.id}:grant`, ctx.state.deadline));
  }
  private authorize(scope: AccessScope, input: GrantRequest) {
    exactFields(input, ['project_id', 'run_ref', 'grant_id', 'valid_until']);
    const ctx = this.context(scope, input.project_id, input.run_ref.id, true); this.matching(ctx, input.run_ref);
    if (terminal(ctx.run.data.status) || ctx.run.data.status === 'cancel_requested') throw new DomainError('CONFLICT', 'This run cannot authorize new effects.');
    const action = ctx.state.request.workflow === 'deliver-approved-artifact' ? this.deliveryAction(ctx) : this.prepareAction(ctx);
    return this.issue(ctx, action, input.grant_id, input.valid_until);
  }
  private startAction(ctx: Context, initial: StoredRecord<'action'>) {
    let action = initial;
    if (action.data.status === 'confirmed') return action;
    if (['unknown', 'in_flight'].includes(action.data.status)) throw new DomainError('EFFECT_UNKNOWN', 'Reconcile the existing attempt before any invocation.');
    if (action.data.attempts >= ctx.job.data.budget.max_attempts) throw new DomainError('BUDGET_EXCEEDED', 'Logical effect attempt budget is exhausted.');
    if (action.data.status === 'failed') action = this.updateRecord(ctx.scope, action, { ...action.data, status: 'prepared' });
    if (action.data.status !== 'prepared') throw new DomainError('CONFLICT', 'Effect cannot be invoked in its current state.');
    if (!action.data.grant_ref) throw new DomainError('AUTH_REQUIRED', 'Authorize this exact effect before invoking it.');
    const grant = this.forScope(ctx.scope).get(action.data.grant_ref.id);
    if (grant.kind !== 'authorization' || grant.data.content_hash !== action.data.payload_hash) throw new DomainError('FORBIDDEN', 'Effects require an exact content-bound grant.');
    return this.updateRecord(ctx.scope, action, { ...action.data, status: 'in_flight', attempts: action.data.attempts + 1, reconciliation: 'not_checked', result: {} });
  }
  private confirmLocal(ctx: Context, action: StoredRecord<'action'>, result: JsonObject) {
    this.updateRecord(ctx.scope, action, { ...action.data, status: 'confirmed', result, receipt_refs: [...action.data.receipt_refs, `local:${action.id}:${hashJson(result)}`] });
  }
  private invalidate(ctx: Context): boolean {
    if (ctx.state.request.source_policy !== 'fresh' || !ctx.state.prepared) return false;
    const prepared = ctx.state.prepared, review = this.forReview(ctx.scope), project = ctx.state.request.project_id;
    const changed = review.checkSources({ project_id: project, refs: prepared.source_refs, policy: 'fresh' }).changed_source_ids;
    const records = ['decision', 'claim'].flatMap(kind => {
      const page = review.query(project, { kind: kind as 'decision' | 'claim', limit: 50 });
      if (page.next_cursor) throw new DomainError('BUDGET_EXCEEDED', 'Current context exceeds the bounded workflow profile.');
      return page.records.map(record => ({ kind: record.kind, ref: recordRef(record) }));
    });
    const projectChanged = this.forScope(ctx.scope).get(project).revision !== prepared.project_ref.revision;
    const knowledgeChanged = hashJson(records) !== hashJson(prepared.record_refs);
    if (!changed.length && !projectChanged && !knowledgeChanged) return false;
    const meetingSource = ctx.state.request.workflow === 'meeting-to-brief' ? prepared.source_refs[0] : null;
    const transcriptChanged = !!meetingSource && changed.includes(meetingSource.id);
    const names = affectedStages(transcriptChanged ? ['input'] : ['context']);
    const old = names.map(name => recordRef(this.step(ctx, name)));
    const abandoned = this.actions(ctx).filter(action => action.data.status === 'prepared');
    for (const action of abandoned) old.push(recordRef(this.updateRecord(ctx.scope, action, { ...action.data, status: 'rejected' })));
    ctx.run = this.updateRecord(ctx.scope, ctx.run, { ...ctx.run.data, action_refs: ctx.run.data.action_refs.filter(ref => !abandoned.some(action => action.id === ref.id)) });
    ctx.state.generation++; ctx.state.invalidated.push({ refs: old, reason: transcriptChanged ? 'Meeting source revision changed; new human classification required.' : 'Project or supporting knowledge changed.', at: this.observedClock() });
    this.makeSteps(ctx, names); ctx.state.prepared = null; ctx.state.review = null; ctx.state.review_hash = null; ctx.state.local_grant = null;
    ctx.state.needs_classification = transcriptChanged;
    // Preserve historical artifacts; no old review or grant is applied to replacement output.
    ctx.run = this.updateRecord(ctx.scope, ctx.run, { ...ctx.run.data, output_refs: [] });
    ctx.state.next_action = transcriptChanged ? 'Supply fresh source references and human classification, then claim again.' : 'Authorize renewed preparation, then claim and review the replacement artifact.';
    return true;
  }
  private reviewResult(scope: AccessScope, input: CompleteWorkflow): CoordinatorResult {
    exactFields(input, ['project_id', 'run_ref', 'artifact_ref', 'content_hash', 'review']); workflowRef(input.artifact_ref); assertSemanticReview(input.review);
    if (!scope.can_authorize) throw new DomainError('FORBIDDEN', 'Only the trusted owner can submit semantic review.');
    const ctx = this.context(scope, input.project_id, input.run_ref.id, true);
    if (ctx.state.review_hash === hashJson(input)) return this.view(ctx, true);
    this.matching(ctx, input.run_ref);
    if (ctx.run.data.status !== 'waiting_input' || !ctx.state.prepared || ctx.state.lease) throw new DomainError('CONFLICT', 'Run is not waiting for this semantic review.');
    if (hashJson(input.artifact_ref) !== hashJson(ctx.state.prepared.artifact_ref) || input.content_hash !== ctx.state.prepared.content_hash || this.forScope(scope).get(input.artifact_ref.id).revision !== input.artifact_ref.revision) throw new DomainError('CONFLICT', 'Review must bind the exact current artifact revision/hash.');
    if (this.invalidate(ctx)) { this.save(ctx, 'queued', null); this.save(ctx, 'running', null); return this.stop(ctx, 'blocked', ctx.state.next_action); }
    if (!this.budget(ctx, 1)) { this.save(ctx, 'queued'); this.save(ctx, 'running'); return this.stop(ctx, 'blocked', 'BUDGET_EXCEEDED: no new review step can start.'); }
    ctx.state.epoch++; ctx.state.review = input; ctx.state.review_hash = hashJson(input);
    this.succeedStep(ctx, 'review', [input.artifact_ref], [input.artifact_ref]);
    this.save(ctx, 'queued', null); this.save(ctx, 'running', null);
    if (input.review.verdict === 'reject') return this.stop(ctx, 'failed', 'Semantic review rejected the artifact; inspect the criteria before retrying.');
    const action = this.action(ctx, `g${ctx.state.generation}:complete`, 'workflow.accept', `instance:${scope.instance_id}`, json({ artifact_ref: input.artifact_ref, content_hash: input.content_hash, review: input.review }));
    this.issue(ctx, action, `${action.id}:grant`, ctx.state.deadline);
    return this.stop(ctx, 'paused', 'Review is recorded. Claim the run to apply the exact approval.');
  }
  private revise(scope: AccessScope, input: ReviseRequest): CoordinatorResult {
    exactFields(input, ['project_id', 'run_ref', 'source_ref', 'selections']); workflowRef(input.source_ref);
    if (!scope.can_authorize) throw new DomainError('FORBIDDEN', 'Reclassification requires the trusted owner host.');
    const ctx = this.context(scope, input.project_id, input.run_ref.id, true); this.matching(ctx, input.run_ref);
    const request = ctx.state.request;
    if (request.workflow !== 'meeting-to-brief' || !ctx.state.needs_classification || request.source_policy !== 'fresh' || ctx.state.lease || ctx.run.data.status !== 'blocked') throw new DomainError('CONFLICT', 'Only an invalidated fresh transcript can be reclassified here.');
    const previous = 'ref' in request.meeting.source ? request.meeting.source.ref.id : request.meeting.source.capture.source_id;
    const source = this.forKnowledge(scope).source(input.project_id, input.source_ref.id);
    if (source.id !== previous || source.revision !== input.source_ref.revision) throw new DomainError('CONFLICT', 'Supply the current revision of the original meeting source.');
    extractMeeting(source, input.selections);
    ctx.state.request = { ...request, meeting: { source: { ref: input.source_ref }, selections: input.selections } }; ctx.state.needs_classification = false;
    this.prepareGrant(ctx); ctx.state.next_action = 'Claim this run to prepare a new artifact from the revised classification.';
    this.save(ctx, 'queued', null); return this.view(ctx);
  }
  private cancel(scope: AccessScope, input: RunRequest): CoordinatorResult {
    exactFields(input, ['project_id', 'run_ref']); const ctx = this.context(scope, input.project_id, input.run_ref.id, true, false); this.matching(ctx, input.run_ref);
    if (ctx.run.data.status === 'cancelled') return this.view(ctx, true);
    if (terminal(ctx.run.data.status)) throw new DomainError('CONFLICT', 'Terminal attempts cannot be cancelled or reopened.');
    ctx.state.epoch++; ctx.state.lease = null;
    if (ctx.run.data.status !== 'cancel_requested') this.save(ctx, 'cancel_requested', 'Cancellation requested.');
    for (const action of this.actions(ctx)) if (action.data.status === 'in_flight') this.updateRecord(scope, action, { ...action.data, status: 'unknown' });
    return this.finishCancellation(ctx);
  }
  private finishCancellation(ctx: Context) {
    const uncertain = this.actions(ctx).some(action => ['unknown', 'in_flight'].includes(action.data.status)); ctx.state.lease = null;
    if (!uncertain) ctx.state.epoch++;
    if (uncertain) { ctx.state.next_action = 'Cancellation is pending: claim for reconciliation only; never resend the uncertain effect.'; this.save(ctx, 'cancel_requested', 'Effect outcome is still uncertain.'); }
    else {
      for (const name of Object.keys(ctx.state.steps)) {
        const step = this.step(ctx, name);
        if (['pending', 'running'].includes(step.data.status)) this.updateRecord(ctx.scope, step, { ...step.data, status: step.data.status === 'pending' ? 'skipped' : 'failed', owner_id: ctx.scope.actor_id, fencing_token: ctx.state.epoch, checkpoint: { ...step.data.checkpoint, outcome: 'cancelled' } });
      }
      ctx.state.next_action = 'Cancelled. Confirmed effects remain recorded; cancellation does not undo them.'; this.save(ctx, 'cancelled', 'Cancellation completed.');
      ctx.job = this.updateRecord(ctx.scope, ctx.job, { ...ctx.job.data, status: 'cancelled' });
    }
    return this.view(ctx);
  }
  private retry(scope: AccessScope, input: RunRequest) {
    exactFields(input, ['project_id', 'run_ref']); const previous = this.context(scope, input.project_id, input.run_ref.id, true); this.matching(previous, input.run_ref);
    if (previous.run.data.status === 'failed' && previous.job.data.status === 'failed') throw new DomainError('BUDGET_EXCEEDED', 'The job exhausted its retry budget.');
    if (previous.run.data.status !== 'failed' || previous.job.data.status !== 'active') throw new DomainError('CONFLICT', 'Only a failed current attempt can be retried.');
    if (previous.state.attempt >= previous.job.data.budget.max_attempts || !this.budget(previous, 1)) throw new DomainError('BUDGET_EXCEEDED', 'Retry or elapsed-time budget is exhausted.');
    if (this.actions(previous).some(action => ['unknown', 'in_flight'].includes(action.data.status))) throw new DomainError('EFFECT_UNKNOWN', 'Uncertain effects must be reconciled before retry.');
    const state: State = { ...previous.state, attempt: previous.state.attempt + 1, steps: {}, lease: null, epoch: previous.state.epoch + 1, review: null, review_hash: null, next_action: 'Claim the new attempt. Logical action identities and consumed budgets are preserved.' };
    const run = this.createRecord(scope, 'run', `${previous.job.id}:run:${state.attempt}`, { ...previous.run.data, job_ref: recordRef(previous.job), previous_run: recordRef(previous.run), status: 'queued', executor_id: null, checkpoint: json(state), output_refs: [], accepted: false, cause: null });
    const ctx: Context = { scope, run, job: previous.job, state }; this.makeSteps(ctx, state.request.workflow === 'deliver-approved-artifact' ? ['deliver', 'complete'] : knowledgeStages); this.save(ctx); return this.view(ctx);
  }
  private reserve(ctx: Context, names: string[]) {
    for (const name of names) {
      const step = this.step(ctx, name); if (step.data.status === 'succeeded') continue;
      if (!['pending', 'running'].includes(step.data.status)) throw new DomainError('CONFLICT', 'Failed steps require a new run attempt.');
      this.updateRecord(ctx.scope, step, { ...step.data, status: 'running', owner_id: ctx.state.lease?.executor_id ?? ctx.scope.actor_id, fencing_token: ctx.state.epoch }); ctx.state.started_steps++;
    }
  }
  private async advance(scope: AccessScope, project: string, lease: Lease): Promise<CoordinatorResult> {
    let dispatch: { action: StoredRecord<'action'>; operation: 'prepare' | 'accept' | 'deliver'; stages: string[] } | null = null;
    const preliminary = this.transaction(() => {
      const ctx = this.ownedLease(scope, project, lease);
      if (ctx.run.data.status === 'cancel_requested') return this.finishCancellation(ctx);
      if (this.actions(ctx).some(action => ['in_flight', 'unknown'].includes(action.data.status))) return this.stop(ctx, 'blocked', 'EFFECT_UNKNOWN: reconcile pending actions before any new operation.');
      try {
        if (this.invalidate(ctx)) return this.stop(ctx, 'blocked', ctx.state.next_action);
        if (ctx.state.needs_classification) return this.stop(ctx, 'blocked', 'Supply human classification for the fresh transcript.');
        let action: StoredRecord<'action'>, operation: 'prepare' | 'accept' | 'deliver', stages: string[];
        if (ctx.state.request.workflow === 'deliver-approved-artifact') { operation = 'deliver'; stages = ['deliver']; action = this.deliveryAction(ctx); }
        else if (knowledgeStages.slice(0, 5).some(name => this.step(ctx, name).data.status !== 'succeeded')) { operation = 'prepare'; stages = knowledgeStages.slice(0, 5).filter(name => this.step(ctx, name).data.status !== 'succeeded'); action = this.prepareAction(ctx); }
        else {
          if (!ctx.state.review) return this.stop(ctx, 'waiting_input', 'Inspect the exact artifact and submit all semantic review criteria.');
          operation = 'accept'; stages = ['complete'];
          const review = ctx.state.review;
          action = this.action(ctx, `g${ctx.state.generation}:complete`, 'workflow.accept', `instance:${scope.instance_id}`, json({ artifact_ref: review.artifact_ref, content_hash: review.content_hash, review: review.review }));
        }
        if (!this.budget(ctx, stages.length)) return this.stop(ctx, 'blocked', 'BUDGET_EXCEEDED: cancel this job or submit new explicitly budgeted work.');
        if (operation === 'deliver') this.target(action);
        action = this.startAction(ctx, action); this.reserve(ctx, stages); this.save(ctx);
        dispatch = { action, operation, stages }; return null;
      } catch (error) {
        if (!(error instanceof DomainError)) throw error;
        return this.stop(ctx, 'blocked', `${error.code}: ${error.message}`);
      }
    });
    if (preliminary) return preliminary;
    const work = dispatch as unknown as { action: StoredRecord<'action'>; operation: 'prepare' | 'accept' | 'deliver'; stages: string[] };
    if (work.operation === 'deliver') return this.invokeDelivery(scope, project, lease, work.action);
    try {
      return this.transaction(() => {
        const ctx = this.ownedLease(scope, project, lease), action = this.forScope(scope).get(work.action.id) as StoredRecord<'action'>;
        if (!this.budget(ctx, 0)) throw new DomainError('BUDGET_EXCEEDED', 'Deadline passed before the reserved operation.');
        if (action.data.status !== 'confirmed') this.checkCurrentGrant(ctx, action);
        if (work.operation === 'prepare') {
          if (ctx.state.request.workflow === 'deliver-approved-artifact') throw new DomainError('CONFLICT', 'Invalid local preparation.');
          if (action.data.status === 'confirmed') {
            const checkpoint = action.data.result?.['prepared'] as unknown as WorkflowCheckpoint;
            if (!checkpoint || checkpoint.profile !== 'local-human-workflow-v1') throw new DomainError('CONFLICT', 'Local preparation receipt is unavailable.');
            ctx.state.prepared = checkpoint; this.access(ctx);
          } else {
            const prepared = this.buildWorkflowArtifact(scope, ctx.state.request, `${ctx.job.id}:g${ctx.state.generation}`);
            ctx.state.prepared = prepared.checkpoint;
            this.confirmLocal(ctx, action, { prepared: json(prepared.checkpoint), transaction_scope: 'atomic_local_preparation' });
          }
          const prepared = ctx.state.prepared!;
          for (const name of work.stages) this.succeedStep(ctx, name, [prepared.project_ref, ...prepared.source_refs], name === 'input' || name === 'extract' ? prepared.source_refs : [prepared.artifact_ref]);
          ctx.run = this.updateRecord(scope, ctx.run, { ...ctx.run.data, output_refs: [prepared.artifact_ref] });
          this.ownedLease(scope, project, lease); if (!this.budget(ctx, 0)) throw new DomainError('BUDGET_EXCEEDED', 'Local work exceeded the deadline and was rolled back.');
          return this.stop(ctx, 'waiting_input', 'Inspect the exact artifact and submit the four semantic review criteria.');
        }
        const prepared = ctx.state.prepared, review = ctx.state.review;
        if (!prepared || !review || review.review.verdict !== 'accept') throw new DomainError('FORBIDDEN', 'Exact semantic review is required for completion.');
        if (this.invalidate(ctx)) throw new DomainError('STALE_PLAN', 'Context changed before applying approval.');
        const artifact = this.forReview(scope).record(project, prepared.artifact_ref.id, 'artifact', { revision: prepared.artifact_ref.revision }) as StoredRecord<'artifact'>;
        if (this.forScope(scope).get(artifact.id).revision !== artifact.revision || artifact.data.content_hash !== review.content_hash) throw new DomainError('CONFLICT', 'Reviewed artifact has changed.');
        // The persisted exact grant was rechecked by startAction; approval is the only elevated operation.
        this.checkCurrentGrant(ctx, action);
        const approved = this.acceptWorkflowArtifact({ ...scope, can_authorize: true }, prepared, artifact, ctx.job.data.source_policy);
        ctx.state.prepared = { ...prepared, artifact_ref: recordRef(approved) };
        this.confirmLocal(ctx, action, { artifact_ref: json(recordRef(approved)), content_hash: approved.data.content_hash, transaction_scope: 'atomic_exact_artifact_approval' });
        this.succeedStep(ctx, 'complete', [review.artifact_ref], [recordRef(approved)]);
        this.ownedLease(scope, project, lease); if (!this.budget(ctx, 0)) throw new DomainError('BUDGET_EXCEEDED', 'Approval exceeded its deadline and was rolled back.');
        return this.success(ctx, recordRef(approved));
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      return this.transaction(() => {
        const ctx = this.ownedLease(scope, project, lease), action = this.forScope(scope).get(work.action.id) as StoredRecord<'action'>;
        if (action.data.status === 'in_flight') this.noLocalEffect(ctx, action);
        for (const name of work.stages) { const step = this.step(ctx, name); if (step.data.status === 'running') this.updateRecord(scope, step, { ...step.data, status: 'failed', checkpoint: { ...step.data.checkpoint, error: error instanceof DomainError ? error.code : 'LOCAL_OPERATION_FAILED' } }); }
        return this.stop(ctx, 'failed', `${error instanceof DomainError ? error.code : 'LOCAL_OPERATION_FAILED'}: local transaction rolled back. Inspect inputs and retry within the remaining budget.`);
      });
    }
  }
  private checkCurrentGrant(ctx: Context, action: StoredRecord<'action'>) {
    const ref = action.data.grant_ref; if (!ref) throw new DomainError('AUTH_REQUIRED', 'Effect grant is missing.');
    const grant = this.forScope(ctx.scope).get(ref.id);
    if (grant.kind !== 'authorization' || grant.revision !== ref.revision || grant.data.content_hash !== action.data.payload_hash || grant.data.revoked || grant.data.actor_id !== ctx.scope.actor_id || grant.data.operation !== action.data.effect_name || grant.data.resource_id !== action.id || grant.data.destination !== action.data.destination || this.time() < Date.parse(grant.data.valid_from) || this.time() >= Date.parse(grant.data.valid_until)) throw new DomainError('FORBIDDEN', 'Effect grant expired, changed or was revoked.');
  }
  private noLocalEffect(ctx: Context, action: StoredRecord<'action'>) {
    const proof = { scope: 'fenced_local_transaction_did_not_commit', logical_key: action.data.logical_key, attempt: action.data.attempts };
    this.updateRecord(ctx.scope, action, { ...action.data, status: 'failed', reconciliation: 'no_effect_proven', receipt_refs: [...action.data.receipt_refs, `local-rollback:${action.id}:${action.data.attempts}`], result: proof });
  }
  private success(ctx: Context, artifact: Ref) {
    if (this.actions(ctx).some(action => action.data.status !== 'confirmed')) throw new DomainError('EFFECT_UNKNOWN', 'Required effects are not all confirmed.');
    ctx.state.lease = null; ctx.state.next_action = 'Completed. Retrieve the exact artifact and recorded effect evidence.';
    ctx.run = this.updateRecord(ctx.scope, ctx.run, { ...ctx.run.data, status: 'succeeded', accepted: true, executor_id: null, cause: null, output_refs: [artifact], checkpoint: json(ctx.state) });
    ctx.job = this.updateRecord(ctx.scope, ctx.job, { ...ctx.job.data, status: 'succeeded' }); return this.view(ctx);
  }
  private target(action: StoredRecord<'action'>): EffectTarget {
    const payload = action.data.payload as JsonObject, target = this.targets.get(String(payload['target_id']));
    if (!target || target.id !== payload['target_id'] || target.version !== payload['target_version'] || target.simulated !== true || !action.data.destination.startsWith('simulator:')) throw new DomainError('CAPABILITY_UNAVAILABLE', 'The exact registered simulator target is unavailable.');
    return target;
  }
  private effectRequest(action: StoredRecord<'action'>): EffectRequest {
    return { action_id: action.id, attempt: action.data.attempts, logical_key: action.data.logical_key, destination: action.data.destination, payload_hash: action.data.payload_hash, payload: action.data.payload as JsonObject };
  }
  private async invokeDelivery(scope: AccessScope, project: string, lease: Lease, action: StoredRecord<'action'>): Promise<CoordinatorResult> {
    if (action.data.status === 'confirmed') return this.transaction(() => this.finishDelivery(this.ownedLease(scope, project, lease), action));
    // Intent is durable before invocation. Recheck the lease, grant and deadline immediately before dispatch.
    this.transaction(() => { const ctx = this.ownedLease(scope, project, lease); this.checkCurrentGrant(ctx, action); if (!this.budget(ctx, 0)) throw new DomainError('BUDGET_EXCEEDED', 'Deadline passed before dispatch.'); });
    const target = this.target(action), request = this.effectRequest(action);
    let observation: EffectObservation;
    try { observation = await target.invoke(request); if (!await target.verify(request, observation)) observation = { status: 'unknown', receipt: null }; }
    catch { observation = { status: 'unknown', receipt: null }; }
    return this.transaction(() => this.settle(this.ownedLease(scope, project, lease), action.id, observation, false));
  }
  private settle(ctx: Context, actionId: string, observation: EffectObservation, reconciliation: boolean): CoordinatorResult {
    let action = this.forScope(ctx.scope).get(actionId) as StoredRecord<'action'>;
    if (!['in_flight', 'unknown'].includes(action.data.status)) throw new DomainError('CONFLICT', 'Effect attempt already settled.');
    if (observation.status === 'unknown' || !observation.receipt) {
      if (action.data.status === 'in_flight') action = this.updateRecord(ctx.scope, action, { ...action.data, status: 'unknown' });
      if (ctx.run.data.status === 'cancel_requested') return this.finishCancellation(ctx);
      return this.stop(ctx, 'blocked', 'EFFECT_UNKNOWN: inspect target evidence through reconciliation; do not invoke again.');
    }
    const confirmed = observation.status === 'confirmed';
    action = this.updateRecord(ctx.scope, action, { ...action.data, status: confirmed ? 'confirmed' : 'failed', reconciliation: confirmed ? (reconciliation || action.data.status === 'unknown' ? 'effect_confirmed' : 'not_checked') : 'no_effect_proven', receipt_refs: [...action.data.receipt_refs, `simulator:${String((action.data.payload as JsonObject)['target_id'])}:${hashJson(observation.receipt)}`], result: { observation: json(observation), verified_at: this.observedClock() } });
    if (ctx.run.data.status === 'cancel_requested') return this.finishCancellation(ctx);
    if (confirmed) return this.finishDelivery(ctx, action);
    const step = this.step(ctx, 'deliver'); if (step.data.status === 'running') this.updateRecord(ctx.scope, step, { ...step.data, status: 'failed' });
    return this.stop(ctx, 'failed', 'Target proved no effect for this attempt. Retry only within the remaining job/attempt budget.');
  }
  private finishDelivery(ctx: Context, action: StoredRecord<'action'>) {
    const request = ctx.state.request; if (request.workflow !== 'deliver-approved-artifact' || action.data.status !== 'confirmed') throw new DomainError('CONFLICT', 'Delivery confirmation is missing.');
    this.succeedStep(ctx, 'deliver', [request.delivery.artifact_ref], [recordRef(action)]);
    if (!this.budget(ctx, 1)) return this.stop(ctx, 'blocked', 'BUDGET_EXCEEDED: delivery is confirmed but completion cannot start; cancellation will retain its receipt.');
    this.succeedStep(ctx, 'complete', [recordRef(action)], [request.delivery.artifact_ref]); return this.success(ctx, request.delivery.artifact_ref);
  }
  private async reconcile(scope: AccessScope, project: string, lease: Lease): Promise<CoordinatorResult> {
    const action = this.transaction(() => {
      const ctx = this.ownedLease(scope, project, lease); const actions = this.actions(ctx).filter(action => ['in_flight', 'unknown'].includes(action.data.status));
      if (actions.length > 1) throw new DomainError('CONFLICT', 'This sequential profile has multiple uncertain actions.');
      return actions[0] ?? null;
    });
    if (!action) return this.transaction(() => { const ctx = this.ownedLease(scope, project, lease); return ctx.run.data.status === 'cancel_requested' ? this.finishCancellation(ctx) : this.stop(ctx, 'paused', 'No uncertain action remains. Claim to continue.'); });
    if (action.data.effect_name !== 'artifact.deliver.simulated') return this.transaction(() => {
      const ctx = this.ownedLease(scope, project, lease); this.noLocalEffect(ctx, action);
      for (const name of Object.keys(ctx.state.steps)) { const step = this.step(ctx, name); if (step.data.status === 'running') this.updateRecord(scope, step, { ...step.data, status: 'failed', owner_id: lease.executor_id, fencing_token: lease.fencing_token, checkpoint: { ...step.data.checkpoint, outcome: 'recovered_no_effect' } }); }
      if (ctx.run.data.status === 'cancel_requested') return this.finishCancellation(ctx);
      return this.stop(ctx, 'failed', 'Local transaction did not commit; old writers are fenced. Retry from a new run within budget.');
    });
    let observation: EffectObservation = { status: 'unknown', receipt: null };
    try { const target = this.target(action), request = this.effectRequest(action); const result = await target.reconcile(request); if (await target.verify(request, result)) observation = result; } catch { /* Target outage keeps the original uncertainty. */ }
    return this.transaction(() => this.settle(this.ownedLease(scope, project, lease), action.id, observation, true));
  }
}
