import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SqliteCoordinatorBackend } from '../adapters/backends/sqlite/coordinator.js';
import { SimulatedMailbox } from '../adapters/effects/simulated-mailbox.js';
import { DomainError } from '../core/errors.js';
import { defaultCoordinatorBudget } from '../core/coordinator.js';
import type { CoordinatorInput, CoordinatorResult, EffectRequest, EffectTarget } from '../core/coordinator.js';
import type { CompleteWorkflow } from '../core/workflows.js';
import { semanticCriteria } from '../core/workflows.js';
import { recordRef } from '../core/knowledge.js';
import type { StoredRecord } from '../core/models.js';
import { newRecord, now } from './fixtures.js';

const scope = { instance_id: 'instance-demo', actor_id: 'alice' }, project = newRecord('project').id;
const code = (value: string) => (error: unknown) => error instanceof DomainError && error.code === value;
class FaultBackend extends SqliteCoordinatorBackend {
  failArtifact() { this.db.exec("CREATE TEMP TRIGGER fail_artifact BEFORE INSERT ON records WHEN NEW.kind='artifact' BEGIN SELECT RAISE(ABORT,'injected artifact failure'); END;"); }
  clearFault() { this.db.exec('DROP TRIGGER fail_artifact'); }
  failCompletion() { this.db.exec("CREATE TEMP TRIGGER fail_complete BEFORE UPDATE ON records WHEN NEW.kind='job' AND json_extract(NEW.document,'$.data.status')='succeeded' BEGIN SELECT RAISE(ABORT,'injected completion failure'); END;"); }
}
function setup(mode: 'confirm' | 'lose_response' | 'no_effect' | 'unavailable' = 'confirm') {
  let millis = Date.parse(now); const advanceTime = (delta: number) => { millis += delta; };
  const root = mkdtempSync(join(tmpdir(), 'mcc-coordinator-')), mailboxPath = join(root, 'mailbox.sqlite');
  const mailbox = new SimulatedMailbox(mailboxPath, 'local-mailbox', mode), targets = new Map<string, EffectTarget>([['local-mailbox', mailbox]]);
  const backend = new FaultBackend(':memory:', () => new Date(millis).toISOString(), targets);
  const raw = backend.forScope(scope); raw.create(newRecord('project'));
  const owner = backend.forCoordinator({ ...scope, can_authorize: true }), worker = backend.forCoordinator(scope), review = backend.forReview({ ...scope, can_authorize: true });
  const source = () => backend.forKnowledge(scope).capture({ project_id: project, source_id: 'meeting', request_key: 'meeting', locator: 'text:meeting', content: 'A prototype is proposed.', expected_revision: null });
  const request = (policy: 'snapshot' | 'fresh' = 'snapshot', key = 'status'): CoordinatorInput => ({ project_id: project, workflow: 'project-status', request_key: key, source_policy: policy, budget: { ...defaultCoordinatorBudget } });
  const claim = (result: CoordinatorResult, executor = 'worker-one', lease_ms = 10000) => worker.claim({ project_id: project, run_ref: recordRef(result.run), executor_id: executor, lease_ms });
  const read = (result: CoordinatorResult) => worker.read(project, result.run.id);
  const approval = (result: CoordinatorResult): CompleteWorkflow => ({ project_id: project, run_ref: recordRef(result.run), artifact_ref: recordRef(result.artifact!), content_hash: result.artifact!.data.content_hash, review: { verdict: 'accept' as const, checks: semanticCriteria.map(criterion => ({ criterion, outcome: 'pass' as const, note: `Synthetic owner review checked ${criterion} against the pinned evidence and project.` })) } });
  const approved = () => {
    const sourceRef = source().source_ref;
    const artifact = review.save({ kind: 'artifact', id: 'approved', project_id: project, expected_revision: null, data: { content: 'An exact approved synthetic artifact.', source_refs: [sourceRef] } }) as StoredRecord<'artifact'>;
    return review.approveArtifact({ project_id: project, id: artifact.id, expected_revision: artifact.revision, source_policy: 'snapshot' });
  };
  const delivery = (): CoordinatorResult => owner.submit({ project_id: project, request_key: 'delivery', workflow: 'deliver-approved-artifact', source_policy: 'snapshot', budget: { ...defaultCoordinatorBudget }, delivery: { artifact_ref: recordRef(approved()), target_id: 'local-mailbox', destination: 'simulator:recipient-one' } });
  const authorize = (result: CoordinatorResult, id = 'delivery-grant') => owner.authorize({ project_id: project, run_ref: recordRef(result.run), grant_id: id, valid_until: new Date(millis + 60000).toISOString() });
  return { root, mailboxPath, backend, raw, owner, worker, review, mailbox, targets, source, request, claim, read, approval, approved, delivery, authorize, advanceTime };
}
async function database(work: (value: ReturnType<typeof setup>) => Promise<void> | void, mode: Parameters<typeof setup>[0] = 'confirm') { const value = setup(mode); try { await work(value); } finally { value.backend.close(); value.mailbox.close(); rmSync(value.root, { recursive: true, force: true }); } }

