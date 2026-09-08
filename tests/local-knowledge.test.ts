import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { captureLocalSource, readLocalContext, readLocalTextFile } from '../adapters/interfaces/local/knowledge.js';
import { applyLocalInstallation, inspectLocalInstallation, planLocalInstallation, recoverLocalConstruction, verifyLocalInstallation } from '../adapters/interfaces/local/installation.js';
import { SqliteKnowledgeBackend } from '../adapters/backends/sqlite/knowledge.js';
import { MAX_CAPTURE_BYTES } from '../core/knowledge.js';
import { DomainError } from '../core/errors.js';
import { projectPurpose } from './locales/es.js';

const requestPath = fileURLToPath(new URL('../../examples/install-request.json', import.meta.url));
const request = JSON.parse(readFileSync(requestPath, 'utf8'));
const cli = fileURLToPath(new URL('../cli/main.js', import.meta.url));
const run = (args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', env: { ...process.env, MANU_CONTROL_CENTER_LANG: 'en' } });
function command(args: string[]) { const result = run(args); assert.equal(result.status, 0, result.stderr); return JSON.parse(result.stdout); }
const code = (expected: string) => (error: unknown) => error instanceof DomainError && error.code === expected;
function temporary(work: (root: string, directory: string) => void) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'mcc-local-knowledge-')));
  try { work(root, join(root, 'instance')); } finally { rmSync(root, { recursive: true, force: true }); }
}
function install(directory: string) {
  const plan = planLocalInstallation(request, directory);
  applyLocalInstallation(plan, { actor_id: request.owner_id, instance_id: request.instance_id, plan_digest: plan.digest, destination: directory, effects: ['instance.install'], valid_until: '2099-01-01T00:00:00.000Z' });
  verifyLocalInstallation(request, directory);
}

test('file capture preserves UTF-8 BOM and CRLF with a canonical locator; invalid and oversized files fail', () => temporary((root) => {
  const file = join(root, 'synthetic source.txt'), text = '\ufeffSynthetic source\r\n\r\nFinal line\n';
  writeFileSync(file, text);
  assert.deepEqual(readLocalTextFile(file), { content: text, locator: pathToFileURL(realpathSync(file)).href });
  for (const bytes of [Buffer.from([0xff, 0xfe]), Buffer.from('text\0binary'), Buffer.from(' \n'), Buffer.alloc(MAX_CAPTURE_BYTES + 1, 65)]) {
    writeFileSync(file, bytes); assert.throws(() => readLocalTextFile(file), code('INVALID_INPUT'));
  }
  assert.throws(() => readLocalTextFile(root), code('INVALID_INPUT'));
  assert.throws(() => readLocalTextFile(join(root, 'missing')), code('INVALID_INPUT'));
  if (process.platform !== 'win32') {
    const fifo = join(root, 'pipe'); assert.equal(spawnSync('mkfifo', [fifo]).status, 0);
    assert.throws(() => readLocalTextFile(fifo), code('INVALID_INPUT'));
  }
}));

test('knowledge commands require an existing matching installation and never create a missing instance', () => temporary((_root, directory) => {
  const capture = { source_id: 'source', request_key: 'one', expected_revision: null, text: 'Synthetic' };
  assert.throws(() => captureLocalSource(request, directory, request.owner_id, capture), code('NOT_FOUND'));
  assert.throws(() => readLocalContext(request, directory, request.owner_id), code('NOT_FOUND')); assert.equal(existsSync(directory), false);
  install(directory); const before = readFileSync(join(directory, 'store.sqlite'));
  assert.throws(() => captureLocalSource(request, directory, 'other', capture), code('FORBIDDEN'));
  assert.throws(() => readLocalContext({ ...request, purpose: 'Forged request' }, directory, request.owner_id), code('CONFLICT'));
  for (const invalid of [{ ...capture, text: '' }, { ...capture, file: '/missing' }, { ...capture, extra: true }]) assert.throws(() => captureLocalSource(request, directory, request.owner_id, invalid), code('INVALID_INPUT'));
  assert.deepEqual(readFileSync(join(directory, 'store.sqlite')), before);
}));

test('CLI captures, searches, reads exact versions and paginates history across fresh processes', () => temporary((root, directory) => {
  install(directory); const prefix = [requestPath, directory], owner = ['--actor', request.owner_id];
  const file = join(root, 'source.txt'); writeFileSync(file, '\ufeffSynthetic launch notes\r\n');
  const first = command(['capture', ...prefix, 'launch', ...owner, '--key', 'one', '--file', file]);
  assert.equal(first.replayed, false);
  assert.deepEqual(command(['capture', ...prefix, 'launch', ...owner, '--key', 'one', '--file', file]), { ...first, replayed: true });
  const original = command(['source', ...prefix, 'launch', ...owner, '--revision', first.source_ref.revision]);
  assert.equal(original.data.segments[0].text, readFileSync(file, 'utf8'));
  writeFileSync(file, 'Synthetic revised launch notes\n');
  assert.equal(run(['capture', ...prefix, 'launch', ...owner, '--key', 'two', '--file', file]).status, 1);
  const second = command(['capture', ...prefix, 'launch', ...owner, '--key', 'two', '--file', file, '--expected-revision', first.source_ref.revision]);
  const before = readFileSync(join(directory, 'store.sqlite')), entries = readdirSync(directory);
  const search = command(['search', ...prefix, 'revised', ...owner, '--limit', '1']);
  assert.deepEqual(search.matches[0].source_ref, second.source_ref);
  assert.deepEqual(command(['source', ...prefix, 'launch', ...owner, '--revision', first.source_ref.revision]), original);
  const history = command(['source-history', ...prefix, 'launch', ...owner, '--limit', '1']);
  assert.equal(history.next_cursor, first.source_ref.revision);
  assert.equal(command(['source-history', ...prefix, 'launch', ...owner, '--after-revision', history.next_cursor]).versions[0].source_ref.revision, second.source_ref.revision);
  assert.equal(command(['context', ...prefix, ...owner]).sources.matches.length, 1);
  assert.deepEqual(readFileSync(join(directory, 'store.sqlite')), before); assert.deepEqual(readdirSync(directory), entries);
  const verified = verifyLocalInstallation(request, directory); assert.equal(verified.state, 'verified');
}));

