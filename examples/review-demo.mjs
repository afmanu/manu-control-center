import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Disposable synthetic demonstration. No user instance or source is imported.
const root = mkdtempSync(join(tmpdir(), 'mcc-review-demo-'));
const cli = fileURLToPath(new URL('../dist/cli/main.js', import.meta.url));
const request = fileURLToPath(new URL('install-request.json', import.meta.url));
const instance = join(root, 'instance');
const command = (name, ...args) => JSON.parse(execFileSync(process.execPath, [cli, name, request, instance, ...args, '--actor', 'local-user'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const payload = (name, data) => { const path = join(root, name + '.json'); writeFileSync(path, JSON.stringify(data)); return path; };
const ref = record => ({ id: record.id, revision: record.revision });
try {
  command('create');
  const source = command('capture', 'meeting', '--key', 'meeting-1', '--text', 'Synthetic meeting: a prototype was proposed.');
  const proposal = command('decision-propose', payload('proposal', { id: 'prototype', expected_revision: null, data: { choice: 'Build a prototype', alternatives: ['Wait for more evidence'], evidence: [{ source: source.source_ref, segment_id: 'body' }], review_criterion: 'Review after the pilot' } }));
  const grant = command('decision-grant', payload('grant', { id: proposal.id, expected_revision: proposal.revision, grant_id: 'prototype-grant', operation: 'decision.promote', valid_until: new Date(Date.now() + 3600000).toISOString() }));
  const active = command('decision-set', payload('activate', { id: proposal.id, expected_revision: proposal.revision, grant_ref: ref(grant), status: 'active' }));
  const draft = command('artifact-draft', payload('draft', { id: 'brief', expected_revision: null, data: { content: 'Exact synthetic brief\r\n', source_refs: [source.source_ref] } }));
  const approved = command('artifact-approve', payload('approve', { id: draft.id, expected_revision: draft.revision, source_policy: 'fresh' }));
  const fork = command('artifact-fork', payload('fork', { approved_ref: ref(approved), draft_id: 'next-brief' }));
  command('artifact-draft', payload('edit', { id: fork.artifact.id, expected_revision: fork.artifact.revision, data: { content: 'Later synthetic draft', source_refs: [source.source_ref] } }));
  const changed = command('capture', 'meeting', '--key', 'meeting-2', '--expected-revision', source.source_ref.revision, '--text', 'Synthetic meeting revised.');
  command('decision-revoke-grant', payload('revoke-grant', { id: proposal.id, grant_ref: ref(grant) }));
  const before = readFileSync(join(instance, 'store.sqlite'));
  assert.equal(active.decision.data.status, 'active');
  assert.equal(command('knowledge', 'decision', '--as-of', proposal.updated_at).records[0].data.status, 'proposed');
  assert.equal(command('source', 'meeting', '--as-of', proposal.updated_at).revision, source.source_ref.revision);
  assert.deepEqual(command('knowledge-record', approved.id, '--kind', 'artifact', '--revision', approved.revision), approved);
  const fresh = command('sources-check', payload('fresh', { policy: 'fresh', refs: [source.source_ref] }));
  const snapshot = command('sources-check', payload('snapshot', { policy: 'snapshot', refs: [source.source_ref] }));
  assert.equal(fresh.invalidate, true); assert.deepEqual(fresh.refs, [changed.source_ref]);
  assert.equal(snapshot.invalidate, false); assert.deepEqual(snapshot.refs, [source.source_ref]);
  assert.deepEqual(readFileSync(join(instance, 'store.sqlite')), before);
  process.stdout.write(JSON.stringify({ ok: true, synthetic: true, cli_decision_authority: true, temporal_retrieval: true, approved_artifact_exact: true, source_policy_preflight: true, reads_preserve_store: true }) + '\n');
} finally { rmSync(root, { recursive: true, force: true }); }
