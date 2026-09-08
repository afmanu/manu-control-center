import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { SqliteReviewBackend } from '../adapters/backends/sqlite/review.js';
import { DomainError } from '../core/errors.js';
import { recordRef } from '../core/knowledge.js';
import { hashText } from '../core/hashing.js';
import type { DraftInput } from '../core/review.js';
import type { Ref, StoredRecord } from '../core/models.js';
import { newRecord } from './fixtures.js';

const identity = { instance_id: 'instance-demo', actor_id: 'alice' }, project = newRecord('project').id;
const baseTime = '2026-09-08T10:05:00.000Z', expiry = '2099-01-01T00:00:00.000Z';
const code = (expected: string) => (error: unknown) => error instanceof DomainError && error.code === expected;
class FaultBackend extends SqliteReviewBackend {
  failProject() { this.db.exec("CREATE TEMP TRIGGER fail_project BEFORE UPDATE ON records WHEN NEW.kind='project' BEGIN SELECT RAISE(ABORT,'injected project failure'); END;"); }
  failRelation() { this.db.exec("CREATE TEMP TRIGGER fail_relation BEFORE INSERT ON records WHEN NEW.kind='relation' BEGIN SELECT RAISE(ABORT,'injected relation failure'); END;"); }
}
async function database(work: (value: ReturnType<typeof setup>) => void | Promise<void>) {
  const root = mkdtempSync(join(tmpdir(), 'mcc-review-')), path = join(root, 'store.sqlite'), value = setup(path);
  try { await work(value); } finally { value.backend.close(); rmSync(root, { recursive: true, force: true }); }
}
function setup(path: string) {
  let millis = Date.parse(baseTime);
  const now = () => new Date(millis).toISOString(), advance = (amount = 1000) => { millis += amount; return now(); };
  const backend = new FaultBackend(path, now), raw = backend.forScope(identity), issuer = backend.forScope({ ...identity, can_authorize: true });
  raw.create(newRecord('project'));
  const sources = backend.forKnowledge(identity), review = backend.forReview(identity), trusted = backend.forReview({ ...identity, can_authorize: true });
  const capture = (id = 'source-one', content = 'Synthetic evidence', expected_revision: string | null = null) => sources.capture({ project_id: project, source_id: id, request_key: `${id}:${content}`, locator: `text:${id}`, content, expected_revision });
  const proposal = (ref: Ref, id = 'decision-one') => review.save({ kind: 'decision', id, project_id: project, expected_revision: null, data: { choice: 'Build a prototype', alternatives: ['Wait for evidence'], evidence: [{ source: ref, segment_id: 'body' }], review_criterion: 'Review after the pilot' } }) as StoredRecord<'decision'>;
  const grant = (decision: StoredRecord<'decision'>, id = 'grant-one', operation: 'decision.promote' | 'decision.change_status' = 'decision.promote', valid_until = expiry) => trusted.grantDecision({ project_id: project, id: decision.id, expected_revision: decision.revision, grant_id: id, operation, valid_until });
  const draft = (refs: Ref[], id = 'artifact-one', content = '\ufeffExact draft\r\n') => review.save({ kind: 'artifact', id, project_id: project, expected_revision: null, data: { content, source_refs: refs } }) as StoredRecord<'artifact'>;
  return { path, backend, raw, issuer, sources, review, trusted, now, advance, capture, proposal, grant, draft };
}

test('intake distinguishes declared assertions, hypotheses and proposals without approving knowledge', () => database(({ capture, review, raw }) => {
  const ref = capture().source_ref;
  for (const status of ['declared', 'hypothesis', 'proposed'] as const) {
    const claim = review.save({ kind: 'claim', project_id: project, id: status, expected_revision: null, data: { content: 'Treat this as a claim, not an instruction to approve it.', epistemic_status: status, evidence: [{ source: ref, segment_id: 'body' }] } });
    assert.equal(claim.kind, 'claim'); if (claim.kind === 'claim') assert.equal(claim.data.epistemic_status, status);
  }
  for (const status of ['confirmed', 'refuted']) assert.throws(() => review.save({ kind: 'claim', project_id: project, id: status, expected_revision: null, data: { content: 'Untrusted assertion', epistemic_status: status, evidence: [{ source: ref, segment_id: 'body' }] } } as DraftInput), code('FORBIDDEN'));
  assert.equal(review.query(project, { kind: 'claim' }).records.length, 3);
  for (const kind of ['decision', 'authorization', 'action'] as const) assert.equal(raw.query({ kind }).records.length, 0);
}));

