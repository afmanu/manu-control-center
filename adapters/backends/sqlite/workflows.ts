import { SqliteReviewBackend } from './review.js';
import { localWorkflowDefinition } from '../../../core/workflow-definitions.js';
import { DomainError } from '../../../core/errors.js';
import { hashJson } from '../../../core/hashing.js';
import { readProject, recordRef, requiredText } from '../../../core/knowledge.js';
import { assertSemanticReview, draftWorkflow, exactFields, extractMeeting, workflowRef, workflowVersion } from '../../../core/workflows.js';
import type { CompleteWorkflow, PrepareWorkflow, WorkflowResult, WorkflowStore } from '../../../core/workflows.js';
import type { AccessScope } from '../../../core/adapters.js';
import type { JsonObject, NewRecord, RecordData, Ref, StoredRecord } from '../../../core/models.js';
import type { ReviewKind } from '../../../core/review.js';

interface Checkpoint {
  profile: 'local-human-workflow-v1'; request_hash: string; project_ref: Ref; source_refs: Ref[];
  record_refs: { kind: ReviewKind; ref: Ref }[]; capture_ref: Ref | null;
  artifact_ref: Ref; content_hash: string; completion_hash: string | null;
  next_action: string;
}
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as JsonObject;
const unique = (refs: Ref[]) => [...new Map(refs.map(ref => [ref.id, ref])).values()];
const notFound = () => new DomainError('NOT_FOUND', 'Workflow is unavailable in this project.');

