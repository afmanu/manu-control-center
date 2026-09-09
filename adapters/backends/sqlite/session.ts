import { SqliteCoordinatorBackend } from './coordinator.js';
import { DomainError } from '../../../core/errors.js';
import { hashJson } from '../../../core/hashing.js';
import { recordRef } from '../../../core/knowledge.js';
import { sessionAction, sessionQuery, type SessionQuery } from '../../../core/session.js';
import type { AccessScope } from '../../../core/adapters.js';
import type { StoredRecord } from '../../../core/models.js';

const unavailable = (error: unknown) => error instanceof DomainError && ['NOT_FOUND', 'FORBIDDEN'].includes(error.code);
/** Read-only, regenerable projection. C19 remains the execution authority. */
export class SqliteSessionBackend extends SqliteCoordinatorBackend {
  session(input: AccessScope, projectId: string, query: SessionQuery = {}) {
    const scope = Object.freeze({ ...input }), limit = sessionQuery(query);
    return this.snapshot(() => {
      this.workflowOwner(scope, projectId);
      const now = this.observedClock(), knowledge = this.forKnowledge(scope), review = this.forReview(scope), raw = this.forScope(scope);
      const context = knowledge.context(projectId, { limit, ...(query.after_source_id ? { after_id: query.after_source_id } : {}) });
      const decisions = review.query(projectId, { kind: 'decision', limit, ...(query.after_decision_id ? { after_id: query.after_decision_id } : {}) });
      const claims = review.query(projectId, { kind: 'claim', limit, ...(query.after_claim_id ? { after_id: query.after_claim_id } : {}) });
      // Keyset scan filters access and project membership before exposing results/cursors.
      // Latest attempts are selected before pagination; historical attempts stay available by run id.
      const rows = this.db.prepare("SELECT id FROM records r WHERE instance_id=? AND kind='run' AND id>? AND json_extract(document,'$.data.checkpoint.profile')='coordinator-v1' AND json_extract(document,'$.data.checkpoint.request.project_id')=? AND NOT EXISTS (SELECT 1 FROM records newer WHERE newer.instance_id=r.instance_id AND newer.kind='run' AND json_extract(newer.document,'$.data.job_ref.id')=json_extract(r.document,'$.data.job_ref.id') AND json_extract(newer.document,'$.data.checkpoint.attempt')>json_extract(r.document,'$.data.checkpoint.attempt')) ORDER BY id").iterate(scope.instance_id, query.after_run_id ?? '', projectId);
      const runs = [];
      for (const row of rows) {
        let result;
        try { result = this.forCoordinator(scope).read(projectId, String(row['id'])); }
        catch (error) { if (unavailable(error)) continue; throw error; }
        const artifact = result.artifact;
        const state = result.run.data.checkpoint;
        runs.push({ run_ref: recordRef(result.run), job_ref: recordRef(result.job), workflow: result.run.data.workflow,
          status: result.run.data.status, source_policy: result.job.data.source_policy,
          context_access: state ? 'available' : 'revoked',
          input_refs: state ? result.job.data.input_refs : [],
          next_action: sessionAction(result, now),
          recorded_next_action: result.next_action,
          review_recorded: Boolean(state?.['review']),
          blocker: state ? result.run.data.cause : null,
          artifact: artifact ? { ref: recordRef(artifact), status: artifact.data.status, content_hash: artifact.data.content_hash, source_refs: artifact.data.source_refs,
            content: Buffer.byteLength(artifact.data.content) <= 16384 ? artifact.data.content : null,
            content_omitted: Buffer.byteLength(artifact.data.content) > 16384 } : null,
          steps: result.steps.map(step => ({ ref: recordRef(step), status: step.data.status })),
          effects: result.actions.map(action => ({ ref: recordRef(action), status: action.data.status })) });
        if (runs.length > limit) break;
      }
      const moreRuns = runs.length > limit; if (moreRuns) runs.pop();
      const captures: { ref: ReturnType<typeof recordRef>; source_ref: ReturnType<typeof recordRef>; status: string }[] = [];
      for (const row of this.db.prepare("SELECT id FROM records WHERE instance_id=? AND kind='capture' AND id>? AND json_extract(document,'$.data.project_ref.id')=? AND json_extract(document,'$.data.processing_status')='pending' ORDER BY id").iterate(scope.instance_id, query.after_capture_id ?? '', projectId)) {
        try {
          const capture = raw.get(String(row['id'])) as StoredRecord<'capture'>;
          knowledge.source(projectId, capture.data.source_ref.id, capture.data.source_ref.revision);
          captures.push({ ref: recordRef(capture), source_ref: capture.data.source_ref, status: capture.data.processing_status });
        } catch (error) { if (unavailable(error)) continue; throw error; }
        if (captures.length > limit) break;
      }
      const moreCaptures = captures.length > limit; if (moreCaptures) captures.pop();
      const handoff = { profile: 'session-handoff-v1', generated_at: now, instance_id: scope.instance_id,
        project: context.project, sources: context.sources, decisions, claims,
        runs: { records: runs, next_cursor: moreRuns ? runs.at(-1)!.run_ref.id : null },
        pending_captures: { records: captures, next_cursor: moreCaptures ? captures.at(-1)!.ref.id : null },
        coverage: { scope: 'current_owner_project_and_accessible_evidence', execution: 'latest_coordinator_attempt_per_job', ordering: 'id_ascending_not_relevance',
          authoritative: false, mutations: false, legacy_workflows: 'Use workflow-read for pre-coordinator runs.',
          pending_capture_meaning: 'Standalone captures remain pending even when a separate source-ref workflow used them.',
          freshness: 'Regenerate before acting; current revisions, permissions, grants, leases and deadlines are checked by coordinator commands.' } };
      if (Buffer.byteLength(JSON.stringify(handoff)) > 262144) throw new DomainError('BUDGET_EXCEEDED', 'Session context exceeds 256 KiB. Use smaller pages or read individual records.');
      return { ...handoff, content_hash: hashJson(handoff) };
    });
  }
}