test('Spanish CLI preserves source text and treats flag-looking content as data', () => temporary((_root, directory) => {
  install(directory); const prefix = [requestPath, directory], owner = ['--actor', request.owner_id];
  command(['--lang', 'es', 'capture', ...prefix, 'spanish', ...owner, '--key', 'spanish', '--text', projectPurpose]);
  assert.equal(command(['--lang', 'es', 'source', ...prefix, 'spanish', ...owner]).data.segments[0].text, projectPurpose);
  command(['capture', ...prefix, 'flag', ...owner, '--key', 'flag', '--text', '--lang', '--lang', 'es']);
  assert.equal(command(['source', ...prefix, 'flag', ...owner]).data.segments[0].text, '--lang');
  assert.equal(command(['search', ...prefix, '--lang', ...owner]).matches.length, 1);
  const denied = run(['--lang', 'es', 'capture', ...prefix, 'denied', '--actor', 'other', '--key', 'denied', '--text', 'Synthetic']);
  const error = JSON.parse(denied.stderr.split('\n').find(line => line.startsWith('{'))!);
  assert.equal(denied.status, 1); assert.equal(error.code, 'FORBIDDEN'); assert.equal(typeof error.display_message, 'string');
}));

test('CLI rejects unknown, duplicate, missing and ambiguous options before any data change', () => temporary((_root, directory) => {
  install(directory); const before = readFileSync(join(directory, 'store.sqlite'));
  const base = ['capture', requestPath, directory, 'source', '--actor', request.owner_id, '--key', 'key'];
  for (const options of [[], ['--text'], ['--text', 'data', '--text', 'data'], ['--text', 'data', '--file', '/missing'], ['--text', 'data', '--unexpected', 'value']]) assert.equal(run([...base, ...options]).status, 2);
  for (const limit of ['0', '101', '1.1', '1e1', '-1']) assert.equal(run(['context', requestPath, directory, '--actor', request.owner_id, '--limit', limit]).status, 2);
  assert.deepEqual(readFileSync(join(directory, 'store.sqlite')), before);
}));

for (const spill of [false, true]) test(`a process exit inside capture recovers a ${spill ? 'hot' : 'cold'} journal atomically`, () => temporary((root, directory) => {
  install(directory); const database = join(directory, 'store.sqlite'), script = join(root, 'crash.mjs');
  writeFileSync(script, `import { SqliteKnowledgeBackend } from ${JSON.stringify(new URL('../adapters/backends/sqlite/knowledge.js', import.meta.url).href)};
class Crash extends SqliteKnowledgeBackend { constructor(path) { super(path); if(${spill}) this.db.exec('PRAGMA cache_size=1'); } forScope(scope) { const store=super.forScope(scope);return {...store,create(record){if(record.kind==='capture')process.exit(73);return store.create(record);}};} }
const backend=new Crash(${JSON.stringify(database)});backend.forKnowledge(${JSON.stringify({ instance_id: request.instance_id, actor_id: request.owner_id })}).capture(${JSON.stringify({ project_id: request.project.id, source_id: 'crash-source', request_key: 'crash', locator: 'text:crash-source', content: 'Synthetic '.repeat(30000), expected_revision: null })});`);
  assert.equal(spawnSync(process.execPath, [script]).status, 73);
  assert.equal(existsSync(database + '-journal'), true);
  assert.equal(readFileSync(database + '-journal').subarray(0, 8).some(byte => byte !== 0), spill);
  assert.throws(() => readLocalContext(request, directory, request.owner_id), code('CONFLICT'));
  recoverLocalConstruction(request, directory, request.owner_id);
  assert.equal(readLocalContext(request, directory, request.owner_id).sources.matches.length, 0);
  const backend = new SqliteKnowledgeBackend(database, undefined, { readOnly: true });
  try {
    const store = backend.forScope({ instance_id: request.instance_id, actor_id: request.owner_id });
    assert.equal(store.query().records.length, 1); assert.equal(store.history(request.project.id).length, 1);
  } finally { backend.close(); }
  assert.equal(inspectLocalInstallation(request, directory).project!.data.source_refs.length, 0);
}));
