import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { Worker } from 'node:worker_threads';
import { existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SqliteCoordinatorBackend } from '../adapters/backends/sqlite/coordinator.js';
import { SimulatedMailbox } from '../adapters/effects/simulated-mailbox.js';
import { recoverLocalConstruction } from '../adapters/interfaces/local/installation.js';
import { defaultCoordinatorBudget } from '../core/coordinator.js';
import type { ClaimRequest, CoordinatorInput } from '../core/coordinator.js';
import { recordRef } from '../core/knowledge.js';

const requestFile = fileURLToPath(new URL('../../examples/install-request.json', import.meta.url)), request = JSON.parse(readFileSync(requestFile, 'utf8'));
const scope = { instance_id: request.instance_id as string, actor_id: request.owner_id as string }, project: string = request.project.id;
const cli = fileURLToPath(new URL('../cli/main.js', import.meta.url)), module = new URL('../adapters/backends/sqlite/coordinator.js', import.meta.url).href, targetModule = new URL('../adapters/effects/simulated-mailbox.js', import.meta.url).href;
const run = (args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', env: { ...process.env, MANU_CONTROL_CENTER_LANG: 'en' } });
function success(args: string[]) { const result = run(args); assert.equal(result.status, 0, result.stderr); return JSON.parse(result.stdout); }
async function temporary(work: (root: string, directory: string) => Promise<void> | void) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'mcc-local-coordinator-'))), directory = join(root, 'instance');
  try { success(['create', requestFile, directory, '--actor', scope.actor_id]); await work(root, directory); }
  finally { rmSync(root, { recursive: true, force: true }); }
}
const input = (): CoordinatorInput => ({ project_id: project, workflow: 'project-status', request_key: 'status', source_policy: 'snapshot', budget: { ...defaultCoordinatorBudget } });

test('packaged-style coordinator CLI completes both workflows and reconciles a single simulated delivery', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../../examples/coordinator-demo.mjs', import.meta.url))], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr); const evidence = JSON.parse(result.stdout); assert.equal(evidence.simulated_deliveries, 1); assert.equal(evidence.real_external_deliveries, 0); assert.equal(evidence.durable_steps, true);
});

test('coordinator CLI reads without writes, rejects forged scope and preserves locale parsing', () => temporary((root, directory) => {
  const file = join(root, 'input.json'); writeFileSync(file, JSON.stringify({ workflow: 'project-status', request_key: 'status', source_policy: 'snapshot' }));
  const queued = success(['coordinator-submit', requestFile, directory, file, '--actor', scope.actor_id]);
  const before = readFileSync(join(directory, 'store.sqlite')), listing = readdirSync(directory);
  assert.equal(success(['--lang', 'es', 'coordinator-read', requestFile, directory, queued.run.id, '--actor', scope.actor_id]).run.revision, queued.run.revision);
  for (const extra of [{ project_id: 'other' }, { can_authorize: true }, { target: 'arbitrary-code' }]) {
    writeFileSync(file, JSON.stringify({ workflow: 'project-status', request_key: 'status', source_policy: 'snapshot', ...extra }));
    assert.equal(run(['coordinator-submit', requestFile, directory, file, '--actor', scope.actor_id]).status, 2);
  }
  assert.equal(run(['coordinator-read', requestFile, directory, queued.run.id, '--actor', scope.actor_id, '--simulate', 'confirm']).status, 2);
  assert.equal(run(['coordinator-read', requestFile, directory, queued.run.id, '--actor', 'other']).status, 1);
  assert.deepEqual(readFileSync(join(directory, 'store.sqlite')), before); assert.deepEqual(readdirSync(directory), listing); assert.equal(existsSync(join(directory, 'simulated-mailbox.sqlite')), false);
}));