test('coordinator completes project status with persisted steps, local action receipts and exact owner review', () => database(async ({ owner, worker, request, claim, approval, raw }) => {
  const queued = owner.submit(request()); assert.equal(queued.run.data.status, 'queued'); assert.equal(queued.steps.length, 7);
  const lease = claim(queued).lease, prepared = await worker.advance(project, lease);
  assert.equal(prepared.run.data.status, 'waiting_input'); assert.equal(prepared.steps.filter(step => step.data.status === 'succeeded').length, 5);
  for (const step of prepared.steps.filter(step => step.data.status === 'succeeded')) {
    assert.equal(step.data.owner_id, lease.executor_id); assert.equal(step.data.fencing_token, lease.fencing_token);
  }
  assert.equal(prepared.actions[0]!.data.status, 'confirmed'); assert.ok(prepared.actions[0]!.data.result);
  await assert.rejects(() => worker.advance(project, lease), code('CONFLICT'));
  assert.throws(() => worker.review(approval(prepared)), code('FORBIDDEN'));
  const reviewed = owner.review(approval(prepared)); assert.equal(reviewed.run.data.status, 'paused');
  const completed = await worker.advance(project, claim(reviewed).lease);
  assert.equal(completed.job.data.status, 'succeeded'); assert.equal(completed.run.data.status, 'succeeded'); assert.equal(completed.steps.every(step => step.data.status === 'succeeded'), true);
  assert.equal(completed.artifact!.data.content, prepared.artifact!.data.content); assert.equal(completed.actions.every(action => action.data.status === 'confirmed'), true);
  assert.equal(raw.query({ kind: 'decision' }).records.length, 0); assert.equal(owner.submit(request()).replayed, true);
}));

test('coordinator reuses meeting extraction and integrates only the capture after exact approval', () => database(async ({ owner, worker, claim, approval, raw }) => {
  const text = 'A prototype is proposed.';
  const queued = owner.submit({ project_id: project, workflow: 'meeting-to-brief', request_key: 'meeting-workflow', source_policy: 'fresh', budget: { ...defaultCoordinatorBudget }, meeting: { source: { capture: { source_id: 'meeting', request_key: 'meeting', locator: 'text:meeting', content: text, expected_revision: null } }, selections: [{ segment_id: 'body', start: 0, end: text.length, category: 'proposal' }] } });
  const prepared = await worker.advance(project, claim(queued).lease); assert.equal(JSON.parse(prepared.artifact!.data.content).meeting.items[0].quote, text);
  assert.equal((raw.query({ kind: 'capture' }).records[0] as StoredRecord<'capture'>).data.processing_status, 'pending');
  const completed = await worker.advance(project, claim(owner.review(approval(prepared))).lease);
  assert.equal(completed.run.data.status, 'succeeded'); assert.equal((raw.query({ kind: 'capture' }).records[0] as StoredRecord<'capture'>).data.processing_status, 'integrated');
}));