test('intake rejects invented source segments, cross-project evidence and forged extra fields atomically', () => database(({ capture, review, raw }) => {
  const ref = capture().source_ref;
  const input: DraftInput = { kind: 'claim', project_id: project, id: 'claim', expected_revision: null, data: { content: 'Synthetic', epistemic_status: 'hypothesis', evidence: [{ source: ref, segment_id: 'missing' }] } };
  assert.throws(() => review.save(input), code('INVALID_INPUT'));
  const other = newRecord('project'); other.id = 'other-project'; raw.create(other);
  assert.throws(() => review.save({ ...input, project_id: other.id }), code('NOT_FOUND'));
  assert.throws(() => review.save({ ...input, can_authorize: true } as DraftInput), code('INVALID_INPUT'));
  assert.equal(raw.query({ kind: 'claim' }).records.length, 0);
}));

test('decision promotion requires a persisted current content-bound grant and updates the project atomically', () => database(({ capture, proposal, review, grant, raw }) => {
  const decision = proposal(capture().source_ref);
  assert.throws(() => review.grantDecision({ project_id: project, id: decision.id, expected_revision: decision.revision, grant_id: 'injected', operation: 'decision.promote', valid_until: expiry }), code('FORBIDDEN'));
  assert.throws(() => review.changeDecision({ project_id: project, id: decision.id, expected_revision: decision.revision, grant_ref: { id: 'missing', revision: 'missing' }, status: 'active' }), code('NOT_FOUND'));
  assert.equal(raw.history(decision.id).length, 1);
  const authorization = grant(decision), active = review.changeDecision({ project_id: project, id: decision.id, expected_revision: decision.revision, grant_ref: recordRef(authorization), status: 'active' });
  assert.equal(active.decision.data.status, 'active'); assert.deepEqual(active.decision.data.promotion!.grant_ref, recordRef(authorization));
  assert.equal(active.decision.data.promotion!.at, active.decision.updated_at);
  const currentProject = raw.get(project); if (currentProject.kind === 'project') assert.deepEqual(currentProject.data.decision_refs, [recordRef(active.decision)]);
  assert.equal(review.query(project, { kind: 'decision' }).records.length, 1);
}));

test('a reviewed proposal edit invalidates its old content authorization', () => database(({ capture, proposal, grant, review }) => {
  const decision = proposal(capture().source_ref), authorization = grant(decision);
  const edited = review.save({ kind: 'decision', id: decision.id, project_id: project, expected_revision: decision.revision, data: { choice: 'Different commitment', alternatives: decision.data.alternatives, evidence: decision.data.evidence, review_criterion: decision.data.review_criterion } });
  assert.throws(() => review.changeDecision({ project_id: project, id: edited.id, expected_revision: edited.revision, grant_ref: recordRef(authorization), status: 'active' }), code('FORBIDDEN'));
}));

for (const variant of ['expired', 'revoked', 'wrong-actor', 'wrong-resource', 'wrong-destination', 'wrong-operation', 'wrong-hash', 'wildcard', 'stale-grant'] as const) test(`decision promotion rejects invalid authority (${variant}) without changing state`, () => database(({ capture, proposal, grant, issuer, review, advance, now, raw }) => {
  const decision = proposal(capture().source_ref); let authorization = grant(decision, 'grant-one', 'decision.promote', new Date(Date.parse(now()) + 1000).toISOString());
  const originalRef = recordRef(authorization);
  if (variant === 'expired') advance(1000);
  else {
    if (variant === 'revoked') authorization.data.revoked = true;
    if (variant === 'wrong-actor') authorization.data.actor_id = 'bob';
    if (variant === 'wrong-resource') authorization.data.resource_id = 'another-decision';
    if (variant === 'wrong-destination') authorization.data.destination = 'instance:elsewhere';
    if (variant === 'wrong-operation') authorization.data.operation = 'decision.change_status';
    if (variant === 'wildcard') authorization.data.content_hash = null;
    if (variant === 'wrong-hash') authorization.data.content_hash = hashText('wrong');
    authorization = issuer.update(authorization, authorization.revision) as StoredRecord<'authorization'>;
  }
  assert.throws(() => review.changeDecision({ project_id: project, id: decision.id, expected_revision: decision.revision, grant_ref: variant === 'stale-grant' ? originalRef : recordRef(authorization), status: 'active' }), code('FORBIDDEN'));
  assert.equal(raw.history(decision.id).length, 1); const current = raw.get(project); if (current.kind === 'project') assert.deepEqual(current.data.decision_refs, []);
}));

