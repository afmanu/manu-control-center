import { test } from 'node:test';
import { projectPurpose } from './locales/es.js';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync, readFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../cli/main.js', import.meta.url));
const fixture = fileURLToPath(new URL('../../examples/record-envelope.json', import.meta.url));
const errorRecord = (stderr: string) => JSON.parse(stderr.split('\n').find(line => line.startsWith('{'))!);
const run = (args: string[], env: NodeJS.ProcessEnv = process.env) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', env });

test('CLI help and version work without importing the SQLite adapter', () => {
  const help = run(['--help']);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /validate-record/);
  assert.equal(help.stderr, '');
  const version = run(['--version']);
  assert.equal(version.status, 0);
  assert.match(version.stdout, /^0\.1\.0-dev\.3\n$/);
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

test('M2 CLI resolves, plans, applies, verifies and inspects an installation from separate processes', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'mcc-cli-builder-')));
  const input = fileURLToPath(new URL('../../examples/install-request.json', import.meta.url));
  const directory = join(root, 'data'), planFile = join(root, 'plan.json');
  try {
    const resolved = run(['resolve', input, directory]);
    assert.equal(resolved.status, 0, resolved.stderr); assert.equal(JSON.parse(resolved.stdout).spec.kind, 'instance_spec');
    const planned = run(['plan', input, directory]); assert.equal(planned.status, 0, planned.stderr);
    assert.equal(existsSync(directory), false); writeFileSync(planFile, planned.stdout);
    const denied = run(['apply', planFile, '--actor', 'someone-else']);
    assert.equal(denied.status, 1); assert.equal(errorRecord(denied.stderr).code, 'FORBIDDEN');
    assert.equal(existsSync(directory), false);
    const applied = run(['apply', planFile, '--actor', 'local-user']);
    assert.equal(applied.status, 0, applied.stderr); assert.equal(JSON.parse(applied.stdout).manifest.state, 'installed_unverified');
    const verified = run(['verify', input, directory]);
    assert.equal(verified.status, 0, verified.stderr); assert.equal(JSON.parse(verified.stdout).manifest.state, 'verified');
    const before = readFileSync(join(directory, 'store.sqlite'));
    const inspected = run(['inspect', input, directory]); assert.equal(inspected.status, 0, inspected.stderr);
    assert.equal(JSON.parse(inspected.stdout).verification_evidence.length, 1);
    assert.deepEqual(readFileSync(join(directory, 'store.sqlite')), before);
    assert.equal(run(['resume', input, directory, '--actor', 'local-user']).status, 0);
    assert.equal(run(['create', input, join(root, 'second'), '--actor', 'local-user']).status, 0);
    assert.equal(run(['adopt', input, join(root, 'uncreated'), '--actor', 'local-user']).status, 2);
    assert.equal(run(['plan', input]).status, 2);
    writeFileSync(planFile, '{}');
    const invalid = run(['apply', planFile, '--actor', 'local-user']);
    assert.equal(invalid.status, 2); assert.equal(errorRecord(invalid.stderr).code, 'INVALID_INPUT');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('CLI defaults to English and supports explicit Spanish with flag precedence and no SQLite import', () => {
  const environment: NodeJS.ProcessEnv = { ...process.env, LANG: 'es_ES.UTF-8' };
  delete environment.MANU_CONTROL_CENTER_LANG;
  const defaultHelp = run(['--help'], environment);
  assert.equal(defaultHelp.status, 0); assert.match(defaultHelp.stdout, /Usage:/); assert.equal(defaultHelp.stderr, '');
  const spanish = run(['--help'], { ...environment, MANU_CONTROL_CENTER_LANG: 'es' });
  assert.equal(spanish.status, 0); assert.match(spanish.stdout, /Uso:/); assert.equal(spanish.stderr, '');
  for (const args of [['--lang', 'es', '--help'], ['--help', '--lang', 'es']]) {
    assert.equal(run(args, environment).stdout, spanish.stdout);
  }
  assert.equal(run(['--lang', 'en', '--help'], { ...environment, MANU_CONTROL_CENTER_LANG: 'es' }).stdout, defaultHelp.stdout);
  assert.equal(run(['--lang', 'en', '--help'], { ...environment, MANU_CONTROL_CENTER_LANG: 'invalid' }).stdout, defaultHelp.stdout);
});

test('invalid language selection fails before constructor dispatch or destination writes', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'mcc-language-invalid-')));
  const input = fileURLToPath(new URL('../../examples/install-request.json', import.meta.url));
  const directory = join(root, 'uncreated');
  const command = ['create', input, directory, '--actor', 'local-user'];
  try {
    for (const flags of [['--lang'], ['--lang', 'fr'], ['--lang', 'es', '--lang', 'en'], ['--lang', 'es', '--lang']]) {
      const result = run([...command, ...flags]);
      assert.equal(result.status, 2); assert.equal(errorRecord(result.stderr).code, 'INVALID_INPUT');
      assert.equal(result.stdout, ''); assert.equal(existsSync(directory), false);
    }
    const invalidEnvironment = run(command, { ...process.env, MANU_CONTROL_CENTER_LANG: 'invalid' });
    assert.equal(invalidEnvironment.status, 2); assert.equal(existsSync(directory), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('Spanish CLI adds error summaries while retaining canonical diagnostics and exit codes', () => {
  const input = fileURLToPath(new URL('../../examples/meeting.json', import.meta.url));
  for (const args of [['validate', 'unknown', input], ['plan'], ['validate-record', '/missing-mcc-language-fixture.json']]) {
    const english = run(['--lang', 'en', ...args]);
    const spanish = run(['--lang', 'es', ...args]);
    assert.equal(spanish.status, english.status); assert.equal(spanish.status, 2);
    const en = english.stdout ? JSON.parse(english.stdout) : errorRecord(english.stderr);
    const es = spanish.stdout ? JSON.parse(spanish.stdout) : errorRecord(spanish.stderr);
    assert.equal(typeof es.display_message, 'string'); assert.notEqual(es.display_message, en.message);
    delete es.display_message;
    assert.deepEqual(es, en);
  }
  assert.match(run(['--lang', 'en', 'unknown']).stderr, /Invalid arguments/);
  assert.match(run(['--lang', 'es', 'unknown']).stderr, /Argumentos/);
});

test('CLI language never translates user content or changes resolved plans and their digests', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'mcc-language-content-')));
  const input = JSON.parse(readFileSync(fileURLToPath(new URL('../../examples/install-request.json', import.meta.url)), 'utf8'));
  input.purpose = projectPurpose; input.project.purpose = projectPurpose;
  const request = join(root, 'request.json'), directory = join(root, 'data');
  writeFileSync(request, JSON.stringify(input));
  try {
    const en = run(['--lang', 'en', 'plan', request, directory]);
    const es = run(['--lang', 'es', 'plan', request, directory]);
    assert.equal(en.status, 0, en.stderr); assert.equal(es.status, 0, es.stderr);
    assert.equal(es.stdout, en.stdout); assert.equal(existsSync(directory), false);
    const plan = JSON.parse(es.stdout);
    assert.equal(plan.request.project.purpose, projectPurpose);
    assert.equal(plan.catalog.blueprint.purpose, 'Installable project knowledge foundation; workflows in M3');
    const created = run(['--lang', 'es', 'create', request, directory, '--actor', input.owner_id]);
    assert.equal(created.status, 0, created.stderr);
    const inspected = run(['--lang', 'en', 'inspect', request, directory]);
    assert.equal(inspected.status, 0, inspected.stderr);
    assert.equal(JSON.parse(inspected.stdout).inspection.project.data.purpose, projectPurpose);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