test('atomic claims and fencing reject an old executor even after it reads the newest revision', () => database(async ({ owner, worker, request, claim, read, advanceTime }) => {
  const queued = owner.submit(request()), first = claim(queued, 'first', 10);
  assert.throws(() => claim(queued, 'second'), code('CONFLICT')); assert.throws(() => claim(first.result, 'second'), code('CONFLICT'));
  advanceTime(11); const replacement = claim(read(queued), 'second'); assert.ok(replacement.lease.fencing_token > first.lease.fencing_token);
  await assert.rejects(() => worker.advance(project, first.lease), code('CONFLICT')); assert.throws(() => worker.renew(project, first.lease, 100), code('CONFLICT'));
  assert.equal((await worker.advance(project, replacement.lease)).run.data.status, 'waiting_input');
}));

for (const policy of ['fresh', 'snapshot'] as const) test(`${policy} retains or invalidates dependent steps after project context changes`, () => database(async ({ owner, worker, request, claim, approval, raw, authorize, read }) => {
  const prepared = await worker.advance(project, claim(owner.submit(request(policy))).lease);
  const current = raw.get(project) as StoredRecord<'project'>; raw.update({ ...current, data: { ...current.data, next_action: 'A changed next action.' } }, current.revision);
  const reviewed = owner.review(approval(prepared));
  if (policy === 'snapshot') { assert.equal((await worker.advance(project, claim(reviewed).lease)).run.data.status, 'succeeded'); return; }
  assert.equal(reviewed.run.data.status, 'blocked'); assert.equal(reviewed.artifact, null);
  for (const name of ['input', 'extract']) assert.equal(reviewed.steps.find(step => step.data.step_id === name)!.id, prepared.steps.find(step => step.data.step_id === name)!.id);
  assert.notEqual(reviewed.steps.find(step => step.data.step_id === 'draft')!.id, prepared.steps.find(step => step.data.step_id === 'draft')!.id);
  authorize(reviewed, 'refresh-grant'); const refreshed = await worker.advance(project, claim(read(reviewed)).lease);
  assert.notEqual(refreshed.artifact!.id, prepared.artifact!.id); assert.equal(JSON.parse(refreshed.artifact!.data.content).project.next_action, 'A changed next action.');
  const completed = await worker.advance(project, claim(owner.review(approval(refreshed))).lease); assert.equal(completed.run.data.status, 'succeeded');
  assert.equal((raw.get(prepared.artifact!.id) as StoredRecord<'artifact'>).data.status, 'draft');
}));

test('fresh transcript changes require new classification and preserve the original artifact', () => database(async ({ owner, worker, source, claim, approval, backend }) => {
  const captured = source(), queued = owner.submit({ project_id: project, workflow: 'meeting-to-brief', request_key: 'meeting-workflow', source_policy: 'fresh', budget: { ...defaultCoordinatorBudget }, meeting: { source: { ref: captured.source_ref }, selections: [{ segment_id: 'body', start: 0, end: 24, category: 'proposal' }] } });
  const prepared = await worker.advance(project, claim(queued).lease);
  const changed = backend.forKnowledge(scope).capture({ project_id: project, source_id: 'meeting', request_key: 'changed', locator: 'text:changed', content: 'No proposal is approved.', expected_revision: captured.source_ref.revision });
  const blocked = owner.review(approval(prepared)); assert.equal(blocked.run.data.status, 'blocked');
  const revised = owner.revise({ project_id: project, run_ref: recordRef(blocked.run), source_ref: changed.source_ref, selections: [{ segment_id: 'body', start: 0, end: 24, category: 'open_question' }] });
  const draft = await worker.advance(project, claim(revised).lease); assert.notEqual(draft.artifact!.id, prepared.artifact!.id); assert.equal(JSON.parse(draft.artifact!.data.content).meeting.items[0].quote, 'No proposal is approved.');
}));