test('grant reuse is stable for the same reviewed scope and conflicts with a changed grant request', () => database(({ capture, proposal, grant, advance, raw }) => {
  const decision = proposal(capture().source_ref), first = grant(decision); advance();
  assert.deepEqual(grant(decision), first); assert.equal(raw.history(first.id).length, 1);
  assert.throws(() => grant(decision, first.id, 'decision.promote', '2098-01-01T00:00:00.000Z'), code('CONFLICT'));
}));

test('revocation requires a status-change grant and retains the formerly active decision in recorded history', () => database(({ capture, proposal, grant, review, raw, advance }) => {
  const decision = proposal(capture().source_ref), auth = grant(decision); const activeTime = advance();
  const active = review.changeDecision({ project_id: project, id: decision.id, expected_revision: decision.revision, grant_ref: recordRef(auth), status: 'active' }).decision;
  assert.throws(() => review.changeDecision({ project_id: project, id: active.id, expected_revision: active.revision, grant_ref: recordRef(auth), status: 'revoked' }), code('FORBIDDEN'));
  const revoke = grant(active, 'revoke-grant', 'decision.change_status'); advance();
  const revoked = review.changeDecision({ project_id: project, id: active.id, expected_revision: active.revision, grant_ref: recordRef(revoke), status: 'revoked' }).decision;
  assert.equal(revoked.data.status, 'revoked');
  const old = review.record(project, active.id, 'decision', { as_of: activeTime }); if (old.kind === 'decision') assert.equal(old.data.status, 'active');
  const current = raw.get(project); if (current.kind === 'project') assert.deepEqual(current.data.decision_refs, []);
  assert.throws(() => review.changeDecision({ project_id: project, id: revoked.id, expected_revision: revoked.revision, grant_ref: recordRef(auth), status: 'active' }), code('CONFLICT'));
}));

test('failure while linking a decision rolls back its promotion and history', () => database(({ capture, proposal, grant, review, backend, raw }) => {
  const decision = proposal(capture().source_ref), authorization = grant(decision), before = raw.get(project); backend.failProject();
  assert.throws(() => review.changeDecision({ project_id: project, id: decision.id, expected_revision: decision.revision, grant_ref: recordRef(authorization), status: 'active' }), /injected project failure/);
  assert.deepEqual(raw.get(decision.id), decision); assert.deepEqual(raw.get(project), before); assert.equal(raw.history(decision.id).length, 1);
}));

test('approved content stays exact while a related new draft can evolve independently', () => database(({ capture, draft, review, trusted, raw, advance }) => {
  const original = draft([capture().source_ref]);
  assert.throws(() => review.approveArtifact({ project_id: project, id: original.id, expected_revision: original.revision, source_policy: 'snapshot' }), code('FORBIDDEN'));
  const accepted = advance();
  const approved = trusted.approveArtifact({ project_id: project, id: original.id, expected_revision: original.revision, source_policy: 'snapshot' });
  assert.equal(approved.data.content, original.data.content); assert.equal(approved.data.content_hash, hashText(original.data.content)); assert.equal(approved.data.accepted_at, accepted);
  assert.throws(() => review.save({ kind: 'artifact', project_id: project, id: approved.id, expected_revision: approved.revision, data: { content: 'Changed', source_refs: approved.data.source_refs } }), code('CONFLICT'));
  const fork = review.forkArtifact({ project_id: project, approved_ref: recordRef(approved), draft_id: 'artifact-two' });
  review.save({ kind: 'artifact', project_id: project, id: fork.artifact.id, expected_revision: fork.artifact.revision, data: { content: 'A later draft', source_refs: approved.data.source_refs } });
  assert.deepEqual(review.record(project, approved.id, 'artifact', { revision: approved.revision }), approved);
  const relation = raw.get(fork.relation_ref.id); if (relation.kind === 'relation') assert.deepEqual(relation.data.to, recordRef(approved));
  assert.equal(review.query(project, { kind: 'artifact' }).records.length, 2);
}));

