import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, writeFileSync, readFileSync, readdirSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { createOperationalProfile, createOperationalWorkspace, inspectOperationalProfile, prepareProfileCommand, readOperationalProfile } from '../adapters/interfaces/local/profile.js';
import { applyLocalInstallation, planLocalInstallation, verifyLocalInstallation } from '../adapters/interfaces/local/installation.js';
import { DomainError } from '../core/errors.js';

const example = JSON.parse(readFileSync(new URL('../../examples/install-request.json', import.meta.url), 'utf8'));
const cli = fileURLToPath(new URL('../cli/main.js', import.meta.url));
const code = (value: string) => (error: unknown) => error instanceof DomainError && error.code === value;
function setup() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'mcc-profile-'))), directory = join(root, 'instance'), request = join(root, 'request.json'), profile = join(root, 'profile.json');
  writeFileSync(request, JSON.stringify(example));
  const plan = planLocalInstallation(example, directory);
  applyLocalInstallation(plan, { actor_id: example.owner_id, instance_id: example.instance_id, plan_digest: plan.digest, destination: directory, effects: ['instance.install'], valid_until: '2099-01-01T00:00:00.000Z' });
  verifyLocalInstallation(example, directory);
  return { root, directory, request, profile, create: () => createOperationalProfile(request, directory, example.owner_id, profile, 'es', 'gpt-5.6-sol') };
}
const run = (...args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', env: { ...process.env, MANU_CONTROL_CENTER_LANG: 'en' } });
test('operational profile creation and inspection preserve request, foundation and directory entries', () => {
  const s = setup(); try {
    const requestBytes = readFileSync(s.request), db = join(s.directory, 'store.sqlite'), bytes = readFileSync(db), entries = readdirSync(s.directory);
    assert.equal(s.create().replayed, false); assert.equal(s.create().replayed, true);
    const view = inspectOperationalProfile(s.profile); assert.equal(view.profile.language, 'es'); assert.equal(view.session.project.ref.id, example.project.id); assert.equal(view.runtime_availability, 'not_invoked_by_inspection');
    assert.deepEqual(readFileSync(db), bytes); assert.deepEqual(readFileSync(s.request), requestBytes); assert.deepEqual(readdirSync(s.directory), entries);
    assert.equal(readdirSync(s.root).some(name => name.startsWith('.mcc-profile-')), false);
  } finally { rmSync(s.root, { recursive: true, force: true }); }
});
test('profile edits support language and model but reject changed original requests and wrong identities', () => {
  const s = setup(); try {
    s.create(); const p = readOperationalProfile(s.profile).profile;
    writeFileSync(s.profile, JSON.stringify({ ...p, language: 'en', runtime: { ...p.runtime, model: null } }));
    assert.equal(readOperationalProfile(s.profile).profile.language, 'en');
    for (const change of [{ actor_id: 'other' }, { instance_id: 'other' }, { project_id: 'other' }, { language: ['en'] }, { runtime: { ...p.runtime, model: '--shell' } }, { runtime: { ...p.runtime, version: 'future' } }, { unexpected: true }]) {
      writeFileSync(s.profile, JSON.stringify({ ...p, ...change })); assert.throws(() => readOperationalProfile(s.profile));
    }
    writeFileSync(s.profile, JSON.stringify(p)); writeFileSync(s.request, readFileSync(s.request, 'utf8') + '\n');
    assert.throws(() => readOperationalProfile(s.profile), code('CONFLICT'));
  } finally { rmSync(s.root, { recursive: true, force: true }); }
});
test('profile publication never replaces original requests, unrelated files, symlinks or edited profiles', () => {
  const s = setup(); try {
    const original = readFileSync(s.request);
    assert.throws(() => createOperationalProfile(s.request, s.directory, example.owner_id, s.request)); assert.deepEqual(readFileSync(s.request), original);
    writeFileSync(s.profile, 'unrelated content'); assert.throws(s.create); assert.equal(readFileSync(s.profile, 'utf8'), 'unrelated content');
    rmSync(s.profile); s.create(); const p = readOperationalProfile(s.profile).profile;
    writeFileSync(s.profile, JSON.stringify({ ...p, language: 'en' })); assert.throws(s.create, code('CONFLICT'));
    if (process.platform !== 'win32') { const link = join(s.root, 'profile-link'); symlinkSync(s.profile, link); assert.throws(() => readOperationalProfile(link), code('INVALID_INPUT')); }
  } finally { rmSync(s.root, { recursive: true, force: true }); }
});
test('profiles require an existing matching owner foundation before any output is created', () => {
  const s = setup(); try {
    assert.throws(() => createOperationalProfile(s.request, s.directory, 'other', s.profile), code('FORBIDDEN')); assert.equal(existsSync(s.profile), false);
    assert.throws(() => createOperationalProfile(s.request, join(s.root, 'missing'), example.owner_id, s.profile), code('NOT_FOUND')); assert.equal(existsSync(s.profile), false);
    assert.throws(() => createOperationalProfile(s.request, s.directory, example.owner_id, s.profile, 'xx' as never), code('INVALID_INPUT'));
  } finally { rmSync(s.root, { recursive: true, force: true }); }
});
test('profile command binding rejects identity overrides and construction while retaining flag-looking source text', () => {
  const s = setup(); try {
    s.create();
    const command = prepareProfileCommand(s.profile, 'capture', ['source', '--key', 'one', '--text', '--actor']);
    assert.deepEqual(command.args, ['capture', s.request, s.directory, 'source', '--key', 'one', '--text', '--actor', '--actor', example.owner_id]);
    assert.equal(command.model, 'gpt-5.6-sol');
    for (const operation of ['create', 'apply', 'use', 'profile-workspace', 'constructor']) assert.throws(() => prepareProfileCommand(s.profile, operation, []), code('INVALID_INPUT'));
    for (const flag of ['--actor', '--model', '--profile']) assert.throws(() => prepareProfileCommand(s.profile, 'session', [flag, 'other']), code('FORBIDDEN'));
  } finally { rmSync(s.root, { recursive: true, force: true }); }
});
test('use CLI preserves source text, profile language and per-command locale override', () => {
  const s = setup(); try {
    s.create();
    const captured = run('use', s.profile, 'capture', '--lang', '--key', 'one', '--text', '--actor');
    assert.equal(captured.status, 0, captured.stderr); const receipt = JSON.parse(captured.stdout);
    const read = run('use', s.profile, 'source', '--lang', '--revision', receipt.source_ref.revision);
    assert.equal(read.status, 0, read.stderr); assert.equal(JSON.parse(read.stdout).data.segments[0].text, '--actor');
    const failure = run('use', s.profile, 'source', 'missing'); assert.ok(JSON.parse(failure.stderr.split('\n').find(line => line.startsWith('{'))!).display_message);
    const english = run('--lang', 'en', 'use', s.profile, 'source', 'missing'); assert.equal(JSON.parse(english.stderr.split('\n').find(line => line.startsWith('{'))!).display_message, undefined);
    assert.equal(run('use', s.profile, 'session', '--actor', 'other').status, 1);
  } finally { rmSync(s.root, { recursive: true, force: true }); }
});
test('operating workspace uses the packaged CLI and profile without PATH installation or overwriting custom files', () => {
  const s = setup(); try {
    s.create(); const output = createOperationalWorkspace(s.profile, join(s.root, 'workspace'));
    const opened = spawnSync(process.execPath, [join(output.workspace, 'mcc.mjs'), 'session'], { encoding: 'utf8' });
    assert.equal(opened.status, 0, opened.stderr); assert.equal(JSON.parse(opened.stdout).instance_id, example.instance_id);
    const helper = spawnSync(process.execPath, [join(output.workspace, '.agents/skills/manu-control-center/scripts/mcc.mjs'), 'use', s.profile, 'session'], { encoding: 'utf8' });
    assert.equal(helper.status, 0, helper.stderr); assert.equal(JSON.parse(helper.stdout).project.ref.id, example.project.id);
    writeFileSync(join(output.workspace, 'START-HERE.md'), 'Owner customization');
    assert.throws(() => createOperationalWorkspace(s.profile, output.workspace), code('CONFLICT'));
    assert.equal(readFileSync(join(output.workspace, 'START-HERE.md'), 'utf8'), 'Owner customization');
  } finally { rmSync(s.root, { recursive: true, force: true }); }
});
test('independent profile publishers retain one complete profile with idempotent replay', async () => {
  const s = setup(); try {
    const command = ['profile-create', s.request, s.directory, s.profile, '--actor', example.owner_id];
    const child = () => new Promise<{ code: number | null; output: string; error: string }>(resolve => { const p = spawn(process.execPath, [cli, ...command]); let output = '', error = ''; p.stdout.on('data', x => { output += x; }); p.stderr.on('data', x => { error += x; }); p.on('close', code => resolve({ code, output, error })); });
    const results = await Promise.all([child(), child()]);
    for (const result of results) assert.equal(result.code, 0, result.error);
    assert.equal(results.filter(r => JSON.parse(r.output).replayed).length, 1); assert.equal(readOperationalProfile(s.profile).profile.instance_id, example.instance_id);
  } finally { rmSync(s.root, { recursive: true, force: true }); }
});

test('profile-bound capture and both workflows complete through fresh CLI processes', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../../examples/profile-demo.mjs', import.meta.url))], { encoding: 'utf8', timeout: 60000 });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).actual_runtime_invoked, false);
});