test('lost target response remains uncertain, does not resend and reconciles to one delivery', () => database(async ({ delivery, authorize, worker, claim, mailbox }) => {
  const queued = delivery(); authorize(queued);
  const unknown = await worker.advance(project, claim(queued).lease); assert.equal(unknown.run.data.status, 'blocked'); assert.equal(unknown.actions[0]!.data.status, 'unknown'); assert.equal(mailbox.deliveryCount(), 1);
  const stillUnknown = await worker.advance(project, claim(unknown).lease); assert.equal(stillUnknown.actions[0]!.data.attempts, 1); assert.equal(mailbox.deliveryCount(), 1);
  const done = await worker.reconcile(project, claim(stillUnknown).lease); assert.equal(done.run.data.status, 'succeeded'); assert.equal(done.actions[0]!.data.reconciliation, 'effect_confirmed'); assert.equal(mailbox.deliveryCount(), 1);
}, 'lose_response'));

test('revoked and missing effect grants prevent invocation; existing scope can be reused without another grant', () => database(async ({ delivery, authorize, worker, claim, owner, raw, backend, mailbox }) => {
  let queued = delivery(); let missing = await worker.advance(project, claim(queued).lease); assert.equal(missing.actions[0]!.data.attempts, 0); assert.equal(mailbox.deliveryCount(), 0);
  const grant = authorize(missing), issuer = backend.forScope({ ...scope, can_authorize: true });
  issuer.update({ ...grant, data: { ...grant.data, revoked: true } }, grant.revision);
  let denied = await worker.advance(project, claim(owner.read(project, queued.run.id)).lease); assert.equal(denied.run.data.status, 'blocked'); assert.equal(mailbox.deliveryCount(), 0);
  authorize(denied, 'replacement-grant'); const done = await worker.advance(project, claim(owner.read(project, queued.run.id)).lease); assert.equal(done.run.data.status, 'succeeded'); assert.equal(mailbox.deliveryCount(), 1);
  const action = done.actions[0]!; assert.throws(() => raw.update({ ...action, data: { ...action.data, destination: 'simulator:other' } }, action.revision), code('CONFLICT'));
}));

test('a proven no-effect retry uses a new run with the same action key and consumed attempt budget', () => database(async ({ delivery, authorize, worker, claim, owner, targets, mailbox, mailboxPath }) => {
  const queued = delivery(); authorize(queued); const failed = await worker.advance(project, claim(queued).lease); assert.equal(failed.run.data.status, 'failed'); assert.equal(failed.actions[0]!.data.reconciliation, 'no_effect_proven');
  const retry = owner.retry({ project_id: project, run_ref: recordRef(failed.run) }); assert.equal(retry.run.data.previous_run!.id, failed.run.id);
  const recovered = new SimulatedMailbox(mailboxPath); targets.set('local-mailbox', recovered);
  try { const again = await worker.advance(project, claim(retry).lease); assert.equal(again.run.data.status, 'succeeded'); assert.equal(again.actions[0]!.id, failed.actions[0]!.id); assert.equal(again.actions[0]!.data.attempts, 2); assert.equal(mailbox.deliveryCount(), 1); assert.equal(again.actions[0]!.data.receipt_refs.length, 2); }
  finally { recovered.close(); }
}, 'no_effect'));

test('step/time/attempt limits stop new work and numeric unmetered budgets fail closed', () => database(async ({ owner, worker, request, claim, advanceTime }) => {
  const short = request('snapshot', 'steps'); short.budget.max_steps = 4;
  const stopped = await worker.advance(project, claim(owner.submit(short)).lease); assert.equal(stopped.run.data.status, 'blocked'); assert.equal(stopped.artifact, null); assert.equal(stopped.actions[0]!.data.attempts, 0);
  const timed = request('snapshot', 'time'); timed.budget.timeout_ms = 5; const queued = owner.submit(timed); advanceTime(6); const expired = await worker.advance(project, claim(queued).lease); assert.equal(expired.artifact, null); assert.match(expired.next_action, /BUDGET_EXCEEDED/);
  const metered = request(); metered.budget.max_tokens = 100; assert.throws(() => owner.submit(metered), code('CAPABILITY_UNAVAILABLE'));
}));

