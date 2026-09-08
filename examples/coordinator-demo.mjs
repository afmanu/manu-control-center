import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SimulatedMailbox } from '../dist/adapters/effects/simulated-mailbox.js';

const root = realpathSync(mkdtempSync(join(tmpdir(), 'mcc-coordinator-demo-')));
const directory = join(root, 'instance'), request = fileURLToPath(new URL('./install-request.json', import.meta.url)), cli = fileURLToPath(new URL('../dist/cli/main.js', import.meta.url));
const ref = record => ({ id: record.id, revision: record.revision });
let sequence = 0;
const json = value => { const path = join(root, `operation-${++sequence}.json`); writeFileSync(path, JSON.stringify(value)); return path; };
const run = (command, ...args) => JSON.parse(execFileSync(process.execPath, [cli, command, request, directory, ...args, '--actor', 'local-user'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const operation = (command, value, ...flags) => run(`coordinator-${command}`, json(value), ...flags);
const claim = result => operation('claim', { run_ref: ref(result.run), executor_id: `demo-worker-${sequence}`, lease_ms: 60000 }).lease;
const review = result => ({ run_ref: ref(result.run), artifact_ref: ref(result.artifact), content_hash: result.artifact.data.content_hash, review: { verdict: 'accept', checks: [
  { criterion: 'classification_faithful', outcome: 'pass', note: 'The synthetic suggestion stays a proposal; persisted decisions/claims are empty.' },
  { criterion: 'uncertainty_preserved', outcome: 'pass', note: 'No approval or deadline was inferred; unknown project next action stays null.' },
  { criterion: 'no_unsupported_assertions', outcome: 'pass', note: 'Exact project metadata and the complete synthetic quote were checked.' },
  { criterion: 'source_instructions_not_followed', outcome: 'pass', note: 'The source contains no executable instructions; no external service is used.' },
] } });
try {
  run('create'); const text = 'A prototype is proposed.';
  let meeting = operation('submit', { workflow: 'meeting-to-brief', request_key: 'meeting', source_policy: 'fresh', meeting: { source: { capture: { source_id: 'meeting', request_key: 'meeting', locator: 'text:synthetic', content: text, expected_revision: null } }, selections: [{ segment_id: 'body', start: 0, end: text.length, category: 'proposal' }] } });
  meeting = operation('advance', { lease: claim(meeting) }); assert.equal(meeting.run.data.status, 'waiting_input');
  const exact = meeting.artifact.data.content; meeting = operation('review', review(meeting)); meeting = operation('advance', { lease: claim(meeting) });
  assert.equal(meeting.run.data.status, 'succeeded'); assert.equal(meeting.artifact.data.content, exact); assert.equal(meeting.steps.length, 7);
  let status = operation('submit', { workflow: 'project-status', request_key: 'status', source_policy: 'snapshot' });
  status = operation('advance', { lease: claim(status) }); const statusReview = review(status);
  statusReview.review.checks[0].note = 'This is project status: no transcript is classified and both knowledge collections are empty.';
  status = operation('review', statusReview); status = operation('advance', { lease: claim(status) }); assert.equal(status.run.data.status, 'succeeded');
  let delivery = operation('submit', { workflow: 'deliver-approved-artifact', request_key: 'delivery', source_policy: 'snapshot', delivery: { artifact_ref: ref(meeting.artifact), destination: 'simulator:synthetic-recipient', target_id: 'local-mailbox' } });
  operation('authorize', { run_ref: ref(delivery.run), grant_id: 'demo-delivery-grant', valid_until: new Date(Date.now() + 600000).toISOString() });
  delivery = operation('advance', { lease: claim(delivery) }, '--simulate', 'lose_response'); assert.equal(delivery.run.data.status, 'blocked'); assert.equal(delivery.actions[0].data.status, 'unknown');
  delivery = run('coordinator-read', delivery.run.id);
  delivery = operation('reconcile', { lease: claim(delivery) }); assert.equal(delivery.run.data.status, 'succeeded'); assert.equal(delivery.actions[0].data.attempts, 1);
  const target = new SimulatedMailbox(join(directory, 'simulated-mailbox.sqlite'), 'local-mailbox', 'confirm', { readOnly: true });
  try { assert.equal(target.deliveryCount(), 1); } finally { target.close(); }
  process.stdout.write(JSON.stringify({ ok: true, profile: 'coordinated_local_human', meeting_to_brief: true, project_status: true, durable_steps: true, fresh_process_claim_review: true, simulated_response_loss_reconciled: true, simulated_deliveries: 1, real_external_deliveries: 0, runtime_invoked: false }) + '\n');
} finally { rmSync(root, { recursive: true, force: true }); }
