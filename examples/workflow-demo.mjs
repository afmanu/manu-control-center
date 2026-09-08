import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = realpathSync(mkdtempSync(join(tmpdir(), 'mcc-workflow-demo-')));
const cli = fileURLToPath(new URL('../dist/cli/main.js', import.meta.url));
const request = fileURLToPath(new URL('./install-request.json', import.meta.url));
const directory = join(root, 'instance');
const ref = record => ({ id: record.id, revision: record.revision });
const command = (name, ...args) => JSON.parse(execFileSync(process.execPath, [cli, name, request, directory, ...args, '--actor', 'local-user'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const payload = (name, value) => { const path = join(root, name + '.json'); writeFileSync(path, JSON.stringify(value)); return path; };
const review = result => ({ run_ref: ref(result.run), artifact_ref: ref(result.artifact), content_hash: result.artifact.data.content_hash, review: { verdict: 'accept', checks: [
  { criterion: 'classification_faithful', outcome: 'pass', note: 'The quoted suggestion stays a proposal; there are no approved decisions.' },
  { criterion: 'uncertainty_preserved', outcome: 'pass', note: 'The source says the idea is not approved; the full sentence is retained.' },
  { criterion: 'no_unsupported_assertions', outcome: 'pass', note: 'No date, budget or owner was inferred. Project metadata is copied from its pinned revision.' },
  { criterion: 'source_instructions_not_followed', outcome: 'pass', note: 'The synthetic input contains no tool instructions; no external action was invoked.' },
] } });
try {
  command('create');
  const text = 'We could build a prototype; it is not approved.';
  const operation = payload('meeting', { workflow: 'meeting-to-brief', request_key: 'meeting-demo', source_policy: 'fresh', meeting: { source: { capture: { source_id: 'meeting-demo', request_key: 'capture-demo', locator: 'text:synthetic-meeting', content: text, expected_revision: null } }, selections: [{ segment_id: 'body', start: 0, end: text.length, category: 'proposal' }] } });
  const pending = command('workflow-prepare', operation);
  assert.equal(pending.run.data.status, 'waiting_input');
  assert.equal(JSON.parse(pending.artifact.data.content).meeting.items[0].quote, text);
  assert.deepEqual(command('workflow-read', pending.run.id).artifact, pending.artifact);
  const completed = command('workflow-complete', payload('meeting-review', review(pending)));
  assert.equal(completed.run.data.status, 'succeeded'); assert.equal(completed.artifact.data.content, pending.artifact.data.content);
  assert.equal(command('workflow-prepare', operation).replayed, true);
  const status = command('workflow-prepare', payload('status', { workflow: 'project-status', request_key: 'status-demo', source_policy: 'snapshot' }));
  const statusReview = review(status);
  statusReview.review.checks[0].note = 'No persisted claims or decisions exist; both collections are explicitly empty.';
  statusReview.review.checks[1].note = 'Missing project next action remains null; no conclusions are inferred from the transcript.';
  assert.equal(command('workflow-complete', payload('status-review', statusReview)).run.data.status, 'succeeded');
  assert.equal(command('knowledge', 'decision').records.length, 0);
  process.stdout.write(JSON.stringify({ ok: true, profile: 'local_human_review_synthetic', meeting_to_brief: true, project_status: true, exact_artifact: true, fresh_process_review: true, model_invoked: false }) + '\n');
} finally { rmSync(root, { recursive: true, force: true }); }