test('cancellation fences a waiting executor and never starts its reserved work', () => database(async ({ owner, worker, request, claim }) => {
  const leased = claim(owner.submit(request())); const cancelled = owner.cancel({ project_id: project, run_ref: recordRef(leased.result.run) });
  assert.equal(cancelled.run.data.status, 'cancelled'); assert.equal(cancelled.job.data.status, 'cancelled');
  await assert.rejects(() => worker.advance(project, leased.lease), code('CONFLICT'));
}));

test('cancellation during target invocation retains uncertainty until a replacement executor reconciles', () => database(async ({ delivery, authorize, worker, claim, owner, targets, mailbox }) => {
  let unblock!: () => void; const gate = new Promise<void>(resolve => { unblock = resolve; }); let started!: () => void; const began = new Promise<void>(resolve => { started = resolve; });
  targets.set('local-mailbox', { id: mailbox.id, version: mailbox.version, simulated: true, invoke: async request => { started(); await gate; return mailbox.invoke(request); }, reconcile: request => mailbox.reconcile(request), verify: (request, result) => mailbox.verify(request, result) });
  const queued = delivery(); authorize(queued); const leased = claim(queued); const running = worker.advance(project, leased.lease); await began;
  const cancelled = owner.cancel({ project_id: project, run_ref: recordRef(owner.read(project, queued.run.id).run) }); assert.equal(cancelled.run.data.status, 'cancel_requested');
  unblock(); await assert.rejects(() => running, code('CONFLICT')); assert.equal(mailbox.deliveryCount(), 1);
  const result = await worker.reconcile(project, claim(owner.read(project, queued.run.id), 'replacement').lease); assert.equal(result.run.data.status, 'cancelled'); assert.equal(result.actions[0]!.data.status, 'confirmed'); assert.equal(result.run.data.accepted, false);
}));

test('atomic local failure leaves no artifact and a fenced no-effect proof; retry does not duplicate capture', () => database(async ({ backend, raw, owner, worker, request, claim }) => {
  backend.failArtifact(); const failed = await worker.advance(project, claim(owner.submit(request())).lease); assert.equal(failed.run.data.status, 'failed'); assert.equal(failed.actions[0]!.data.reconciliation, 'no_effect_proven'); assert.equal(raw.query({ kind: 'artifact' }).records.length, 0);
  backend.clearFault(); const retried = owner.retry({ project_id: project, run_ref: recordRef(failed.run) }); const prepared = await worker.advance(project, claim(retried).lease); assert.equal(prepared.run.data.status, 'waiting_input'); assert.equal(prepared.actions[0]!.data.attempts, 2);
}));

test('simulator seals an absent attempt before claiming no-effect, blocking a late old invocation', async () => {
  const target = new SimulatedMailbox(':memory:');
  try {
    const { hashJson } = await import('../core/hashing.js');
    const request: EffectRequest = { action_id: 'action', attempt: 1, logical_key: 'key', destination: 'simulator:one', payload: { text: 'synthetic' }, payload_hash: hashJson({ text: 'synthetic' }) };
    const proof = await target.reconcile(request); assert.equal(proof.status, 'no_effect_proven'); assert.equal(await target.verify(request, proof), true);
    assert.equal((await target.invoke(request)).status, 'no_effect_proven'); assert.equal(target.deliveryCount(), 0);
    const delivered = await target.invoke({ ...request, attempt: 2 }); assert.equal(delivered.status, 'confirmed'); assert.equal(target.deliveryCount(), 1);
    await assert.rejects(() => target.invoke({ ...request, destination: 'simulator:other' }), code('CONFLICT'));
    assert.equal(await target.verify(request, { status: 'confirmed', receipt: { forged: true } }), false);
  } finally { target.close(); }
});

