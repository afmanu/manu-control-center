import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { Worker } from 'node:worker_threads';
import { SqliteBackend } from '../adapters/backends/sqlite/store.js';
import { SqliteInstallation } from '../adapters/backends/sqlite/installation.js';
import { applyLocalInstallation, inspectLocalCapabilities, inspectLocalInstallation, planLocalInstallation, readLocalManifest, readLocalVerification, verifyLocalInstallation } from '../adapters/interfaces/local/installation.js';
import { assertInstallPlan, assertRequest, initialProject, resolveSpecification } from '../builder/planner.js';
import type { InstallPlan, InstallRequest } from '../builder/model.js';
import { hashJson } from '../core/hashing.js';
import type { StoredRecord } from '../core/models.js';

const request = (): InstallRequest => ({ kind: 'install_request', schema_version: '0.1.0-draft', instance_id: 'test-instance', owner_id: 'alice', purpose: 'Synthetic instance', project: { id: 'my-existing-name', purpose: 'My original project purpose' }, runtime: 'codex', adoption: null });
const authority = (plan: InstallPlan) => ({ actor_id: plan.request.owner_id, instance_id: plan.request.instance_id, destination: plan.observation.destination, plan_digest: plan.digest, effects: ['instance.install'], valid_until: new Date(Date.now() + 60_000).toISOString() });
function temporary(work: (root: string) => void | Promise<void>) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'mcc-m2-')));
  return Promise.resolve().then(() => work(root)).finally(() => rmSync(root, { recursive: true, force: true }));
}
const hasCode = (code: string) => (error: unknown) => !!error && typeof error === 'object' && 'code' in error && error.code === code;
function mutateProject(directory: string, input: InstallRequest, purpose: string) {
  const backend = new SqliteBackend(join(directory, 'store.sqlite'));
  try {
    const scope = backend.forScope({ instance_id: input.instance_id, actor_id: input.owner_id });
    const value = scope.get(input.project.id) as StoredRecord<'project'>;
    value.data.purpose = purpose;
    return scope.update(value, value.revision);
  } finally { backend.close(); }
}

