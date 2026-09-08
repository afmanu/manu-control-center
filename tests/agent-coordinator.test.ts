import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SqliteCoordinatorBackend } from '../adapters/backends/sqlite/coordinator.js';
import { CodexRuntime, codexDefinition } from '../adapters/runtimes/codex.js';
import { defaultCoordinatorBudget } from '../core/coordinator.js';
import { agentCapability } from '../core/agent-workflows.js';
import type { AgentContext } from '../core/agent-workflows.js';
import type { RuntimeAdapter } from '../core/adapters.js';
import type { CoordinatorInput, CoordinatorResult } from '../core/coordinator.js';
import type { StoredRecord } from '../core/models.js';
import { DomainError } from '../core/errors.js';
import { recordRef } from '../core/knowledge.js';
import { semanticCriteria } from '../core/workflows.js';
import { newRecord, now } from './fixtures.js';

const scope = { instance_id: 'instance-demo', actor_id: 'alice' }, project = newRecord('project').id;
const errorCode = (code: string) => (error: unknown) => error instanceof DomainError && error.code === code;
function setup() {
  let time = Date.parse(now), calls = 0;
  let execute = async (input: Parameters<RuntimeAdapter['invoke']>[0]): ReturnType<RuntimeAdapter['invoke']> => {
    const context = input.input as unknown as AgentContext;
    return { output: { classifications: context.meeting?.segments.map(segment => ({ segment_id: segment.id, quote: segment.text, category: 'proposal' })) ?? [], statements: [{ text: 'A prototype is proposed; approval is not established.', evidence_ids: [context.meeting ? 'source-0' : 'project'] }] }, evidence_refs: ['mock:synthetic'], metadata: { simulated: true, usage: { input_tokens: 10, output_tokens: 10 } } };
  };
  const runtime: RuntimeAdapter = { definition: codexDefinition, inspect: async () => ({ availability: 'available', capabilities: [], evidence_refs: ['mock'] }), invoke: async input => { calls++; return execute(input); } };
  const runtimes = new Map([['codex', runtime]]), backend = new SqliteCoordinatorBackend(':memory:', () => new Date(time).toISOString(), new Map(), {}, runtimes), raw = backend.forScope(scope);
  raw.create(newRecord('project'));
  const owner = backend.forCoordinator({ ...scope, can_authorize: true }), worker = backend.forCoordinator(scope), knowledge = backend.forKnowledge(scope);
  const source = knowledge.capture({ project_id: project, source_id: 'meeting', request_key: 'meeting', locator: 'text:synthetic', content: 'A prototype is proposed.', expected_revision: null }).source_ref;
  const input = (workflow: 'meeting-to-brief' | 'project-status' = 'meeting-to-brief', policy: 'snapshot' | 'fresh' = 'snapshot'): CoordinatorInput => ({ workflow, project_id: project, request_key: 'runtime', source_policy: policy, runtime: codexDefinition, budget: { ...defaultCoordinatorBudget }, ...(workflow === 'meeting-to-brief' ? { meeting: { source: { ref: source }, selections: [] } } : {}) } as CoordinatorInput);
  const claim = (value: CoordinatorResult, executor_id = 'worker', lease_ms = 60000) => worker.claim({ project_id: project, run_ref: recordRef(value.run), executor_id, lease_ms }).lease;
  const read = (value: CoordinatorResult) => worker.read(project, value.run.id);
  const approve = (value: CoordinatorResult) => owner.review({ project_id: project, run_ref: recordRef(value.run), artifact_ref: recordRef(value.artifact!), content_hash: value.artifact!.data.content_hash, review: { verdict: 'accept', checks: semanticCriteria.map(criterion => ({ criterion, outcome: 'pass', note: 'Synthetic mechanism test only; real semantic quality is evaluated separately.' })) } });
  return { backend, raw, owner, worker, source, knowledge, input, claim, read, approve, runtimes, calls: () => calls, set: (handler: typeof execute) => { execute = handler; }, tick: (delta: number) => { time += delta; } };
}
async function database(work: (value: ReturnType<typeof setup>) => Promise<void>) { const value = setup(); try { await work(value); } finally { value.backend.close(); } }
for (const workflow of ['meeting-to-brief', 'project-status'] as const) test(`agent ${workflow} uses one inference, C19 checkpoint, bounded output and exact human approval`, () => database(async ({ owner, worker, input, claim, read, approve, calls, raw }) => {
  const queued = owner.submit(input(workflow));
  assert.equal(queued.steps.length, 8); assert.equal(queued.run.data.workflow.version, '0.1.0-coordinated-agent');
  const generated = await worker.advance(project, claim(queued)); assert.equal(generated.run.data.status, 'paused'); assert.equal(generated.artifact, null);
  const prepared = await worker.advance(project, claim(read(generated))); assert.equal(calls(), 1); assert.equal(prepared.run.data.status, 'waiting_input');
  const content = JSON.parse(prepared.artifact!.data.content); assert.equal(content.profile, 'agent-reviewed'); assert.equal(content.agent.runtime_id, 'codex'); assert.ok(content.agent.output.statements.length);
  assert.throws(() => worker.review({ project_id: project } as never), errorCode('INVALID_INPUT'));
  const completed = await worker.advance(project, claim(approve(prepared))); assert.equal(completed.run.data.status, 'succeeded'); assert.equal(completed.artifact!.data.content, prepared.artifact!.data.content); assert.equal(calls(), 1);
  assert.equal(raw.query({ kind: 'decision' }).records.length, 0); assert.equal(raw.query({ kind: 'job' }).records.length, 1);
}));
for (const failure of ['forged_citation', 'omitted_quote', 'wrong_shape', 'forged_quote'] as const) test(`agent output ${failure} never reaches artifact storage`, () => database(async ({ owner, worker, input, claim, raw, set }) => {
  set(async () => ({ output: failure === 'wrong_shape' ? { approve: true } : { classifications: failure === 'omitted_quote' ? [] : [{ segment_id: 'body', quote: failure === 'forged_quote' ? 'The prototype is approved.' : 'A prototype is proposed.', category: 'proposal' }], statements: [{ text: 'A proposal.', evidence_ids: [failure === 'forged_citation' ? 'private-source' : 'source-0'] }] }, evidence_refs: [] }));
  const result = await worker.advance(project, claim(owner.submit(input()))); assert.equal(result.run.data.status, 'failed'); assert.equal(raw.query({ kind: 'artifact' }).records.length, 0);
}));
for (const policy of ['fresh', 'snapshot'] as const) test(`agent ${policy} checks context across the invocation and artifact boundary`, () => database(async ({ owner, worker, input, claim, raw }) => {
  const generated = await worker.advance(project, claim(owner.submit(input('project-status', policy))));
  const before = raw.get(project) as StoredRecord<'project'>; raw.update({ ...before, data: { ...before.data, next_action: 'New action after inference.' } }, before.revision);
  const result = await worker.advance(project, claim(generated));
  if (policy === 'fresh') { assert.equal(result.run.data.status, 'failed'); assert.equal(result.artifact, null); }
  else { assert.equal(result.run.data.status, 'waiting_input'); assert.equal(JSON.parse(result.artifact!.data.content).project.next_action, before.data.next_action); }
}));
test('revoked runtime grant prevents dispatch and context access is checked before passing model input', () => database(async ({ backend, owner, worker, input, claim, raw, calls, source }) => {
  const queued = owner.submit(input()), issuer = backend.forScope({ ...scope, can_authorize: true });
  const grant = raw.query({ kind: 'authorization' }).records.find(record => record.kind === 'authorization' && record.data.operation === 'runtime.synthesize') as StoredRecord<'authorization'>;
  issuer.update({ ...grant, data: { ...grant.data, revoked: true } }, grant.revision);
  const denied = await worker.advance(project, claim(queued)); assert.equal(denied.run.data.status, 'blocked'); assert.equal(calls(), 0);
  const record = raw.get(source.id) as StoredRecord<'source'>; raw.update({ ...record, data: { ...record.data, project_ref: null } }, record.revision);
  assert.equal(worker.read(project, denied.run.id).run.data.checkpoint, null); assert.throws(() => claim(worker.read(project, denied.run.id)), errorCode('NOT_FOUND'));
}));
for (const race of ['cancel', 'takeover', 'fresh_change', 'revoke'] as const) test(`agent result cannot commit after ${race}`, () => database(async ({ owner, worker, input, claim, read, raw, set, tick, backend }) => {
  let finish!: () => void; const gate = new Promise<void>(resolve => { finish = resolve; }); let start!: () => void; const began = new Promise<void>(resolve => { start = resolve; });
  set(async () => { start(); await gate; return { output: { classifications: [], statements: [{ text: 'Project status.', evidence_ids: ['project'] }] }, evidence_refs: [] }; });
  const queued = owner.submit(input('project-status', 'fresh')), lease = claim(queued, 'old', 10000), result = worker.advance(project, lease); await began;
  if (race === 'cancel') owner.cancel({ project_id: project, run_ref: recordRef(read(queued).run) });
  if (race === 'takeover') { tick(10001); claim(read(queued), 'new'); }
  if (race === 'fresh_change') { const record = raw.get(project) as StoredRecord<'project'>; raw.update({ ...record, data: { ...record.data, next_action: 'Changed.' } }, record.revision); }
  if (race === 'revoke') { const grant = raw.query({ kind: 'authorization' }).records.find(record => record.kind === 'authorization' && record.data.operation === 'runtime.synthesize') as StoredRecord<'authorization'>; backend.forScope({ ...scope, can_authorize: true }).update({ ...grant, data: { ...grant.data, revoked: true } }, grant.revision); }
  finish(); if (['cancel', 'takeover'].includes(race)) await assert.rejects(() => result, errorCode('CONFLICT')); else assert.equal((await result).run.data.status, 'failed');
  assert.equal(raw.query({ kind: 'artifact' }).records.length, 0);
}));
test('failed inference requires an explicit new attempt and retains started-step usage', () => database(async ({ owner, worker, input, claim, set, calls }) => {
  set(async () => { throw new DomainError('TIMEOUT', 'Synthetic failure'); });
  const failed = await worker.advance(project, claim(owner.submit(input()))); assert.equal(failed.run.data.status, 'failed'); assert.equal(calls(), 1);
  const retry = owner.retry({ project_id: project, run_ref: recordRef(failed.run) }); assert.equal(retry.run.data.checkpoint!['started_steps'], 1);
  const again = await worker.advance(project, claim(retry)); assert.equal(again.run.data.status, 'failed'); assert.equal(calls(), 2); assert.equal(again.run.data.previous_run!.id, failed.run.id);
}));
test('runtime context budget and unavailable adapter prevent inference', () => database(async ({ owner, worker, input, claim, runtimes, calls }) => {
  runtimes.clear(); const blocked = await worker.advance(project, claim(owner.submit(input()))); assert.equal(blocked.run.data.status, 'blocked'); assert.equal(calls(), 0);
}));
test('Codex inspection fails closed for missing binaries without claiming authentication', async () => {
  assert.equal((await new CodexRuntime({ executable: '/nonexistent/mcc-codex' }).inspect()).availability, 'unavailable');
  await assert.rejects(() => new CodexRuntime().invoke({ scope, capability: { ...agentCapability, version: 'unsupported' }, input: {}, source_refs: [] }), errorCode('CAPABILITY_UNAVAILABLE'));
});
test('agent definition declares inference and deterministic extraction separately from human review', async () => {
  const { agentWorkflowDefinition } = await import('../core/workflow-definitions.js');
  const { assertContract } = await import('../core/validation.js');
  for (const id of ['meeting-to-brief', 'project-status'] as const) {
    const definition = agentWorkflowDefinition(id, 'snapshot'); assertContract('workflow', definition);
    assert.equal(definition.steps[0]!.type, 'agent'); assert.equal(definition.steps.find(step => step.id === 'review')!.type, 'human');
  }
});
test('runtime access revocation after generation redacts model evidence and prevents artifact creation', () => database(async ({ owner, worker, input, claim, raw, source }) => {
  const generated = await worker.advance(project, claim(owner.submit(input())));
  const record = raw.get(source.id) as StoredRecord<'source'>; raw.update({ ...record, data: { ...record.data, project_ref: null } }, record.revision);
  const redacted = worker.read(project, generated.run.id); assert.equal(redacted.run.data.checkpoint, null); assert.deepEqual(redacted.steps, []);
  const cancelled = owner.cancel({ project_id: project, run_ref: recordRef(redacted.run) }); assert.equal(cancelled.run.data.status, 'cancelled'); assert.equal(raw.query({ kind: 'artifact' }).records.length, 0);
}));
test('runtime grants can be replaced explicitly without changing the original context', () => database(async ({ backend, owner, worker, input, claim, raw, read }) => {
  const queued = owner.submit(input()), grant = raw.query({ kind: 'authorization' }).records.find(record => record.kind === 'authorization' && record.data.operation === 'runtime.synthesize') as StoredRecord<'authorization'>;
  backend.forScope({ ...scope, can_authorize: true }).update({ ...grant, data: { ...grant.data, revoked: true } }, grant.revision);
  const blocked = await worker.advance(project, claim(queued)); owner.authorize({ project_id: project, run_ref: recordRef(blocked.run), grant_id: 'replacement', valid_until: '2026-09-08T11:00:00.000Z' });
  assert.equal((await worker.advance(project, claim(read(blocked)))).run.data.status, 'paused');
}));
test('runtime heartbeat observes cancellation and aborts a running inference', () => database(async ({ owner, worker, input, claim, read, set }) => {
  let started!: () => void; const began = new Promise<void>(resolve => { started = resolve; }); let aborted = false;
  set(async ({ signal }) => { started(); return await new Promise((_resolve, reject) => { signal!.addEventListener('abort', () => { aborted = true; reject(new DomainError('CANCELLED', 'Aborted mock inference')); }, { once: true }); }); });
  const queued = owner.submit(input()), running = worker.advance(project, claim(queued)); await began;
  owner.cancel({ project_id: project, run_ref: recordRef(read(queued).run) });
  await assert.rejects(() => running, errorCode('CONFLICT')); assert.equal(aborted, true); assert.equal(read(queued).run.data.status, 'cancelled');
}));
test('runtime reservation consumes budget before inference and never resets it for artifact preparation', () => database(async ({ owner, worker, input, claim, calls }) => {
  const request = input(); request.budget.max_steps = 1;
  const generated = await worker.advance(project, claim(owner.submit(request))); assert.equal(generated.run.data.status, 'paused'); assert.equal(calls(), 1);
  const stopped = await worker.advance(project, claim(generated)); assert.equal(stopped.run.data.status, 'blocked'); assert.equal(stopped.artifact, null); assert.equal(calls(), 1);
}));
test('fresh agent invalidation requires a new context grant and new review', () => database(async ({ owner, worker, input, claim, approve, raw, read, calls }) => {
  const generated = await worker.advance(project, claim(owner.submit(input('project-status', 'fresh'))));
  const prepared = await worker.advance(project, claim(generated)), reviewed = approve(prepared);
  const record = raw.get(project) as StoredRecord<'project'>; raw.update({ ...record, data: { ...record.data, next_action: 'Changed after review.' } }, record.revision);
  const invalidated = await worker.advance(project, claim(reviewed)); assert.equal(invalidated.run.data.status, 'blocked'); assert.equal(invalidated.artifact, null);
  assert.notEqual(invalidated.steps.find(step => step.data.step_id === 'extract')!.id, prepared.steps.find(step => step.data.step_id === 'extract')!.id);
  owner.authorize({ project_id: project, run_ref: recordRef(invalidated.run), grant_id: 'fresh-context', valid_until: '2026-09-08T11:00:00.000Z' });
  const regenerated = await worker.advance(project, claim(read(invalidated))); assert.equal(regenerated.run.data.status, 'paused');
  const replacement = await worker.advance(project, claim(regenerated)); assert.equal(replacement.run.data.status, 'waiting_input'); assert.notEqual(replacement.artifact!.id, prepared.artifact!.id); assert.equal(calls(), 2);
}));
test('takeover marks an unfinished inference failed instead of silently invoking it again', () => database(async ({ owner, worker, input, claim, read, set, tick, calls }) => {
  let finish!: () => void; const gate = new Promise<void>(resolve => { finish = resolve; }); let start!: () => void; const began = new Promise<void>(resolve => { start = resolve; });
  set(async () => { start(); await gate; return { output: { classifications: [], statements: [{ text: 'Project state.', evidence_ids: ['project'] }] }, evidence_refs: [] }; });
  const queued = owner.submit(input('project-status')), running = worker.advance(project, claim(queued, 'old', 10)); await began;
  tick(11); const replacement = claim(read(queued), 'new');
  const interrupted = await worker.advance(project, replacement); assert.equal(interrupted.run.data.status, 'failed'); assert.equal(calls(), 1);
  assert.match(interrupted.next_action, /explicit retry/i); finish(); await assert.rejects(() => running, errorCode('CONFLICT'));
}));