test('fresh invalidation after review discards the old acceptance intent without approving its artifact', () => database(async ({ owner, worker, request, claim, approval, raw, authorize, read }) => {
  const prepared = await worker.advance(project, claim(owner.submit(request('fresh'))).lease);
  const reviewed = owner.review(approval(prepared)), originalAction = reviewed.actions.find(action => action.data.effect_name === 'workflow.accept')!;
  const current = raw.get(project) as StoredRecord<'project'>; raw.update({ ...current, data: { ...current.data, next_action: 'Changed after semantic review.' } }, current.revision);
  const invalidated = await worker.advance(project, claim(reviewed).lease); assert.equal(invalidated.run.data.status, 'blocked'); assert.equal((raw.get(originalAction.id) as StoredRecord<'action'>).data.status, 'rejected');
  authorize(invalidated, 'new-preparation-grant'); const replacement = await worker.advance(project, claim(read(invalidated)).lease);
  const done = await worker.advance(project, claim(owner.review(approval(replacement))).lease); assert.equal(done.run.data.status, 'succeeded');
  assert.equal((raw.get(prepared.artifact!.id) as StoredRecord<'artifact'>).data.status, 'draft');
}));

test('expiry during target invocation fences the response; a new lease reconciles the committed target effect', () => database(async ({ delivery, authorize, worker, claim, owner, targets, mailbox, advanceTime }) => {
  let unblock!: () => void; const gate = new Promise<void>(resolve => { unblock = resolve; }); let started!: () => void; const began = new Promise<void>(resolve => { started = resolve; });
  targets.set('local-mailbox', { id: mailbox.id, version: mailbox.version, simulated: true, invoke: async request => { started(); await gate; return mailbox.invoke(request); }, reconcile: request => mailbox.reconcile(request), verify: (request, result) => mailbox.verify(request, result) });
  const queued = delivery(); authorize(queued); const leased = claim(queued, 'old', 10); const running = worker.advance(project, leased.lease); await began;
  advanceTime(11); const replacement = claim(owner.read(project, queued.run.id), 'new'); unblock(); await assert.rejects(() => running, code('CONFLICT'));
  const done = await worker.reconcile(project, replacement.lease); assert.equal(done.run.data.status, 'succeeded'); assert.equal(mailbox.deliveryCount(), 1); assert.equal(done.actions[0]!.data.attempts, 1);
}));

test('budget exhaustion while the target is in flight preserves its receipt and blocks further steps', () => database(async ({ delivery, authorize, worker, claim, owner, targets, mailbox, advanceTime }) => {
  const queued = delivery(); authorize(queued);
  targets.set('local-mailbox', { id: mailbox.id, version: mailbox.version, simulated: true, invoke: async request => { const result = await mailbox.invoke(request); advanceTime(defaultCoordinatorBudget.timeout_ms + 1); return result; }, reconcile: request => mailbox.reconcile(request), verify: (request, result) => mailbox.verify(request, result) });
  const leased = claim(queued); await assert.rejects(() => worker.advance(project, leased.lease), code('CONFLICT'));
  const recovered = await worker.reconcile(project, claim(owner.read(project, queued.run.id), 'recovery').lease); assert.equal(recovered.actions[0]!.data.status, 'confirmed'); assert.equal(recovered.run.data.status, 'blocked'); assert.equal(mailbox.deliveryCount(), 1);
  const cancelled = owner.cancel({ project_id: project, run_ref: recordRef(recovered.run) }); assert.equal(cancelled.run.data.status, 'cancelled'); assert.equal(cancelled.actions[0]!.data.status, 'confirmed');
}));