test('artifact fork failure leaves no orphan draft or changed approved version', () => database(({ capture, draft, trusted, review, backend, raw }) => {
  const original = draft([capture().source_ref]); const approved = trusted.approveArtifact({ project_id: project, id: original.id, expected_revision: original.revision, source_policy: 'snapshot' }); backend.failRelation();
  assert.throws(() => review.forkArtifact({ project_id: project, approved_ref: recordRef(approved), draft_id: 'orphan' }), /injected relation failure/);
  assert.equal(raw.query({ kind: 'artifact' }).records.length, 1); assert.deepEqual(raw.get(approved.id), approved);
}));

test('fresh source policy invalidates stale draft approval while snapshot preserves exact evidence', () => database(({ capture, draft, review, trusted, advance, raw }) => {
  const first = capture(), artifact = draft([first.source_ref]); advance(); const second = capture('source-one', 'Changed evidence', first.source_ref.revision);
  const snapshot = review.checkSources({ project_id: project, policy: 'snapshot', refs: [first.source_ref] });
  assert.deepEqual(snapshot.refs, [first.source_ref]); assert.equal(snapshot.invalidate, false); assert.deepEqual(snapshot.changed_source_ids, ['source-one']);
  const fresh = review.checkSources({ project_id: project, policy: 'fresh', refs: [first.source_ref] });
  assert.deepEqual(fresh.refs, [second.source_ref]); assert.equal(fresh.invalidate, true);
  assert.throws(() => trusted.approveArtifact({ project_id: project, id: artifact.id, expected_revision: artifact.revision, source_policy: 'fresh' }), code('STALE_PLAN'));
  assert.equal(raw.history(artifact.id).length, 1);
  const approved = trusted.approveArtifact({ project_id: project, id: artifact.id, expected_revision: artifact.revision, source_policy: 'snapshot' });
  assert.deepEqual(approved.data.source_refs, [first.source_ref]);
}));

test('current and recorded-time source/claim queries select revisions before matching', () => database(({ capture, sources, review, advance, now }) => {
  const first = capture(), t0 = now();
  const claim = review.save({ kind: 'claim', project_id: project, id: 'reported-state', expected_revision: null, data: { content: 'Reported amount: 10', epistemic_status: 'declared', evidence: [{ source: first.source_ref, segment_id: 'body' }] } });
  const t1 = advance(1), second = capture('source-one', 'Reported amount: 20', first.source_ref.revision);
  review.save({ kind: 'claim', project_id: project, id: claim.id, expected_revision: claim.revision, data: { content: 'Reported amount: 20', epistemic_status: 'declared', evidence: [{ source: second.source_ref, segment_id: 'body' }] } });
  assert.equal(sources.sourceAt(project, 'source-one', t0).revision, first.source_ref.revision);
  assert.equal(sources.sourceAt(project, 'source-one', t1).revision, second.source_ref.revision);
  assert.equal(sources.search(project, { text: 'Synthetic', as_of: t0 }).matches.length, 1);
  assert.equal(sources.search(project, { text: 'Synthetic', as_of: t1 }).matches.length, 0);
  assert.equal(review.query(project, { kind: 'claim', text: '10', as_of: t0 }).records[0]!.revision, claim.revision);
  assert.equal(review.query(project, { kind: 'claim', text: '10' }).records.length, 0);
  assert.equal(review.query(project, { kind: 'claim' }).coverage.claim_validity, 'not_inferred');
  assert.throws(() => sources.sourceAt(project, 'source-one', '2026-09-08T10:04:59.999Z'), code('NOT_FOUND'));
}));

