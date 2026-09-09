import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { semanticCriteria } from '../dist/core/workflows.js';

// Default: synthetic human-profile packaging check. Explicit model: actual runtime drafts left for independent review.
const target = process.argv[2], model = process.argv[3];
if (target && !isAbsolute(target)) throw new Error('Evidence directory must be absolute.');
if (model && !target) throw new Error('Real model evaluation must retain its evidence directory.');
if (target) mkdirSync(target);
const root = realpathSync(target ?? mkdtempSync(join(tmpdir(), 'mcc-profile-demo-'))), directory = join(root, 'instance'), profile = join(root, 'profile.json');
const cli = fileURLToPath(new URL('../dist/cli/main.js', import.meta.url)), request = join(root, 'request.json');
writeFileSync(request, readFileSync(new URL('./install-request.json', import.meta.url)), { mode: 0o600 });
const invoke = (...args) => JSON.parse(execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 210000, maxBuffer: 2097152, stdio: ['ignore', 'pipe', 'pipe'] }));
const run = (command, ...args) => invoke('use', profile, command, ...args);
const ref = value => ({ id: value.id, revision: value.revision }); let sequence = 0;
const json = value => { const path = join(root, `operation-${++sequence}.json`); writeFileSync(path, JSON.stringify(value), { mode: 0o600 }); return path; };
try {
  invoke('create', request, directory, '--actor', 'local-user');
  const before = readFileSync(join(directory, 'store.sqlite'));
  invoke('profile-create', request, directory, profile, '--actor', 'local-user', '--lang', 'es', ...(model ? ['--model', model] : []));
  assert.equal(invoke('profile-inspect', profile).profile.language, 'es');
  const workspace = invoke('profile-workspace', profile, join(root, 'workspace'));
  const session = JSON.parse(execFileSync(process.execPath, [join(workspace.workspace, 'mcc.mjs'), 'session'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  assert.equal(session.project.ref.id, 'demo-project'); assert.deepEqual(readFileSync(join(directory, 'store.sqlite')), before);
  const text = 'A prototype is proposed; no delivery date has been agreed.';
  const captured = run('capture', 'meeting', '--key', 'explicit-synthetic-source', '--text', text);
  assert.equal(run('search', 'prototype').matches[0].source_ref.id, captured.source_ref.id);
  for (const workflow of ['meeting-to-brief', 'project-status']) {
    let result = run('coordinator-submit', json({ workflow, request_key: workflow, source_policy: 'fresh', ...(model ? { runtime: { id: 'codex', version: '0.146.0-mcc.1' } } : {}), ...(workflow === 'meeting-to-brief' ? { meeting: { source: { ref: captured.source_ref }, selections: model ? [] : [{ segment_id: 'body', start: 0, end: text.length, category: 'proposal' }] } } : {}) }));
    result = run('session-continue', json({ run_ref: ref(result.run), executor_id: 'profile-demo' }));
    if (model) { assert.equal(result.run.data.status, 'paused', result.next_action); result = run('session-continue', json({ run_ref: ref(result.run), executor_id: 'profile-demo-new-session' })); }
    assert.equal(result.run.data.status, 'waiting_input', result.next_action);
    if (model) {
      writeFileSync(join(root, `${workflow}.json`), JSON.stringify(result, null, 2), { mode: 0o600 });
      assert.equal(JSON.parse(result.artifact.data.content).agent.metadata.requested_model, model);
    } else {
      const exact = result.artifact.data.content;
      result = run('coordinator-review', json({ run_ref: ref(result.run), artifact_ref: ref(result.artifact), content_hash: result.artifact.data.content_hash, review: { verdict: 'accept', checks: semanticCriteria.map(criterion => ({ criterion, outcome: 'pass', note: 'Synthetic human-profile fixture: the exact proposal remains unapproved with no delivery date; no additional facts, owners, authority or external action are asserted.' })) } }));
      result = run('session-continue', json({ run_ref: ref(result.run), executor_id: 'profile-demo-completion' }));
      assert.equal(result.run.data.status, 'succeeded'); assert.equal(result.artifact.data.content, exact);
    }
  }
  const final = run('session'); assert.equal(final.runs.records.length, 2);
  writeFileSync(join(root, 'session.json'), JSON.stringify(final, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ ok: true, workflows: 2, profile_bound_cli: true, packaged_workspace_launcher: true, foundation_bytes_unchanged_on_activation: true, explicit_capture: true, actual_runtime_invoked: Boolean(model), semantic_review: model ? 'pending_independent_inspection' : 'synthetic_human_fixture_complete', real_external_deliveries: 0 }));
} finally { if (!target) rmSync(root, { recursive: true, force: true }); }