test('retry limits and step reservations remain consumed after a failed local transaction', () => database(async ({ backend, owner, worker, request, claim }) => {
  backend.failArtifact(); const input = request(); input.budget.max_steps = 5; input.budget.max_attempts = 1;
  const failed = await worker.advance(project, claim(owner.submit(input)).lease); assert.equal(failed.run.data.status, 'failed');
  assert.equal(failed.run.data.checkpoint?.['started_steps'], 5); assert.equal(failed.actions[0]!.data.attempts, 1);
  assert.throws(() => owner.retry({ project_id: project, run_ref: recordRef(failed.run) }), code('BUDGET_EXCEEDED'));
}));

test('unavailable targets and forged receipts cannot confirm or silently retry effects', () => database(async ({ delivery, authorize, worker, claim, targets, owner, mailbox }) => {
  const queued = delivery(); authorize(queued); targets.clear();
  const missing = await worker.advance(project, claim(queued).lease); assert.equal(missing.actions[0]!.data.attempts, 0); assert.match(missing.next_action, /CAPABILITY_UNAVAILABLE/);
  targets.set('local-mailbox', { id: mailbox.id, version: mailbox.version, simulated: true, invoke: async () => ({ status: 'confirmed', receipt: { forged: true } }), reconcile: request => mailbox.reconcile(request), verify: (request, result) => mailbox.verify(request, result) });
  const forged = await worker.advance(project, claim(owner.read(project, queued.run.id)).lease); assert.equal(forged.actions[0]!.data.status, 'unknown'); assert.equal(mailbox.deliveryCount(), 0);
  const noEffect = await worker.reconcile(project, claim(forged).lease); assert.equal(noEffect.actions[0]!.data.reconciliation, 'no_effect_proven'); assert.equal(noEffect.run.data.status, 'failed');
}));

test('current source revocation redacts owned run content while still allowing cancellation', () => database(async ({ backend, raw, owner, worker, claim, review }) => {
  const current = raw.get(project) as StoredRecord<'project'>; raw.update({ ...current, access: { ...current.access, readers: ['bob'] } }, current.revision);
  const bob = backend.forScope({ ...scope, actor_id: 'bob' }), source = newRecord('source'); source.id = 'restricted'; source.access = { owner_id: 'bob', readers: ['alice'], writers: [] }; source.data.project_ref = recordRef(raw.get(project)); const saved = bob.create(source) as StoredRecord<'source'>;
  let artifact = review.save({ kind: 'artifact', project_id: project, id: 'restricted-artifact', expected_revision: null, data: { content: 'Restricted synthetic content', source_refs: [recordRef(saved)] } }) as StoredRecord<'artifact'>;
  artifact = review.approveArtifact({ project_id: project, id: artifact.id, expected_revision: artifact.revision, source_policy: 'snapshot' });
  const queued = owner.submit({ workflow: 'deliver-approved-artifact', project_id: project, request_key: 'restricted-delivery', source_policy: 'snapshot', budget: defaultCoordinatorBudget, delivery: { artifact_ref: recordRef(artifact), destination: 'simulator:one', target_id: 'local-mailbox' } }); const leased = claim(queued);
  bob.update({ ...saved, access: { ...saved.access, readers: [] } }, saved.revision);
  const redacted = owner.read(project, queued.run.id); assert.equal(redacted.artifact, null); assert.equal(redacted.run.data.checkpoint, null); assert.deepEqual(redacted.actions, []);
  await assert.rejects(() => worker.advance(project, leased.lease), code('NOT_FOUND'));
  const cancelled = owner.cancel({ project_id: project, run_ref: recordRef(redacted.run) }); assert.equal(cancelled.run.data.status, 'cancelled'); assert.equal(cancelled.run.data.checkpoint, null);
}));