test('same-timestamp versions are ordered by recorded sequence, and validity uses half-open intervals', () => database(({ capture, sources, raw, now }) => {
  const first = capture(); const second = capture('source-one', 'Newest at same millisecond', first.source_ref.revision);
  assert.equal(sources.sourceAt(project, 'source-one', now()).revision, second.source_ref.revision);
  const current = raw.get('source-one') as StoredRecord<'source'>;
  current.data.valid_from = '2026-09-01T00:00:00.000Z'; current.data.valid_to = '2026-09-05T00:00:00.000Z'; raw.update(current, current.revision);
  assert.equal(sources.search(project, { valid_at: current.data.valid_from }).matches.length, 1);
  assert.equal(sources.search(project, { valid_at: current.data.valid_to }).matches.length, 0);
  assert.equal(sources.search(project, { valid_at: '2026-09-04T23:59:59.999Z' }).matches.length, 1);
  assert.equal(sources.search(project, { valid_at: current.data.valid_from }).coverage.temporal!.validity_scope, 'source_availability_not_claim_truth');
}));

test('derived queries enforce current dependency access before LIMIT, including historical records', () => database(({ backend, raw, capture, proposal, review, now }) => {
  const p = raw.get(project); p.access.readers = ['bob']; raw.update(p, p.revision);
  const a = capture('source-private'), b = capture('source-visible');
  const hidden = proposal(a.source_ref, '00-hidden'), first = proposal(b.source_ref, '10-visible'); proposal(b.source_ref, '20-visible');
  const reader = backend.forReview({ ...identity, actor_id: 'bob' });
  assert.equal(reader.query(project, { kind: 'decision' }).records.length, 3);
  const source = raw.get(a.source_ref.id); source.access.readers = []; raw.update(source, source.revision);
  const page = reader.query(project, { kind: 'decision', as_of: now(), limit: 1 });
  assert.equal(page.records[0]!.id, first.id); assert.equal(page.next_cursor, first.id);
  assert.equal(reader.query(project, { kind: 'decision', limit: 1, after_id: page.next_cursor! }).records[0]!.id, '20-visible');
  assert.throws(() => reader.record(project, hidden.id, 'decision', { revision: hidden.revision }), code('NOT_FOUND'));
  assert.equal(JSON.stringify(page).includes('00-hidden'), false);
  assert.equal(review.query(project, { kind: 'decision' }).records.length, 3);
  const r = raw.get(first.id); r.access.readers = []; raw.update(r, r.revision);
  assert.throws(() => reader.record(project, first.id, 'decision', { as_of: now() }), code('NOT_FOUND'));
}));

test('new derived records inherit the intersection of project and source access', () => database(({ raw, capture, proposal }) => {
  const p = raw.get(project); p.access.readers = ['bob']; raw.update(p, p.revision);
  const source = capture().source_ref, restricted = raw.get(source.id); restricted.access.readers = []; raw.update(restricted, restricted.revision);
  const decision = proposal(source); assert.deepEqual(decision.access.readers, []);
}));

test('historical retrieval cannot cross current project or instance boundaries', () => database(({ backend, raw, capture, proposal, now }) => {
  const p = raw.get(project); p.access.readers = ['bob']; raw.update(p, p.revision);
  const receipt = capture(), decision = proposal(receipt.source_ref);
  const reader = backend.forReview({ ...identity, actor_id: 'bob' }); const sourceReader = backend.forKnowledge({ ...identity, actor_id: 'bob' });
  const revoked = raw.get(project); revoked.access.readers = []; raw.update(revoked, revoked.revision);
  assert.throws(() => reader.query(project, { kind: 'decision', as_of: now() }), code('NOT_FOUND'));
  assert.throws(() => sourceReader.sourceAt(project, receipt.source_ref.id, now()), code('NOT_FOUND'));
  const otherScope = { ...identity, instance_id: 'other' }, other = backend.forScope(otherScope), otherProject = newRecord('project'); otherProject.instance_id = 'other'; other.create(otherProject);
  const foreign = backend.forReview(otherScope); assert.equal(foreign.query(project, { kind: 'decision', as_of: now() }).records.length, 0);
  assert.throws(() => foreign.record(project, decision.id, 'decision', { revision: decision.revision }), code('NOT_FOUND'));
}));