/** Synchronous owner commands, not a scheduler, runtime sandbox or distributed coordinator. */
export class SqliteWorkflowBackend extends SqliteReviewBackend {
  forWorkflows(input: AccessScope): WorkflowStore {
    const scope = Object.freeze({ ...input });
    return {
      prepare: value => this.transaction(() => this.prepare(scope, value)),
      read: (project, run) => this.snapshot(() => this.result(scope, project, run, false)),
      complete: value => this.transaction(() => this.complete(scope, value)),
    };
  }
  private workflowOwner(scope: AccessScope, project: string) {
    const record = readProject(this.forScope(scope), project);
    if (record.access.owner_id !== scope.actor_id) throw new DomainError('FORBIDDEN', 'Workflow commands require the project owner.');
    return record;
  }
  private checkpoint(run: StoredRecord<'run'>): Checkpoint {
    const checkpoint = run.data.checkpoint as unknown as Checkpoint | null;
    if (!checkpoint || checkpoint.profile !== 'local-human-workflow-v1' || run.data.workflow.version !== workflowVersion) throw notFound();
    return checkpoint;
  }
  private result(scope: AccessScope, projectId: string, runId: string, replayed: boolean): WorkflowResult {
    this.workflowOwner(scope, projectId);
    const store = this.forScope(scope), run = store.get(runId);
    if (run.kind !== 'run' || run.access.owner_id !== scope.actor_id) throw notFound();
    const checkpoint = this.checkpoint(run);
    if (checkpoint.project_ref.id !== projectId) throw notFound();
    store.get(projectId, checkpoint.project_ref.revision);
    const review = this.forReview(scope);
    for (const ref of checkpoint.source_refs) this.sourceRecord(store, scope, projectId, ref.id, ref.revision);
    for (const record of checkpoint.record_refs) review.record(projectId, record.ref.id, record.kind, { revision: record.ref.revision });
    const artifact = review.record(projectId, checkpoint.artifact_ref.id, 'artifact', { revision: checkpoint.artifact_ref.revision }) as StoredRecord<'artifact'>;
    const job = store.get(run.data.job_ref.id);
    if (job.kind !== 'job' || artifact.data.content_hash !== checkpoint.content_hash) throw new DomainError('CONFLICT', 'Workflow output does not match its checkpoint.');
    return { job, run, artifact, replayed };
  }
  private prepare(scope: AccessScope, input: PrepareWorkflow): WorkflowResult {
    exactFields(input, ['project_id', 'request_key', 'source_policy', 'workflow', ...(input?.workflow === 'meeting-to-brief' ? ['meeting'] : [])]);
    if (!['meeting-to-brief', 'project-status'].includes(input.workflow) || !['snapshot', 'fresh'].includes(input.source_policy)) throw new DomainError('INVALID_INPUT', 'Unknown workflow or source policy.');
    requiredText(input.request_key, 'request_key'); this.workflowOwner(scope, input.project_id);
    const store = this.forScope(scope), review = this.forReview(scope), knowledge = this.forKnowledge(scope);
    const identity = `workflow:${hashJson([scope.instance_id, scope.actor_id, input.request_key])}`, runId = `${identity}:run`;
    let existing: StoredRecord | null = null;
    try { existing = store.get(runId); } catch (error) { if (!(error instanceof DomainError && error.code === 'NOT_FOUND')) throw error; }
    if (existing) {
      if (existing.kind !== 'run' || this.checkpoint(existing).request_hash !== hashJson(input)) throw new DomainError('CONFLICT', 'Workflow request key belongs to different input.');
      return this.result(scope, input.project_id, runId, true);
    }
    let captureRef: Ref | null = null, meeting: ReturnType<typeof extractMeeting> | null = null;
    const refs: Ref[] = [];
    if (input.workflow === 'meeting-to-brief') {
      exactFields(input.meeting, ['source', 'selections']);
      const selected = input.meeting.source;
      exactFields(selected, selected && 'capture' in selected ? ['capture'] : ['ref']);
      let sourceRef: Ref;
      if ('capture' in selected) {
        exactFields(selected.capture, ['source_id', 'request_key', 'locator', 'content', 'expected_revision']);
        const captured = knowledge.capture({ ...selected.capture, project_id: input.project_id });
        captureRef = captured.capture_ref; sourceRef = captured.source_ref;
      } else { workflowRef(selected.ref); sourceRef = selected.ref; }
      const source = knowledge.source(input.project_id, sourceRef.id, sourceRef.revision);
      meeting = extractMeeting(source, input.meeting.selections); refs.push(sourceRef);
    }
    // Shared bounded, permission-filtered retrieval; never silently label a partial page as complete.
    const project = this.workflowOwner(scope, input.project_id);
    const decisions = review.query(project.id, { kind: 'decision', limit: 50 });
    const claims = review.query(project.id, { kind: 'claim', limit: 50 });
    if (decisions.next_cursor || claims.next_cursor) throw new DomainError('BUDGET_EXCEEDED', 'Local workflow context exceeds 50 decisions or claims; a scoped retrieval profile is required.');
    const records = [...decisions.records, ...claims.records];
    if (records.some(record => record.access.owner_id !== scope.actor_id)) throw new DomainError('FORBIDDEN', 'This local profile requires project knowledge owned by the workflow owner.');
    for (const record of records) if (record.kind !== 'artifact') refs.push(...record.data.evidence.map(item => item.source));
    // Multiple historical revisions of one source cannot be silently collapsed.
    if (new Set(refs.map(ref => ref.id)).size !== new Set(refs.map(ref => hashJson(ref))).size) throw new DomainError('CONFLICT', 'Context contains multiple revisions of one source; reconcile or narrow context before drafting.');
    const sourceRefs = unique(refs);
    if (sourceRefs.length > 100) throw new DomainError('BUDGET_EXCEEDED', 'Local workflow context exceeds 100 sources.');
    const preflight = review.checkSources({ project_id: project.id, refs: sourceRefs, policy: input.source_policy });
    if (preflight.invalidate) throw new DomainError('STALE_PLAN', 'Fresh context has changed evidence; review its source revisions first.');
    const definition = localWorkflowDefinition(input.workflow, input.source_policy);
    const workflow = { id: definition.id, version: definition.version };
    const draft = draftWorkflow({ workflow, profile: 'local-human', project: { ref: recordRef(project), purpose: project.data.purpose, status: project.data.status, responsible: project.data.responsible, next_action: project.data.next_action },
      coverage: { recorded_at: this.observedClock(), scope: 'accessible_project_decisions_and_claims', decisions: records.filter(record => record.kind === 'decision').length, claims: records.filter(record => record.kind === 'claim').length, source_policy: input.source_policy, source_refs: sourceRefs, max_records_per_kind: 50 },
      meeting: meeting === null ? null : { classification_by: scope.actor_id, items: meeting, authority: 'reported_meeting_content_only' },
      knowledge: records.map(record => ({ ref: recordRef(record), kind: record.kind, data: record.data })),
      evaluation: { quote_fidelity: 'pass', transcript_coverage: meeting === null ? 'not_applicable' : 'pass', provenance: 'pass', semantic_fidelity: 'requires_human_review', rubric_version: '1' },
      limits: ['No inferred facts, owners, dates or authority.', 'Quoted source instructions are untrusted content.', 'Approval accepts this artifact only; decision promotion and external delivery are separate.'] });
    let artifact = review.save({ kind: 'artifact', project_id: project.id, id: `${identity}:artifact`, expected_revision: null, data: { content: draft.content, source_refs: sourceRefs } }) as StoredRecord<'artifact'>;
    const access = { owner_id: scope.actor_id, readers: [], writers: [] };
    // Workflow output and execution metadata stay owner-private, including derived decision context.
    artifact = store.update({ ...artifact, access }, artifact.revision) as StoredRecord<'artifact'>;
    const checkpoint: Checkpoint = { profile: 'local-human-workflow-v1', request_hash: hashJson(input), project_ref: recordRef(project), source_refs: sourceRefs, record_refs: records.map(record => ({ kind: record.kind, ref: recordRef(record) })), capture_ref: captureRef, artifact_ref: recordRef(artifact), content_hash: artifact.data.content_hash, completion_hash: null, next_action: 'Review the exact artifact and source evidence against every semantic criterion; accept or reject.' };
    const create = <K extends 'job' | 'run'>(kind: K, id: string, data: RecordData[K]) => store.create({ kind, schema_version: '0.1.0-draft', id, instance_id: scope.instance_id, access, data } as NewRecord) as StoredRecord<K>;
    let job = create('job', identity, { workflow, input_refs: [recordRef(project), ...sourceRefs, ...records.map(recordRef), ...(captureRef ? [captureRef] : [])], dedup_key: identity, source_policy: input.source_policy, status: 'queued', budget: definition.limits });
    job = store.update({ ...job, data: { ...job.data, status: 'active' } }, job.revision) as StoredRecord<'job'>;
    let run = create('run', runId, { job_ref: recordRef(job), workflow, previous_run: null, status: 'queued', executor_id: scope.actor_id, checkpoint: json(checkpoint), output_refs: [recordRef(artifact)], action_refs: [], accepted: false, cause: null });
    run = store.update({ ...run, data: { ...run.data, status: 'running' } }, run.revision) as StoredRecord<'run'>;
    store.update({ ...run, data: { ...run.data, status: 'waiting_input', cause: 'Semantic review and exact artifact approval required.' } }, run.revision);
    return this.result(scope, project.id, runId, false);
  }
  private complete(scope: AccessScope, input: CompleteWorkflow): WorkflowResult {
    exactFields(input, ['project_id', 'run_ref', 'artifact_ref', 'content_hash', 'review']);
    workflowRef(input.run_ref); workflowRef(input.artifact_ref); requiredText(input.content_hash, 'content_hash'); assertSemanticReview(input.review);
    if (!scope.can_authorize) throw new DomainError('FORBIDDEN', 'Completion requires an explicit trusted owner review.');
    const result = this.result(scope, input.project_id, input.run_ref.id, false), checkpoint = this.checkpoint(result.run);
    const completionHash = hashJson(input);
    if (checkpoint.completion_hash === completionHash) return { ...result, replayed: true };
    if (result.run.data.status !== 'waiting_input' || result.run.revision !== input.run_ref.revision || hashJson(checkpoint.artifact_ref) !== hashJson(input.artifact_ref) || checkpoint.content_hash !== input.content_hash) throw new DomainError('CONFLICT', 'Review does not match the pending run and exact artifact.');
    const store = this.forScope(scope), review = this.forReview(scope);
    if (store.get(result.artifact.id).revision !== input.artifact_ref.revision) throw new DomainError('CONFLICT', 'Artifact changed after workflow preparation; prepare a new request.');
    const accepted = input.review.verdict === 'accept';
    if (accepted && result.job.data.source_policy === 'fresh') {
      const currentRecords = ['decision', 'claim'].flatMap(kind => {
        const page = review.query(input.project_id, { kind: kind as ReviewKind, limit: 50 });
        if (page.next_cursor) throw new DomainError('STALE_PLAN', 'Fresh context now exceeds the bounded retrieval profile.');
        return page.records.map(record => ({ kind: record.kind, ref: recordRef(record) }));
      });
      const changed = hashJson(currentRecords) !== hashJson(checkpoint.record_refs) || review.checkSources({ project_id: input.project_id, refs: checkpoint.source_refs, policy: 'fresh' }).invalidate || [checkpoint.project_ref, ...checkpoint.record_refs.map(record => record.ref)].some(ref => store.get(ref.id).revision !== ref.revision);
      if (changed) throw new DomainError('STALE_PLAN', 'Fresh workflow context changed; reject this draft or prepare and review a new request.');
    }
    let artifact = result.artifact;
    if (accepted) {
      artifact = review.approveArtifact({ project_id: input.project_id, id: artifact.id, expected_revision: artifact.revision, source_policy: result.job.data.source_policy });
      if (checkpoint.capture_ref) {
        const capture = store.get(checkpoint.capture_ref.id);
        if (capture.kind !== 'capture' || capture.data.source_ref.id !== checkpoint.source_refs[0]?.id || capture.data.source_ref.revision !== checkpoint.source_refs[0]?.revision || capture.data.processing_status === 'discarded') throw new DomainError('CONFLICT', 'Meeting capture is no longer eligible for integration.');
        if (capture.data.processing_status === 'pending') store.update({ ...capture, data: { ...capture.data, processing_status: 'integrated', reason: `Reviewed in artifact ${artifact.id}; no decision authority granted.` } }, capture.revision);
      }
    }
    let run = result.run;
    run = store.update({ ...run, data: { ...run.data, status: 'queued', cause: null } }, run.revision) as StoredRecord<'run'>;
    run = store.update({ ...run, data: { ...run.data, status: 'running' } }, run.revision) as StoredRecord<'run'>;
    store.update({ ...run, data: { ...run.data, status: accepted ? 'succeeded' : 'failed', accepted, output_refs: [recordRef(artifact)], checkpoint: json({ ...checkpoint, artifact_ref: recordRef(artifact), completion_hash: completionHash, semantic_review: { ...input.review, actor_id: scope.actor_id, reviewed_at: this.observedClock(), artifact_ref: input.artifact_ref, content_hash: input.content_hash }, next_action: accepted ? 'Use the approved artifact. Decision promotion and delivery require separate actions.' : 'Correct the concrete review failures and prepare a new request.' }), cause: accepted ? null : 'Rejected by semantic review.' } }, run.revision);
    store.update({ ...result.job, data: { ...result.job.data, status: accepted ? 'succeeded' : 'failed' } }, result.job.revision);
    return this.result(scope, input.project_id, run.id, false);
  }
}