test('semantic rejection is durable and final-write failure rolls back local approval', () => database(async ({ owner, worker, request, claim, approval, backend, raw }) => {
  const prepared = await worker.advance(project, claim(owner.submit(request())).lease), rejectedReview = approval(prepared);
  rejectedReview.review = { verdict: 'reject', checks: rejectedReview.review.checks.map((check, index) => ({ ...check, outcome: index === 0 ? 'fail' : 'pass' })) };
  const rejected = owner.review(rejectedReview); assert.equal(rejected.run.data.status, 'failed'); assert.equal(rejected.artifact!.data.status, 'draft');
  const retry = owner.retry({ project_id: project, run_ref: recordRef(rejected.run) }); const again = await worker.advance(project, claim(retry).lease); const approved = owner.review(approval(again)); backend.failCompletion();
  const failed = await worker.advance(project, claim(approved).lease); assert.equal(failed.run.data.status, 'failed'); assert.equal((raw.get(again.artifact!.id) as StoredRecord<'artifact'>).data.status, 'draft');
}));

test('renewal and pause retain a single current lease while invalidating the released token', () => database(async ({ owner, worker, request, claim, advanceTime }) => {
  const first = claim(owner.submit(request()), 'worker', 10); advanceTime(5);
  const renewed = worker.renew(project, first.lease, 100); assert.equal(renewed.run.data.status, 'running'); advanceTime(10);
  const paused = worker.pause(project, first.lease); assert.equal(paused.run.data.status, 'paused');
  await assert.rejects(() => worker.advance(project, first.lease), code('CONFLICT'));
  const second = claim(paused, 'new-worker'); assert.ok(second.lease.fencing_token > first.lease.fencing_token);
  assert.throws(() => worker.renew(project, second.lease, 60001), code('INVALID_INPUT'));
}));

for (const defect of ['expired', 'destination', 'wildcard'] as const) test(`effect dispatch rejects a ${defect} grant before the simulator is invoked`, () => database(async ({ delivery, authorize, worker, claim, backend, mailbox, owner, advanceTime }) => {
  const queued = delivery(), grant = authorize(queued);
  if (defect === 'expired') advanceTime(60001);
  else {
    const issuer = backend.forScope({ ...scope, can_authorize: true });
    const changed = issuer.update({ ...grant, data: { ...grant.data, ...(defect === 'destination' ? { destination: 'simulator:other' } : { content_hash: null }) } }, grant.revision);
    const raw = backend.forScope(scope), action = raw.get(queued.actions[0]!.id) as StoredRecord<'action'>;
    raw.update({ ...action, data: { ...action.data, grant_ref: recordRef(changed) } }, action.revision);
  }
  const stopped = await worker.advance(project, claim(owner.read(project, queued.run.id)).lease); assert.equal(stopped.run.data.status, 'blocked'); assert.equal(stopped.actions[0]!.data.attempts, 0); assert.equal(mailbox.deliveryCount(), 0);
}));

test('cancellation can reconcile absence before a late old target call, which remains sealed', () => database(async ({ delivery, authorize, worker, claim, owner, targets, mailbox }) => {
  let unblock!: () => void; const gate = new Promise<void>(resolve => { unblock = resolve; }); let started!: () => void; const began = new Promise<void>(resolve => { started = resolve; });
  targets.set('local-mailbox', { id: mailbox.id, version: mailbox.version, simulated: true, invoke: async request => { started(); await gate; return mailbox.invoke(request); }, reconcile: request => mailbox.reconcile(request), verify: (request, result) => mailbox.verify(request, result) });
  const queued = delivery(); authorize(queued); const pending = worker.advance(project, claim(queued).lease); await began;
  const cancelled = owner.cancel({ project_id: project, run_ref: recordRef(owner.read(project, queued.run.id).run) });
  const done = await worker.reconcile(project, claim(cancelled, 'replacement').lease); assert.equal(done.run.data.status, 'cancelled'); assert.equal(done.actions[0]!.data.reconciliation, 'no_effect_proven');
  unblock(); await assert.rejects(() => pending, code('CONFLICT')); assert.equal(mailbox.deliveryCount(), 0);
}));