test('independent SQLite workers claim one run atomically', () => temporary(async (_root, directory) => {
  const path = join(directory, 'store.sqlite'), backend = new SqliteCoordinatorBackend(path); const coordinator = backend.forCoordinator({ ...scope, can_authorize: true }); const queued = coordinator.submit(input()); backend.close();
  const claim: ClaimRequest = { project_id: project, run_ref: recordRef(queued.run), executor_id: 'worker', lease_ms: 60000 };
  const results = await Promise.all([1, 2].map(index => new Promise<Record<string, unknown>>((resolve, reject) => {
    const worker = new Worker("const {parentPort,workerData:d}=require('node:worker_threads'); (async()=>{const {SqliteCoordinatorBackend}=await import(d.module);const b=new SqliteCoordinatorBackend(d.path);let result;try{result=b.forCoordinator(d.scope).claim({...d.claim,executor_id:'worker-'+d.index});}catch(e){result={error:e.code};}finally{b.close();}parentPort.postMessage(result);})();", { eval: true, workerData: { module, path, scope, claim, index } });
    worker.once('message', resolve); worker.once('error', reject); worker.once('exit', code => { if (code !== 0) reject(new Error(`Worker exit ${code}`)); });
  })));
  assert.equal(results.filter(result => 'lease' in result).length, 1); assert.equal(results.filter(result => result['error'] === 'CONFLICT').length, 1);
}));

for (const spill of [false, true]) test(`crash during local preparation recovers a ${spill ? 'hot' : 'cold'} journal and the reserved effect`, () => temporary(async (root, directory) => {
  const path = join(directory, 'store.sqlite'), script = join(root, 'crash.mjs'), base = Date.now() + 10000, clock = new Date(base).toISOString();
  const text = 'Synthetic proposal. '.repeat(1000);
  const task: CoordinatorInput = { project_id: project, workflow: 'meeting-to-brief', request_key: 'crash', source_policy: 'snapshot', budget: { ...defaultCoordinatorBudget }, meeting: { source: { capture: { source_id: 'crash-source', request_key: 'crash', locator: 'text:crash', content: text, expected_revision: null } }, selections: [{ segment_id: 'body', start: 0, end: text.length, category: 'proposal' }] } };
  writeFileSync(script, `import {SqliteCoordinatorBackend} from ${JSON.stringify(module)};
class Crash extends SqliteCoordinatorBackend { constructor(path){super(path,()=>${JSON.stringify(clock)});if(${spill})this.db.exec('PRAGMA cache_size=1');} buildWorkflowArtifact(...args){const result=super.buildWorkflowArtifact(...args);process.exit(77);return result;} }
const b=new Crash(${JSON.stringify(path)}),c=b.forCoordinator(${JSON.stringify({ ...scope, can_authorize: true })}),q=c.submit(${JSON.stringify(task)});await c.advance(${JSON.stringify(project)},c.claim({project_id:${JSON.stringify(project)},run_ref:{id:q.run.id,revision:q.run.revision},executor_id:'crashing-worker',lease_ms:10}).lease);`);
  const child = spawnSync(process.execPath, [script], { encoding: 'utf8' }); assert.equal(child.status, 77, child.stderr); assert.equal(existsSync(path + '-journal'), true);
  assert.equal(readFileSync(path + '-journal').subarray(0, 8).some(byte => byte !== 0), spill);
  recoverLocalConstruction(request, directory, scope.actor_id);
  const backend = new SqliteCoordinatorBackend(path, () => new Date(base + 1000).toISOString());
  try {
    const c = backend.forCoordinator({ ...scope, can_authorize: true }), raw = backend.forScope(scope), queued = c.submit(task);
    assert.equal(raw.query({ kind: 'artifact' }).records.length, 0); assert.equal(raw.query({ kind: 'source' }).records.length, 0); assert.equal(queued.actions[0]!.data.status, 'in_flight');
    const recovered = c.claim({ project_id: project, run_ref: recordRef(queued.run), executor_id: 'recovery', lease_ms: 10000 }); assert.equal(recovered.result.actions[0]!.data.status, 'unknown');
    const failed = await c.reconcile(project, recovered.lease); assert.equal(failed.actions[0]!.data.reconciliation, 'no_effect_proven');
    const retried = c.retry({ project_id: project, run_ref: recordRef(failed.run) });
    const prepared = await c.advance(project, c.claim({ project_id: project, run_ref: recordRef(retried.run), executor_id: 'recovery', lease_ms: 10000 }).lease);
    assert.equal(prepared.run.data.status, 'waiting_input'); assert.equal(prepared.actions[0]!.data.attempts, 2); assert.equal(raw.query({ kind: 'source' }).records.length, 1); assert.equal(raw.query({ kind: 'capture' }).records.length, 1);
  } finally { backend.close(); }
}));

