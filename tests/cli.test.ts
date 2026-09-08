import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../cli/main.js', import.meta.url));
const fixture = fileURLToPath(new URL('../../examples/record-envelope.json', import.meta.url));
const run = (args: string[], env: NodeJS.ProcessEnv = process.env) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', env });

test('CLI help and version work without importing the SQLite adapter', () => {
  const help = run(['--help']);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /validate-record/);
  assert.equal(help.stderr, '');
  const version = run(['--version']);
  assert.equal(version.status, 0);
  assert.match(version.stdout, /^0\.1\.0-dev\.1\n$/);
});

test('CLI validates metadata and rejects unsupported commands without claiming installation', () => {
  const valid = run(['validate-record', fixture]);
  assert.equal(valid.status, 0, valid.stderr);
  assert.equal(JSON.parse(valid.stdout).scope, 'record_envelope_only');
  for (const args of [['install'], ['doctor', '--unexpected'], ['validate-record']]) {
    assert.equal(run(args).status, 2);
  }
});

test('CLI gives nonzero results for missing, malformed and semantically invalid JSON', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mcc-cli-test-'));
  try {
    const path = join(directory, 'invalid record.json');
    assert.equal(run(['validate-record', path]).status, 2);
    writeFileSync(path, '{');
    const malformed = run(['validate-record', path]);
    assert.equal(malformed.status, 2);
    assert.equal(JSON.parse(malformed.stderr).code, 'INVALID_INPUT');
    writeFileSync(path, '{}');
    const invalid = run(['validate-record', path]);
    assert.equal(invalid.status, 2);
    assert.equal(JSON.parse(invalid.stdout).code, 'INVALID_INPUT');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('doctor probes temporary storage without creating a private instance directory', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mcc-doctor-test-'));
  const privateData = join(directory, 'private-data');
  try {
    const result = run(['doctor'], { ...process.env, MANU_CONTROL_CENTER_DATA_DIR: privateData });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.ok, true);
    assert.equal(report.data_directory.path, privateData);
    assert.equal(report.runtime_integration, 'not_verified');
    assert.equal(existsSync(privateData), false);
    assert.equal(run(['doctor'], { ...process.env, MANU_CONTROL_CENTER_DATA_DIR: './invalid' }).status, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('CLI exposes all contracts and validates bundles without echoing fixture expectations', () => {
  const contracts=run(['contracts']);assert.equal(contracts.status,0);assert.equal(JSON.parse(contracts.stdout).kinds.length,22);
  const meeting=fileURLToPath(new URL('../../examples/meeting.json',import.meta.url));
  const validated=run(['validate','eval_fixture',meeting]);assert.equal(validated.status,0,validated.stderr);assert.equal(validated.stdout.includes('expected'),false);
  const bundle=fileURLToPath(new URL('../../examples/contracts/construction-bundle.json',import.meta.url));
  const checked=run(['validate-bundle',bundle]);assert.equal(checked.status,0,checked.stdout);assert.equal(JSON.parse(checked.stdout).scope,'declared_construction_coherence');
  assert.equal(run(['validate','unknown',meeting]).status,2);
  const invalid=fileURLToPath(new URL('../../examples/contracts/invalid-plan.json',import.meta.url));
  assert.equal(run(['validate','plan',invalid]).status,2);
});
