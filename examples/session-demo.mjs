import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { semanticCriteria } from '../dist/core/workflows.js';

// Mechanism/packaging verification with fresh CLI processes. No model quality claim.
const root = realpathSync(mkdtempSync(join(tmpdir(), 'mcc-session-demo-'))), directory = join(root, 'instance');
const request = fileURLToPath(new URL('./install-request.json', import.meta.url));
const cli = fileURLToPath(new URL('../dist/cli/main.js', import.meta.url));
let sequence = 0;
const json = value => { const path = join(root, `operation-${++sequence}.json`); writeFileSync(path, JSON.stringify(value)); return path; };
const run = (command, ...args) => JSON.parse(execFileSync(process.execPath, [cli, command, request, directory, ...args, '--actor', 'local-user'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const ref = value => ({ id: value.id, revision: value.revision });
try {
  run('create'); const text = 'A prototype is proposed.';
  const source = run('capture', 'meeting', '--key', 'capture', '--text', text).source_ref;
  for (const workflow of ['meeting-to-brief', 'project-status']) {
    run('coordinator-submit', json({ workflow, request_key: workflow, source_policy: 'snapshot', ...(workflow === 'meeting-to-brief' ? { meeting: { source: { ref: source }, selections: [{ segment_id: 'body', start: 0, end: text.length, category: 'proposal' }] } } : {}) }));
    let view = run('session'), pending = view.runs.records.find(item => item.status === 'queued');
    const before = readFileSync(join(directory, 'store.sqlite'));
    const translated = run('session', '--lang', 'es');
    assert.deepEqual(readFileSync(join(directory, 'store.sqlite')), before);
    assert.deepEqual(translated.project, view.project); assert.deepEqual(translated.runs, view.runs);
    const operation = json({ run_ref: pending.run_ref, executor_id: 'fresh-session' });
    const draft = run('session-continue', operation); assert.equal(draft.run.data.status, 'waiting_input');
    assert.throws(() => run('session-continue', operation)); // Stale snapshot cannot resume again.
    view = run('session'); pending = view.runs.records.find(item => item.status === 'waiting_input');
    assert.equal(pending.next_action.operation, 'review');
    assert.throws(() => run('session-continue', json({ run_ref: pending.run_ref, executor_id: 'fresh-session' })));
    const exact = draft.artifact.data.content;
    assert.equal(pending.artifact.content, exact);
    run('coordinator-review', json({ run_ref: pending.run_ref, artifact_ref: ref(draft.artifact), content_hash: draft.artifact.data.content_hash, review: { verdict: 'accept', checks: semanticCriteria.map(criterion => ({ criterion, outcome: 'pass', note: 'Synthetic mechanism fixture inspected: the sole statement is a proposal, no approval or deadline is asserted, and no external action occurs.' })) } }));
    pending = run('session').runs.records.find(item => item.status === 'paused');
    assert.equal(pending.review_recorded, true);
    const completed = run('session-continue', json({ run_ref: pending.run_ref, executor_id: 'another-fresh-session' }));
    assert.equal(completed.run.data.status, 'succeeded'); assert.equal(completed.artifact.data.content, exact);
  }
  const final = run('session'); assert.equal(final.runs.records.length, 2); assert.ok(final.runs.records.every(item => item.next_action.operation === 'none'));
  assert.throws(() => run('session', '--limit', '0'));
  assert.equal(final.pending_captures.records.length, 1); // Standalone source capture is not owned by these runs.
  console.log(JSON.stringify({ ok: true, fresh_process_resume: true, workflows: 2, read_only_bytes_unchanged: true, exact_review_required: true, stale_resume_rejected: true, english_spanish_data_equal: true, runtime_invoked: false }));
} finally { rmSync(root, { recursive: true, force: true }); }