test('M2 resolver pins modules and rejects unknown fields, reserved identities and unavailable capabilities', () => {
  assert.throws(() => assertRequest({ ...request(), surprise: 'not configuration' }), hasCode('INVALID_INPUT'));
  assert.throws(() => assertRequest({ ...request(), project: { id: 'configuration', purpose: 'x' } }), hasCode('INVALID_INPUT'));
  assert.throws(() => resolveSpecification(request(), '/dedicated', []), hasCode('CAPABILITY_UNAVAILABLE'));
  const checks = inspectLocalCapabilities();
  const spec = resolveSpecification(request(), '/dedicated', checks);
  assert.deepEqual(spec, resolveSpecification(request(), '/dedicated', checks));
  assert.deepEqual(spec.targets.runtime.capabilities, []);
  assert.equal(spec.targets.runtime.configuration['status'], 'not_verified');
  assert.equal(spec.modules.length, 2);
  assert.ok(checks.every(check => check.status === 'passed' && check.evidence_refs.length));
});
test('M2 planning and inspection do not create or modify the destination', () => temporary(root => {
  const destination = join(root, 'uncreated');
  const first = planLocalInstallation(request(), destination);
  assert.equal(existsSync(destination), false);
  assert.deepEqual(first, planLocalInstallation(request(), destination));
  assert.deepEqual(assertInstallPlan(first), first);
  applyLocalInstallation(first, authority(first));
  const before = readFileSync(join(destination, 'store.sqlite'));
  const names = readdirSync(destination);
  const current = inspectLocalInstallation(request(), destination);
  planLocalInstallation(request(), destination);
  assert.ok(current.project);
  assert.deepEqual(readFileSync(join(destination, 'store.sqlite')), before);
  assert.deepEqual(readdirSync(destination), names);
}));
test('A01/A19: two installed instances isolate identical project IDs and verify foundation only', () => temporary(root => {
  const a = request(), b = { ...request(), instance_id: 'another-instance' };
  for (const [input, name] of [[a, 'a'], [b, 'b']] as const) {
    const directory = join(root, name), plan = planLocalInstallation(input, directory);
    assert.equal(applyLocalInstallation(plan, authority(plan)).state, 'installed_unverified');
    const manifest = verifyLocalInstallation(input, directory);
    assert.equal(manifest.state, 'verified');
    const audit = new SqliteInstallation(join(directory, 'store.sqlite'), true);
    try { assert.equal(audit.state(input.owner_id, input.instance_id)!.authorizations[0]!.plan_digest, plan.digest); } finally { audit.close(); }
    const evidence = readLocalVerification(input, directory) as { id: string; document: { sqlite_quick_check: boolean } }[];
    assert.equal(evidence.length, 1); assert.equal(evidence[0]!.document.sqlite_quick_check, true);
    assert.ok(manifest.verification[0]!.evidence_refs[0]!.includes(evidence[0]!.id));
    assert.deepEqual(manifest.verification.find(check => check.capability === 'runtime.invoke'), { capability: 'runtime.invoke', required: false, status: 'not_run', evidence_refs: [] });
  }
  mutateProject(join(root, 'a'), a, 'Changed only A');
  assert.equal(inspectLocalInstallation(b, join(root, 'b')).project!.data.purpose, b.project.purpose);
  assert.throws(() => inspectLocalInstallation(a, join(root, 'b')), hasCode('FORBIDDEN'));
  const before = readFileSync(join(root, 'a', 'store.sqlite'));
  assert.throws(() => verifyLocalInstallation({ ...a, owner_id: 'mallory' }, join(root, 'a')), hasCode('FORBIDDEN'));
  assert.deepEqual(readFileSync(join(root, 'a', 'store.sqlite')), before);
}));
test('A02: explicit adoption preserves existing project bytes, identity, history and ownership', () => temporary(root => {
  const directory = join(root, 'adoption'); mkdirSync(directory);
  const input = request(), backend = new SqliteBackend(join(directory, 'store.sqlite'));
  const existing = backend.forScope({ instance_id: input.instance_id, actor_id: input.owner_id }).create(initialProject(input));
  backend.close();
  assert.throws(() => planLocalInstallation(input, directory), hasCode('CONFLICT'));
  input.adoption = { revision: existing.revision, ownership: 'user_owned' };
  input.project.purpose = 'This request must not overwrite the existing project';
  const before = readFileSync(join(directory, 'store.sqlite'));
  const plan = planLocalInstallation(input, directory);
  assert.equal(plan.plan.operations.at(-1)!.operation, 'reuse');
  assert.deepEqual(readFileSync(join(directory, 'store.sqlite')), before);
  const manifest = applyLocalInstallation(plan, authority(plan));
  assert.equal(manifest.resources.find(resource => resource.id === existing.id)!.ownership, 'user_owned');
  assert.deepEqual(inspectLocalInstallation(input, directory).project, existing);
  const check = new SqliteBackend(join(directory, 'store.sqlite'));
  try { assert.equal(check.forScope({ instance_id: input.instance_id, actor_id: input.owner_id }).history(existing.id).length, 1); } finally { check.close(); }
  assert.equal(verifyLocalInstallation(input, directory).state, 'verified');
  const changedOwnership = planLocalInstallation({ ...input, adoption: null }, directory);
  assert.throws(() => applyLocalInstallation(changedOwnership, authority(changedOwnership)), hasCode('CONFLICT'));
}));
test('A16: edits after planning reject application before replacing existing content', () => temporary(root => {
  const input = request(), directory = join(root, 'stale');
  const plan = planLocalInstallation(input, directory); applyLocalInstallation(plan, authority(plan));
  const next = planLocalInstallation(input, directory), manifest = readLocalManifest(input, directory);
  const changed = mutateProject(directory, input, 'User edit after planning');
  assert.throws(() => applyLocalInstallation(next, authority(next)), hasCode('STALE_PLAN'));
  assert.deepEqual(inspectLocalInstallation(input, directory).project, changed);
  assert.deepEqual(readLocalManifest(input, directory), manifest);
}));
test('A16: an absent project created after planning is never silently adopted', () => temporary(root => {
  const input = request(), directory = join(root, 'raced');
  const plan = planLocalInstallation(input, directory);
  mkdirSync(directory);
  const backend = new SqliteBackend(join(directory, 'store.sqlite'));
  backend.forScope({ instance_id: input.instance_id, actor_id: input.owner_id }).create(initialProject(input)); backend.close();
  assert.throws(() => applyLocalInstallation(plan, authority(plan)), hasCode('STALE_PLAN'));
  assert.equal(readLocalManifest(input, directory), null);
}));
test('A17: resource and checkpoint roll back together; partial installation resumes without duplicates', () => temporary(root => {
  const input = request(), directory = join(root, 'resume'), plan = planLocalInstallation(input, directory);
  assert.throws(() => applyLocalInstallation(plan, authority(plan), { beforeCheckpoint: id => { if (id === `install:${input.project.id}`) throw new Error('injected before checkpoint'); } }), /injected/);
  assert.equal(readLocalManifest(input, directory)!.state, 'partial');
  assert.equal(inspectLocalInstallation(input, directory).project, null);
  const first = applyLocalInstallation(plan, authority(plan)), repeated = applyLocalInstallation(plan, authority(plan));
  assert.deepEqual(first, repeated);
  const store = new SqliteBackend(join(directory, 'store.sqlite'));
  try { const scope = store.forScope({ instance_id: input.instance_id, actor_id: input.owner_id }); assert.equal(scope.query().records.length, 1); assert.equal(scope.history(input.project.id).length, 1); } finally { store.close(); }
  assert.equal(verifyLocalInstallation(input, directory).state, 'verified');
}));
test('A17: real process termination after a committed checkpoint resumes from durable state', () => temporary(root => {
  const input = request(), directory = join(root, 'process'), plan = planLocalInstallation(input, directory);
  const data = join(root, 'plan.json'); writeFileSync(data, JSON.stringify({ plan, authority: authority(plan) }));
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `import {readFileSync} from 'node:fs'; import {applyLocalInstallation} from ${JSON.stringify(new URL('../adapters/interfaces/local/installation.js', import.meta.url).href)}; const {plan,authority}=JSON.parse(readFileSync(process.argv[1],'utf8')); applyLocalInstallation(plan,authority,{afterCheckpoint:()=>process.exit(83)});`, data], { encoding: 'utf8' });
  assert.equal(child.status, 83, child.stderr);
  assert.equal(readLocalManifest(input, directory)!.resources.length, 1);
  assert.equal(applyLocalInstallation(plan, authority(plan)).resources.length, 3);
  assert.equal(verifyLocalInstallation(input, directory).state, 'verified');
}));
test('M2 two concurrent installers reconcile one plan with one project and one history entry', () => temporary(async root => {
  const input = request(), directory = join(root, 'concurrent'), plan = planLocalInstallation(input, directory);
  const script = `const {parentPort,workerData}=require('node:worker_threads'); (async()=>{try {const {applyLocalInstallation}=await import(workerData.moduleUrl);parentPort.postMessage({ok:true,result:applyLocalInstallation(workerData.plan,workerData.authority)});}catch(error){parentPort.postMessage({ok:false,code:error.code,message:error.message});}})();`;
  const run = () => new Promise<any>((resolve, reject) => { const worker = new Worker(script, { eval: true, workerData: { plan, authority: authority(plan), moduleUrl: new URL('../adapters/interfaces/local/installation.js', import.meta.url).href } }); worker.once('message', resolve); worker.once('error', reject); worker.once('exit', code => { if (code) reject(new Error(`Exit ${code}`)); }); });
  const results = await Promise.all([run(), run()]);
  assert.ok(results.some(result => result.ok), JSON.stringify(results));
  assert.ok(results.every(result => result.ok || ['CONFLICT', 'STALE_PLAN'].includes(result.code)), JSON.stringify(results));
  applyLocalInstallation(plan, authority(plan));
  const backend = new SqliteBackend(join(directory, 'store.sqlite'));
  try { const scope = backend.forScope({ instance_id: input.instance_id, actor_id: input.owner_id }); assert.equal(scope.history(input.project.id).length, 1); assert.equal(scope.query().records.length, 1); } finally { backend.close(); }
}));
test('M2 forged plan, scope, expiry and destination fail before creating instance data', () => temporary(root => {
  const directory = join(root, 'unauthorized'), plan = planLocalInstallation(request(), directory);
  for (const change of [{ actor_id: 'mallory' }, { instance_id: 'other' }, { plan_digest: 'different' }, { destination: root }, { effects: [] }, { valid_until: '2020-01-01T00:00:00Z' }]) {
    assert.throws(() => applyLocalInstallation(plan, { ...authority(plan), ...change }), hasCode('FORBIDDEN'));
    assert.equal(existsSync(directory), false);
  }
  const forged = structuredClone(plan); forged.plan.operations[0]!.ownership = 'user_owned';
  assert.throws(() => applyLocalInstallation(forged, authority(forged)), hasCode('INVALID_INPUT'));
  const arbitrary = structuredClone(plan); arbitrary.spec.targets.backend.adapter_id = 'arbitrary';
  assert.throws(() => applyLocalInstallation(arbitrary, authority(arbitrary)), hasCode('INVALID_INPUT'));
  assert.equal(existsSync(directory), false);
}));
test('M2 drift after a final checkpoint prevents silent resume and replanning preserves the user edit', () => temporary(root => {
  const input = request(), directory = join(root, 'partial'), plan = planLocalInstallation(input, directory);
  assert.throws(() => applyLocalInstallation(plan, authority(plan), { afterCheckpoint: id => { if (id === `install:${input.project.id}`) throw new Error('stop after project'); } }));
  mutateProject(directory, input, 'Changed after checkpoint');
  assert.throws(() => applyLocalInstallation(plan, authority(plan)), hasCode('STALE_PLAN'));
  const next = planLocalInstallation(input, directory);
  applyLocalInstallation(next, authority(next));
  assert.equal(inspectLocalInstallation(input, directory).project!.data.purpose, 'Changed after checkpoint');
  const audit = new SqliteInstallation(join(directory, 'store.sqlite'), true);
  try { const grants = audit.state(input.owner_id, input.instance_id)!.authorizations; assert.ok(grants.some(grant => grant.plan_digest === plan.digest)); assert.ok(grants.some(grant => grant.plan_digest === next.digest)); } finally { audit.close(); }
}));
test('M2 verification detects managed catalog corruption and never declares it verified', () => temporary(root => {
  const input = request(), directory = join(root, 'corrupt'), plan = planLocalInstallation(input, directory);
  applyLocalInstallation(plan, authority(plan));
  class FaultInjector extends SqliteInstallation { corrupt() { this.db.prepare("UPDATE builder_resources SET document='{}' WHERE id='catalog'").run(); } }
  const backend = new FaultInjector(join(directory, 'store.sqlite')); backend.corrupt(); backend.close();
  const result = verifyLocalInstallation(input, directory);
  assert.equal(result.state, 'installed_unverified');
  assert.equal(result.verification.find(check => check.capability === 'installation')!.status, 'failed');
}));
test('M2 refuses a product directory, relative path and unrelated nonempty folder', () => temporary(root => {
  assert.throws(() => planLocalInstallation(request(), 'relative'), hasCode('INVALID_INPUT'));
  assert.throws(() => planLocalInstallation(request(), process.cwd()), hasCode('FORBIDDEN'));
  writeFileSync(join(root, 'my-notes.txt'), 'User content');
  assert.throws(() => planLocalInstallation(request(), root), hasCode('CONFLICT'));
  assert.equal(readFileSync(join(root, 'my-notes.txt'), 'utf8'), 'User content');
  assert.equal(hashJson(request()), hashJson(assertRequest(request())));
}));