test('process exit after target commit reconciles from another process without delivering twice', () => temporary(async (root, directory) => {
  const path = join(directory, 'store.sqlite'), targetPath = join(directory, 'simulated-mailbox.sqlite'), base = Date.now() + 10000;
  let b = new SqliteCoordinatorBackend(path, () => new Date(base).toISOString());
  const review = b.forReview({ ...scope, can_authorize: true });
  const draft = review.save({ kind: 'artifact', id: 'delivery-artifact', project_id: project, expected_revision: null, data: { content: 'Exact synthetic approved content.', source_refs: [] } });
  const approved = review.approveArtifact({ project_id: project, id: draft.id, expected_revision: draft.revision, source_policy: 'snapshot' });
  const c = b.forCoordinator({ ...scope, can_authorize: true });
  const queued = c.submit({ project_id: project, workflow: 'deliver-approved-artifact', request_key: 'delivery', source_policy: 'snapshot', budget: { ...defaultCoordinatorBudget }, delivery: { artifact_ref: recordRef(approved), target_id: 'local-mailbox', destination: 'simulator:one' } });
  c.authorize({ project_id: project, run_ref: recordRef(queued.run), grant_id: 'grant', valid_until: new Date(base + 60000).toISOString() }); b.close();
  const script = join(root, 'target-crash.mjs');
  writeFileSync(script, `import {SqliteCoordinatorBackend} from ${JSON.stringify(module)};import {SimulatedMailbox} from ${JSON.stringify(targetModule)};
class CrashTarget extends SimulatedMailbox {async invoke(request){await super.invoke(request);process.exit(78);}}
const target=new CrashTarget(${JSON.stringify(targetPath)}),b=new SqliteCoordinatorBackend(${JSON.stringify(path)},()=>${JSON.stringify(new Date(base + 100).toISOString())},new Map([[target.id,target]])),c=b.forCoordinator(${JSON.stringify(scope)}),q=c.read(${JSON.stringify(project)},${JSON.stringify(queued.run.id)});await c.advance(${JSON.stringify(project)},c.claim({project_id:${JSON.stringify(project)},run_ref:{id:q.run.id,revision:q.run.revision},executor_id:'crash-target',lease_ms:10}).lease);`);
  const child = spawnSync(process.execPath, [script], { encoding: 'utf8' }); assert.equal(child.status, 78, child.stderr);
  const target = new SimulatedMailbox(targetPath); b = new SqliteCoordinatorBackend(path, () => new Date(base + 1000).toISOString(), new Map([[target.id, target]]));
  try {
    const c = b.forCoordinator(scope), current = c.read(project, queued.run.id); assert.equal(current.actions[0]!.data.status, 'in_flight'); assert.equal(target.deliveryCount(), 1);
    const done = await c.reconcile(project, c.claim({ project_id: project, run_ref: recordRef(current.run), executor_id: 'reconcile', lease_ms: 10000 }).lease);
    assert.equal(done.run.data.status, 'succeeded'); assert.equal(done.actions[0]!.data.attempts, 1); assert.equal(target.deliveryCount(), 1);
  } finally { b.close(); target.close(); }
}));
