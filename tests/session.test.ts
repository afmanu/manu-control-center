import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SqliteSessionBackend } from '../adapters/backends/sqlite/session.js';
import { defaultCoordinatorBudget } from '../core/coordinator.js';
import { recordRef } from '../core/knowledge.js';
import { DomainError } from '../core/errors.js';
import { semanticCriteria } from '../core/workflows.js';
import { hashJson } from '../core/hashing.js';
import type { StoredRecord } from '../core/models.js';
import { newRecord, now } from './fixtures.js';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scope = { instance_id: 'instance-demo', actor_id: 'alice', can_authorize: true }, project = newRecord('project').id;
const code = (value: string) => (error: unknown) => error instanceof DomainError && error.code === value;
function setup() {
  let time = Date.parse(now);
  const backend = new SqliteSessionBackend(':memory:', () => new Date(time).toISOString()), raw = backend.forScope(scope);
  raw.create(newRecord('project'));
  const coordinator = backend.forCoordinator(scope), knowledge = backend.forKnowledge(scope);
  const submit = (key: string) => coordinator.submit({ workflow: 'project-status', project_id: project, request_key: key, source_policy: 'snapshot', budget: defaultCoordinatorBudget });
  const capture = (id: string, content = 'A prototype is proposed.') => knowledge.capture({ project_id: project, source_id: id, request_key: id, locator: 'text:synthetic', content, expected_revision: null });
  return { backend, raw, coordinator, knowledge, submit, capture, tick: (delta: number) => { time += delta; } };
}
test('session retrieves purpose, active decision, uncertainty and exact evidence without granting authority', () => {
  const { backend, raw, capture } = setup();
  try {
    const source = capture('meeting').source_ref, review = backend.forReview(scope);
    const proposed = review.save({ kind: 'decision', id: 'decision', project_id: project, expected_revision: null, data: { choice: 'Review the prototype.', alternatives: [], evidence: [{ source, segment_id: 'body' }], review_criterion: 'Review before delivery.' } });
    const grant = review.grantDecision({ project_id: project, id: proposed.id, expected_revision: proposed.revision, operation: 'decision.promote', grant_id: 'grant', valid_until: '2026-09-08T20:00:00.000Z' });
    review.changeDecision({ project_id: project, id: proposed.id, expected_revision: proposed.revision, grant_ref: recordRef(grant), status: 'active' });
    review.save({ kind: 'claim', id: 'hypothesis', project_id: project, expected_revision: null, data: { content: 'The prototype may help.', epistemic_status: 'hypothesis', evidence: [{ source, segment_id: 'body' }] } });
    const before = raw.query({}).records, view = backend.session(scope, project);
    assert.equal(view.project.purpose, newRecord('project').data.purpose);
    assert.equal((view.decisions.records[0]! as StoredRecord<'decision'>).data.status, 'active');
    assert.equal((view.claims.records[0]! as StoredRecord<'claim'>).data.epistemic_status, 'hypothesis');
    assert.deepEqual(view.sources.matches[0]!.source_ref, source);
    assert.equal(view.pending_captures.records.length, 1);
    assert.deepEqual(raw.query({}).records, before);
    const { content_hash, ...body } = view; assert.equal(hashJson(body), content_hash);
    assert.equal(JSON.stringify(view).includes('valid_until'), false);
  } finally { backend.close(); }
});
test('session run pages are stable and expose only the latest attempt of each job', async () => {
  const { backend, coordinator, submit } = setup();
  try {
    const one = submit('one'); submit('two'); submit('three');
    const draft = await coordinator.advance(project, coordinator.claim({ project_id: project, run_ref: recordRef(one.run), executor_id: 'worker', lease_ms: 60000 }).lease);
    const failed = coordinator.review({ project_id: project, run_ref: recordRef(draft.run), artifact_ref: recordRef(draft.artifact!), content_hash: draft.artifact!.data.content_hash, review: { verdict: 'reject', checks: semanticCriteria.map(criterion => ({ criterion, outcome: 'fail', note: 'Synthetic review failure for retry pagination.' })) } });
    const retry = coordinator.retry({ project_id: project, run_ref: recordRef(failed.run) });
    const ids: string[] = []; let cursor: string | null = null;
    do { const view = backend.session(scope, project, { limit: 1, ...(cursor ? { after_run_id: cursor } : {}) }); ids.push(...view.runs.records.map(run => run.run_ref.id)); cursor = view.runs.next_cursor; } while (cursor);
    assert.equal(ids.length, 3); assert.equal(new Set(ids).size, 3); assert.ok(ids.includes(retry.run.id)); assert.ok(!ids.includes(one.run.id));
  } finally { backend.close(); }
});
test('session respects live leases, takeover boundary, cancellation, and expired deadlines', () => {
  const { backend, coordinator, submit, tick } = setup();
  try {
    const queued = submit('one'); assert.equal(backend.session(scope, project).runs.records[0]!.next_action.operation, 'session-continue');
    coordinator.claim({ project_id: project, run_ref: recordRef(queued.run), executor_id: 'old', lease_ms: 1000 });
    assert.equal(backend.session(scope, project).runs.records[0]!.next_action.operation, 'wait');
    tick(1001); assert.equal(backend.session(scope, project).runs.records[0]!.next_action.operation, 'session-continue');
    tick(defaultCoordinatorBudget.timeout_ms); assert.equal(backend.session(scope, project).runs.records[0]!.next_action.operation, 'inspect');
    coordinator.cancel({ project_id: project, run_ref: recordRef(coordinator.read(project, queued.run.id).run) });
    assert.equal(backend.session(scope, project).runs.records[0]!.next_action.operation, 'none');
  } finally { backend.close(); }
});
test('session reports pending review and preserves its pinned draft across later artifact edits', async () => {
  const { backend, coordinator, submit, raw } = setup();
  try {
    const queued = submit('one'), lease = coordinator.claim({ project_id: project, run_ref: recordRef(queued.run), executor_id: 'worker', lease_ms: 60000 }).lease;
    const draft = await coordinator.advance(project, lease), view = backend.session(scope, project).runs.records[0]!;
    assert.equal(view.next_action.operation, 'review'); assert.equal(view.artifact!.content, draft.artifact!.data.content);
    assert.equal(view.review_recorded, false); assert.ok(!JSON.stringify(view).includes('fencing_token'));
    const artifact = raw.get(draft.artifact!.id) as StoredRecord<'artifact'>;
    // Artifact revisions are intentionally not retargeted by a view: the original pinned draft is retained.
    backend.forReview(scope).save({ kind: 'artifact', project_id: project, id: artifact.id, expected_revision: artifact.revision, data: { content: 'x'.repeat(20000), source_refs: [] } });
    assert.equal(backend.session(scope, project).runs.records[0]!.artifact!.content_hash, draft.artifact!.data.content_hash);
  } finally { backend.close(); }
});
test('session redacts revoked execution context and filters inaccessible sources and derived knowledge before pagination', () => {
  const { backend, capture, raw, coordinator } = setup();
  try {
    const receipt = capture('secret', 'UNTRUSTED_SECRET'); capture('visible');
    backend.forReview(scope).save({ kind: 'claim', id: 'secret-claim', project_id: project, expected_revision: null, data: { content: 'SECRET_CLAIM', epistemic_status: 'hypothesis', evidence: [{ source: receipt.source_ref, segment_id: 'body' }] } });
    coordinator.submit({ workflow: 'meeting-to-brief', project_id: project, request_key: 'secret', source_policy: 'snapshot', budget: defaultCoordinatorBudget, meeting: { source: { ref: receipt.source_ref }, selections: [{ segment_id: 'body', start: 0, end: 'UNTRUSTED_SECRET'.length, category: 'context' }] } });
    const source = raw.get(receipt.source_ref.id) as StoredRecord<'source'>;
    raw.update({ ...source, data: { ...source.data, project_ref: null } }, source.revision);
    const view = backend.session(scope, project, { limit: 1 });
    assert.equal(view.sources.matches[0]!.source_ref.id, 'visible'); assert.equal(view.claims.records.length, 0);
    assert.equal(view.runs.records[0]!.context_access, 'revoked'); assert.equal(view.runs.records[0]!.next_action.operation, 'inspect');
    assert.equal(view.runs.records[0]!.artifact, null); assert.equal(JSON.stringify(view).includes('UNTRUSTED_SECRET'), false); assert.equal(JSON.stringify(view).includes('SECRET_CLAIM'), false);
    assert.equal(view.pending_captures.records[0]!.source_ref.id, 'visible');
    assert.throws(() => backend.session({ ...scope, actor_id: 'bob' }, project), code('NOT_FOUND'));
    assert.throws(() => backend.session({ ...scope, instance_id: 'other' }, project), code('NOT_FOUND'));
  } finally { backend.close(); }
});
test('session separates projects and rejects malformed pages without modifying state', () => {
  const { backend, raw, submit } = setup();
  try {
    submit('one'); const other = raw.create({ ...newRecord('project'), id: 'other-project' });
    assert.equal(backend.session(scope, other.id).runs.records.length, 0);
    for (const query of [{ limit: 0 }, { limit: 26 }, { after_run_id: '' }, { actor_id: 'bob' }]) assert.throws(() => backend.session(scope, project, query as never), code('INVALID_INPUT'));
  } finally { backend.close(); }
});
test('session bounds oversized knowledge instead of presenting silent incomplete context', () => {
  const { backend, capture } = setup();
  try {
    const source = capture('source').source_ref;
    backend.forReview(scope).save({ kind: 'claim', id: 'large', project_id: project, expected_revision: null, data: { content: 'x'.repeat(270000), epistemic_status: 'hypothesis', evidence: [{ source, segment_id: 'body' }] } });
    assert.throws(() => backend.session(scope, project), code('BUDGET_EXCEEDED'));
  } finally { backend.close(); }
});
test('session source and pending capture cursors enumerate independent complete pages', () => {
  const { backend, capture } = setup();
  try {
    capture('one'); capture('two'); capture('three');
    const first = backend.session(scope, project, { limit: 2 });
    assert.equal(first.sources.matches.length, 2); assert.equal(first.pending_captures.records.length, 2);
    const second = backend.session(scope, project, { limit: 2, after_source_id: first.sources.next_cursor!, after_capture_id: first.pending_captures.next_cursor! });
    assert.equal(second.sources.matches.length, 1); assert.equal(second.pending_captures.records.length, 1);
    assert.equal(second.sources.next_cursor, null); assert.equal(second.pending_captures.next_cursor, null);
    assert.equal(new Set([...first.sources.matches, ...second.sources.matches].map(item => item.source_ref.id)).size, 3);
  } finally { backend.close(); }
});
test('session omits an oversized draft with an exact retrievable reference instead of clipping approved bytes', async () => {
  const { backend, raw, submit, coordinator } = setup();
  try {
    const original = raw.get(project) as StoredRecord<'project'>;
    raw.update({ ...original, data: { ...original.data, purpose: 'Purpose '.repeat(2500) } }, original.revision);
    const queued = submit('large'), draft = await coordinator.advance(project, coordinator.claim({ project_id: project, run_ref: recordRef(queued.run), executor_id: 'worker', lease_ms: 60000 }).lease);
    const view = backend.session(scope, project).runs.records[0]!.artifact!;
    assert.equal(view.content, null); assert.equal(view.content_omitted, true);
    assert.deepEqual(view.ref, recordRef(draft.artifact!));
    assert.equal((backend.forReview(scope).record(project, view.ref.id, 'artifact', { revision: view.ref.revision }) as StoredRecord<'artifact'>).data.content_hash, view.content_hash);
  } finally { backend.close(); }
});
test('fresh CLI processes recover both workflows and preserve review, revisions and read-only bytes', () => {
  const result = JSON.parse(execFileSync(process.execPath, [fileURLToPath(new URL('../../examples/session-demo.mjs', import.meta.url))], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 }));
  assert.equal(result.ok, true); assert.equal(result.runtime_invoked, false);
});