test('temporal, policy and draft inputs reject ambiguous or invalid values without writes', () => database(({ capture, proposal, review, sources, path, now }) => {
  const source = capture().source_ref, decision = proposal(source), before = readFileSync(path);
  for (const as_of of ['2026-02-30T00:00:00.000Z', '2026-09-08', '2099-01-01T00:00:00.000Z', '2026-09-08T12:00:00.000+02:00']) {
    assert.throws(() => review.query(project, { kind: 'decision', as_of }), code('INVALID_INPUT'));
    assert.throws(() => sources.search(project, { as_of }), code('INVALID_INPUT'));
  }
  assert.throws(() => review.record(project, decision.id, 'decision', { revision: decision.revision, as_of: now() }), code('INVALID_INPUT'));
  assert.throws(() => review.checkSources({ project_id: project, policy: 'fresh', refs: [source, source] }), code('INVALID_INPUT'));
  assert.throws(() => sources.search(project, null as never), code('INVALID_INPUT'));
  assert.throws(() => review.query(project, { kind: 'decision', limit: 101 }), code('INVALID_INPUT'));
  assert.deepEqual(readFileSync(path), before);
}));

test('reopened read-only review and temporal queries preserve bytes and all directory entries', () => database(({ capture, proposal, review, path, now }) => {
  const source = capture().source_ref, decision = proposal(source), before = readFileSync(path), entries = readdirSync(join(path, '..'));
  const reopened = new SqliteReviewBackend(path, now, { readOnly: true });
  try {
    const read = reopened.forReview(identity); assert.deepEqual(read.record(project, decision.id, 'decision'), decision);
    assert.equal(read.query(project, { kind: 'decision', as_of: now() }).records.length, 1);
    read.checkSources({ project_id: project, policy: 'snapshot', refs: [source] });
    reopened.forKnowledge(identity).context(project, { as_of: now() });
    assert.deepEqual(review.record(project, decision.id, 'decision'), decision);
  } finally { reopened.close(); }
  assert.deepEqual(readFileSync(path), before); assert.deepEqual(readdirSync(join(path, '..')), entries);
}));

test('competing decision transitions commit once and preserve one current project reference', () => database(async ({ capture, proposal, grant, raw, path }) => {
  const decision = proposal(capture().source_ref), authorization = grant(decision);
  const change = { project_id: project, id: decision.id, expected_revision: decision.revision, grant_ref: recordRef(authorization), status: 'active' };
  const workerCode = `const {parentPort,workerData}=require('node:worker_threads');
import(${JSON.stringify(new URL('../adapters/backends/sqlite/review.js', import.meta.url).href)}).then(({SqliteReviewBackend})=>{const backend=new SqliteReviewBackend(workerData.path);parentPort.postMessage('ready');parentPort.once('message',()=>{try{backend.forReview(workerData.identity).changeDecision(workerData.change);parentPort.postMessage('committed');}catch(error){parentPort.postMessage(error.code);}finally{backend.close();}});});`;
  const workers = [0, 1].map(() => new Worker(workerCode, { eval: true, workerData: { path, identity, change } }));
  try {
    await Promise.all(workers.map(worker => new Promise<void>((resolve, reject) => { worker.once('message', () => resolve()); worker.once('error', reject); })));
    const result = await Promise.all(workers.map(worker => new Promise<string>((resolve, reject) => { worker.once('message', resolve); worker.once('error', reject); worker.postMessage('go'); })));
    assert.deepEqual(result.sort(), ['CONFLICT', 'committed']); assert.equal(raw.history(decision.id).length, 2);
    const p = raw.get(project); if (p.kind === 'project') assert.equal(p.data.decision_refs.length, 1);
  } finally { await Promise.all(workers.map(worker => worker.terminate())); }
}));