test('M2 a partial plan cannot be replaced by another request or plan', () => temporary(root => {
  const input = request(), directory = join(root, 'unfinished'), plan = planLocalInstallation(input, directory);
  assert.throws(() => applyLocalInstallation(plan, authority(plan), { afterCheckpoint: () => { throw new Error('Interrupted'); } }));
  const changed = planLocalInstallation({ ...input, purpose: 'Changed request' }, directory);
  assert.throws(() => applyLocalInstallation(changed, authority(changed)), hasCode('CONFLICT'));
  assert.equal(readLocalManifest(input, directory)!.state, 'partial');
  assert.equal(readLocalManifest(input, directory)!.resources.length, 1);
}));

test('M2 WAL inspection is rejected before SQLite can create sidecar files', () => temporary(root => {
  const input = request(), directory = join(root, 'wal'), plan = planLocalInstallation(input, directory);
  applyLocalInstallation(plan, authority(plan));
  const database = new DatabaseSync(join(directory, 'store.sqlite'));
  database.exec('PRAGMA journal_mode=WAL'); database.close();
  const before = readFileSync(join(directory, 'store.sqlite')), names = readdirSync(directory);
  assert.throws(() => inspectLocalInstallation(input, directory), hasCode('CAPABILITY_UNAVAILABLE'));
  assert.deepEqual(readFileSync(join(directory, 'store.sqlite')), before);
  assert.deepEqual(readdirSync(directory), names);
}));
test('A17: process termination inside the resource transaction recovers journal and resumes', () => temporary(root => {
  const input = request(), directory = join(root, 'hot-journal'), plan = planLocalInstallation(input, directory);
  const data = join(root, 'plan.json'); writeFileSync(data, JSON.stringify({ plan, authority: authority(plan) }));
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `import {readFileSync} from 'node:fs'; import {applyLocalInstallation} from ${JSON.stringify(new URL('../adapters/interfaces/local/installation.js', import.meta.url).href)}; const {plan,authority}=JSON.parse(readFileSync(process.argv[1],'utf8')); applyLocalInstallation(plan,authority,{beforeCheckpoint:id=>{if(id==='install:'+plan.request.project.id)process.exit(84);}});`, data], { encoding: 'utf8' });
  assert.equal(child.status, 84, child.stderr);
  const before = readFileSync(join(directory, 'store.sqlite')), names = readdirSync(directory);
  assert.throws(() => inspectLocalInstallation(input, directory), hasCode('CONFLICT'));
  assert.deepEqual(readFileSync(join(directory, 'store.sqlite')), before); assert.deepEqual(readdirSync(directory), names);
  assert.equal(applyLocalInstallation(plan, authority(plan)).state, 'installed_unverified');
  assert.equal(verifyLocalInstallation(input, directory).state, 'verified');
  const backend = new SqliteBackend(join(directory, 'store.sqlite'));
  try { assert.equal(backend.forScope({ instance_id: input.instance_id, actor_id: input.owner_id }).history(input.project.id).length, 1); } finally { backend.close(); }
}));

