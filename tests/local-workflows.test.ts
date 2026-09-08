import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import type { WorkflowResult } from '../core/workflows.js';
import { semanticCriteria } from '../core/workflows.js';

const cli = fileURLToPath(new URL('../cli/main.js', import.meta.url)), request = fileURLToPath(new URL('../../examples/install-request.json', import.meta.url));
const run = (args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', env: { ...process.env, MANU_CONTROL_CENTER_LANG: 'en' } });
function success(args: string[]) { const result = run(args); assert.equal(result.status, 0, result.stderr); return JSON.parse(result.stdout); }
async function temporary(work: (root: string, directory: string) => void | Promise<void>) { const root = realpathSync(mkdtempSync(join(tmpdir(), 'mcc-local-workflow-'))); try { await work(root, join(root, 'instance')); } finally { rmSync(root, { recursive: true, force: true }); } }
const ref = (record: { id: string; revision: string }) => ({ id: record.id, revision: record.revision });

test('installed-style CLI demo completes both workflows across fresh processes', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../../examples/workflow-demo.mjs', import.meta.url))], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).fresh_process_review, true);
});

test('workflow CLI rejects forged authority/options and preserves read-only bytes in Spanish', () => temporary((root, directory) => {
  success(['create', request, directory, '--actor', 'local-user']);
  const payload = join(root, 'operation.json');
  const operation = { workflow: 'project-status', request_key: 'status', source_policy: 'snapshot' };
  writeFileSync(payload, JSON.stringify(operation));
  const result = success(['--lang', 'es', 'workflow-prepare', request, directory, payload, '--actor', 'local-user']);
  const before = readFileSync(join(directory, 'store.sqlite')), entries = readdirSync(directory);
  assert.deepEqual(success(['workflow-read', request, directory, result.run.id, '--actor', 'local-user', '--lang', 'es']).artifact, result.artifact);
  for (const extra of [{ project_id: 'other' }, { can_authorize: true }, { actor_id: 'other' }]) {
    writeFileSync(payload, JSON.stringify({ ...operation, ...extra }));
    assert.equal(run(['workflow-prepare', request, directory, payload, '--actor', 'local-user']).status, 2);
  }
  assert.equal(run(['workflow-read', request, directory, result.run.id, '--actor', 'local-user', '--can-authorize', 'true']).status, 2);
  assert.equal(run(['workflow-read', request, directory, result.run.id, '--actor', 'other']).status, 1);
  assert.deepEqual(readFileSync(join(directory, 'store.sqlite')), before); assert.deepEqual(readdirSync(directory), entries);
}));

function concurrent(code: string, data: object) {
  return Promise.all([0, 1].map(() => new Promise<Record<string, unknown>>((resolve, reject) => {
    const worker = new Worker(code, { eval: true, workerData: data });
    worker.once('message', resolve); worker.once('error', reject); worker.once('exit', value => { if (value !== 0) reject(new Error(`Worker exited ${value}`)); });
  })));
}
test('competing preparations and exact completions converge on one job and approved artifact', () => temporary(async (root, directory) => {
  success(['create', request, directory, '--actor', 'local-user']);
  const payload = { workflow: 'project-status', request_key: 'race', source_policy: 'snapshot' };
  const module = new URL('../adapters/interfaces/local/workflows.js', import.meta.url).href;
  const code = "const {parentPort,workerData:d}=require('node:worker_threads'); (async()=>{const m=await import(d.module); const request=JSON.parse(require('node:fs').readFileSync(d.request,'utf8'));try{parentPort.postMessage(m[d.method](request,d.directory,'local-user',d.payload));}catch(e){parentPort.postMessage({error:e.code,message:e.message});}})();";
  const prepared = await concurrent(code, { module, request, directory, method: 'prepareLocalWorkflow', payload });
  for (const result of prepared) assert.equal(result['error'], undefined, String(result['message']));
  assert.deepEqual(prepared[0]!['run'], prepared[1]!['run']);
  const result = prepared[0] as unknown as WorkflowResult;
  const review = { run_ref: ref(result.run), artifact_ref: ref(result.artifact), content_hash: result.artifact.data.content_hash, review: { verdict: 'accept', checks: semanticCriteria.map(criterion => ({ criterion, outcome: 'pass', note: 'Synthetic empty project has no claims, decisions or source instructions; exact project metadata checked.' })) } };
  const completed = await concurrent(code, { module, request, directory, method: 'completeLocalWorkflow', payload: review });
  for (const value of completed) assert.equal(value['error'], undefined, String(value['message']));
  assert.deepEqual(completed[0]!['artifact'], completed[1]!['artifact']);
  const path = join(root, 'read.json'); writeFileSync(path, JSON.stringify(payload));
  const replay = success(['workflow-prepare', request, directory, path, '--actor', 'local-user']);
  assert.equal(replay.run.data.status, 'succeeded'); assert.equal(replay.replayed, true);
}));
