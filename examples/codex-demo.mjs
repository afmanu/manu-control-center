import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

// Explicit real-runtime demo. It leaves drafts and its synthetic instance for independent review.
const target = process.argv[2];
if (!target || !isAbsolute(target)) throw new Error('Usage: node examples/codex-demo.mjs /absolute/new-evidence-directory [model]');
mkdirSync(target); const root = realpathSync(target), directory = join(root, 'instance');
const request = fileURLToPath(new URL('./install-request.json', import.meta.url)), cli = fileURLToPath(new URL('../dist/cli/main.js', import.meta.url));
const env = { ...process.env, ...(process.argv[3] ? { MANU_CONTROL_CENTER_CODEX_MODEL: process.argv[3] } : {}) };
const ref = record => ({ id: record.id, revision: record.revision }); let sequence = 0;
const json = value => { const path = join(root, `operation-${++sequence}.json`); writeFileSync(path, JSON.stringify(value), { mode: 0o600 }); return path; };
const run = (command, ...args) => JSON.parse(execFileSync(process.execPath, [cli, command, request, directory, ...args, '--actor', 'local-user'], { env, encoding: 'utf8', timeout: 200000, maxBuffer: 2097152, stdio: ['ignore', 'pipe', 'pipe'] }));
const operation = (command, value) => run(`coordinator-${command}`, json(value));
const claim = result => operation('claim', { run_ref: ref(result.run), executor_id: 'codex-demo', lease_ms: 60000 }).lease;
run('create');
const text = 'We agreed to compare the two mockups.\nI recommend a printable checklist; that recommendation has not been accepted.\nThe delivery date is still undecided.';
const sourcePath = join(root, 'source.txt'); writeFileSync(sourcePath, text, { mode: 0o600 });
const source = run('capture', 'synthetic-meeting', '--key', 'synthetic-capture', '--file', sourcePath).source_ref;
for (const workflow of ['meeting-to-brief', 'project-status']) {
  let result = operation('submit', { workflow, request_key: workflow, source_policy: 'fresh', runtime: { id: 'codex', version: '0.146.0-mcc.1' }, ...(workflow === 'meeting-to-brief' ? { meeting: { source: { ref: source }, selections: [] } } : {}) });
  result = operation('advance', { lease: claim(result) }); assert.equal(result.run.data.status, 'paused', result.next_action);
  result = operation('advance', { lease: claim(result) }); assert.equal(result.run.data.status, 'waiting_input', result.next_action);
  writeFileSync(join(root, `${workflow}.json`), JSON.stringify(result, null, 2)+'\n', { mode: 0o600 });
  console.log(JSON.stringify({ workflow, run_id: result.run.id, artifact_ref: ref(result.artifact), status: result.run.data.status, runtime: JSON.parse(result.artifact.data.content).agent.metadata }));
}
console.log(JSON.stringify({ ok: true, actual_runtime: true, workflows: 2, semantic_review: 'pending_independent_review', external_deliveries: 0, instance_directory: directory }));