test('M2 CLI resume recovers an interrupted transaction from its recorded plan', () => temporary(root => {
  const input = request(), directory = join(root, 'cli-recovery'), plan = planLocalInstallation(input, directory);
  const file = join(root, 'input.json'), planFile = join(root, 'plan.json');
  writeFileSync(file, JSON.stringify(input)); writeFileSync(planFile, JSON.stringify({ plan, authority: authority(plan) }));
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `import {readFileSync} from 'node:fs'; import {applyLocalInstallation} from ${JSON.stringify(new URL('../adapters/interfaces/local/installation.js', import.meta.url).href)}; const {plan,authority}=JSON.parse(readFileSync(process.argv[1],'utf8')); applyLocalInstallation(plan,authority,{beforeCheckpoint:id=>{if(id==='install:'+plan.request.project.id)process.exit(84);}});`, planFile], { encoding: 'utf8' });
  assert.equal(child.status, 84, child.stderr);
  const resumed = spawnSync(process.execPath, [fileURLToPath(new URL('../cli/main.js', import.meta.url)), 'resume', file, directory, '--actor', input.owner_id], { encoding: 'utf8' });
  assert.equal(resumed.status, 0, resumed.stderr);
  assert.equal(JSON.parse(resumed.stdout).manifest.state, 'verified');
  assert.equal(inspectLocalInstallation(input, directory).project!.id, input.project.id);
}));
