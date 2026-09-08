import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectPurpose } from './locales/es.js';

const request = fileURLToPath(new URL('../../examples/install-request.json', import.meta.url));
const cli = fileURLToPath(new URL('../cli/main.js', import.meta.url));
const run = (args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', env: { ...process.env, MANU_CONTROL_CENTER_LANG: 'en' } });
function success(args: string[]) { const result = run(args); assert.equal(result.status, 0, result.stderr); return JSON.parse(result.stdout); }
function temporary(work: (root: string, directory: string, payload: (name: string, data: unknown) => string) => void) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'mcc-local-review-')));
  try { work(root, join(root, 'instance'), (name, data) => { const path = join(root, name + '.json'); writeFileSync(path, JSON.stringify(data)); return path; }); }
  finally { rmSync(root, { recursive: true, force: true }); }
}
const ref = (record: { id: string; revision: string }) => ({ id: record.id, revision: record.revision });

test('fresh CLI processes propose, authorize, activate and query a decision with historical sources', () => temporary((_root, directory, payload) => {
  success(['create', request, directory, '--actor', 'local-user']);
  const command = (name: string, ...args: string[]) => success([name, request, directory, ...args, '--actor', 'local-user']);
  const source = command('capture', 'source-one', '--key', 'one', '--text', 'Synthetic meeting: prototype suggested');
  const claim = command('claim', payload('claim', { id: 'hypothesis', expected_revision: null, data: { content: 'A prototype may help', epistemic_status: 'hypothesis', evidence: [{ source: source.source_ref, segment_id: 'body' }], validity: { valid_from: '2026-01-01T00:00:00.000Z', valid_to: null } } }));
  assert.equal(claim.data.epistemic_status, 'hypothesis');
  assert.equal(command('knowledge', 'claim', '--valid-at', '2026-06-01T00:00:00.000Z').records.length, 1);
  const decision = command('decision-propose', payload('proposal', { id: 'prototype', expected_revision: null, data: { choice: 'Build a prototype', alternatives: ['Wait'], evidence: [{ source: source.source_ref, segment_id: 'body' }], review_criterion: 'Review after the pilot' } }));
  assert.equal(decision.data.status, 'proposed');
  const authorization = command('decision-grant', payload('grant', { id: decision.id, expected_revision: decision.revision, grant_id: 'grant-prototype', operation: 'decision.promote', valid_until: '2099-01-01T00:00:00.000Z' }));
  const active = command('decision-set', payload('activate', { id: decision.id, expected_revision: decision.revision, grant_ref: ref(authorization), status: 'active' }));
  assert.equal(active.decision.data.status, 'active');
  const before = readFileSync(join(directory, 'store.sqlite')), entries = readdirSync(directory);
  assert.equal(command('knowledge', 'decision').records[0].data.status, 'active');
  assert.equal(command('knowledge', 'decision', '--as-of', decision.updated_at).records[0].data.status, 'proposed');
  assert.deepEqual(command('knowledge-record', decision.id, '--kind', 'decision', '--revision', decision.revision), decision);
  assert.equal(command('source', 'source-one', '--as-of', decision.updated_at).revision, source.source_ref.revision);
  assert.equal(command('search', 'prototype', '--as-of', decision.updated_at).matches.length, 1);
  assert.equal(command('context', '--as-of', decision.updated_at, '--valid-at', decision.updated_at).sources.matches.length, 1);
  assert.deepEqual(readFileSync(join(directory, 'store.sqlite')), before); assert.deepEqual(readdirSync(directory), entries);
  assert.equal(command('decision-revoke-grant', payload('revoke', { id: decision.id, grant_ref: ref(authorization) })).data.revoked, true);
}));

test('Spanish CLI preserves an approved artifact while editing its fork and checking source freshness', () => temporary((_root, directory, payload) => {
  success(['create', request, directory, '--actor', 'local-user']);
  const command = (name: string, ...args: string[]) => success(['--lang', 'es', name, request, directory, ...args, '--actor', 'local-user']);
  const source = command('capture', 'source-one', '--key', 'one', '--text', projectPurpose);
  const artifact = command('artifact-draft', payload('artifact', { id: 'brief-one', expected_revision: null, data: { content: projectPurpose + '\r\n', source_refs: [source.source_ref] } }));
  const approved = command('artifact-approve', payload('approve', { id: artifact.id, expected_revision: artifact.revision, source_policy: 'fresh' }));
  const fork = command('artifact-fork', payload('fork', { approved_ref: ref(approved), draft_id: 'brief-two' }));
  command('artifact-draft', payload('edit', { id: fork.artifact.id, expected_revision: fork.artifact.revision, data: { content: projectPurpose + '\n\n', source_refs: [source.source_ref] } }));
  command('capture', 'source-one', '--key', 'two', '--text', 'Synthetic source revision', '--expected-revision', source.source_ref.revision);
  const check = command('sources-check', payload('fresh', { policy: 'fresh', refs: [source.source_ref] })); assert.equal(check.invalidate, true);
  assert.deepEqual(command('knowledge-record', approved.id, '--kind', 'artifact', '--revision', approved.revision), approved);
  assert.equal(approved.data.content, projectPurpose + '\r\n');
  assert.equal(command('knowledge', 'artifact', '--text', projectPurpose).records.length, 2);
}));

test('review CLI rejects forged scope, extra options and invalid selectors without writes or installation', () => temporary((_root, directory, payload) => {
  const claim = payload('claim', { id: 'claim', expected_revision: null, data: { content: 'Synthetic', epistemic_status: 'declared', evidence: [] } });
  assert.notEqual(run(['claim', request, directory, claim, '--actor', 'local-user']).status, 0); assert.equal(existsSync(directory), false);
  success(['create', request, directory, '--actor', 'local-user']); const before = readFileSync(join(directory, 'store.sqlite'));
  const malformed = payload('malformed', { id: 'claim', expected_revision: null, data: 'not an object' });
  assert.equal(run(['claim', request, directory, malformed, '--actor', 'local-user']).status, 2);
  for (const extra of [{ project_id: 'another-project' }, { can_authorize: true }, { actor_id: 'other' }]) {
    const data = payload('forged', { id: 'claim', expected_revision: null, data: { content: 'Synthetic', epistemic_status: 'hypothesis', evidence: [] }, ...extra });
    assert.equal(run(['claim', request, directory, data, '--actor', 'local-user']).status, 2);
  }
  for (const args of [
    ['knowledge', 'unknown'], ['knowledge', 'claim', '--limit', '1e2'], ['knowledge', 'claim', '--as-of', 'tomorrow'],
    ['knowledge', 'claim', '--actor', 'local-user'], ['knowledge-record', 'missing', '--kind', 'unknown'],
    ['artifact-approve', claim, '--can-authorize', 'true'], ['claim', claim, '--unexpected', 'value'],
  ]) assert.equal(run([args[0]!, request, directory, ...args.slice(1), '--actor', 'local-user']).status, 2);
  assert.equal(run(['decision-grant', request, directory, claim, '--actor', 'other']).status, 1);
  assert.deepEqual(readFileSync(join(directory, 'store.sqlite')), before);
}));