test('approved artifact queries and forks respect current source and project permissions', () => database(({ backend, raw, issuer, capture, draft, trusted, review, now }) => {
  const projectRecord = raw.get(project); projectRecord.access.readers = ['bob']; raw.update(projectRecord, projectRecord.revision);
  const source = capture().source_ref, artifact = draft([source]);
  const writable = raw.get(artifact.id); writable.access.writers = ['bob']; const updated = issuer.update(writable, writable.revision) as StoredRecord<'artifact'>;
  assert.throws(() => backend.forScope({ ...identity, actor_id: 'bob', can_authorize: true }).update({ ...updated, data: { ...updated.data, status: 'approved', accepted_at: now() } }, updated.revision), code('FORBIDDEN'));
  const approved = trusted.approveArtifact({ project_id: project, id: artifact.id, expected_revision: updated.revision, source_policy: 'snapshot' });
  const reader = backend.forReview({ ...identity, actor_id: 'bob' }); assert.equal(reader.query(project, { kind: 'artifact' }).records.length, 1);
  const restricted = raw.get(source.id); restricted.access.readers = []; raw.update(restricted, restricted.revision);
  assert.equal(reader.query(project, { kind: 'artifact', as_of: now() }).records.length, 0);
  assert.throws(() => reader.record(project, approved.id, 'artifact', { revision: approved.revision }), code('NOT_FOUND'));
  const fork = review.forkArtifact({ project_id: project, approved_ref: recordRef(approved), draft_id: 'restricted-fork' });
  assert.deepEqual(fork.artifact.access.readers, []); assert.deepEqual(fork.artifact.access.writers, []);
}));


test('trusted grant revocation blocks future use without changing an already active decision', () => database(({ capture, proposal, grant, review, trusted }) => {
  const decision = proposal(capture().source_ref), authorization = grant(decision);
  const request = { project_id: project, id: decision.id, grant_ref: recordRef(authorization) };
  assert.throws(() => review.revokeDecisionGrant(request), code('FORBIDDEN'));
  const revoked = trusted.revokeDecisionGrant(request); assert.equal(revoked.data.revoked, true);
  assert.throws(() => review.changeDecision({ ...request, expected_revision: decision.revision, status: 'active' }), code('FORBIDDEN'));
  const secondGrant = grant(decision, 'second-grant');
  const active = review.changeDecision({ project_id: project, id: decision.id, expected_revision: decision.revision, grant_ref: recordRef(secondGrant), status: 'active' }).decision;
  trusted.revokeDecisionGrant({ ...request, grant_ref: recordRef(secondGrant) });
  assert.deepEqual(review.record(project, decision.id, 'decision'), active);
}));


test('claim validity is explicit, half-open and independent of recorded time or source availability', () => database(({ capture, review, advance, now, raw }) => {
  const source = capture().source_ref;
  const save = (id: string, validity?: { valid_from: string; valid_to: string | null }) => review.save({ kind: 'claim', project_id: project, id, expected_revision: null, data: { content: 'Reported amount', epistemic_status: 'declared', evidence: [{ source, segment_id: 'body' }], ...(validity ? { validity } : {}) } });
  const t0 = now(); save('00-unknown'); advance();
  const start = '2026-09-01T00:00:00.000Z', end = '2026-09-05T00:00:00.000Z';
  const bounded = save('10-bounded', { valid_from: start, valid_to: end });
  save('20-later', { valid_from: end, valid_to: null });
  assert.equal(review.query(project, { kind: 'claim' }).records.length, 3);
  const earlier = review.query(project, { kind: 'claim', valid_at: start, limit: 1 });
  assert.deepEqual(earlier.records.map(record => record.id), [bounded.id]); assert.equal(earlier.next_cursor, null);
  assert.equal(earlier.coverage.claim_validity, 'declared_interval_filter_unknown_excluded');
  assert.deepEqual(review.query(project, { kind: 'claim', valid_at: end }).records.map(record => record.id), ['20-later']);
  assert.equal(review.query(project, { kind: 'claim', as_of: t0, valid_at: start }).records.length, 0);
  assert.throws(() => save('invalid', { valid_from: end, valid_to: start }), code('INVALID_INPUT'));
  assert.equal(raw.query({ kind: 'claim' }).records.length, 3);
}));
