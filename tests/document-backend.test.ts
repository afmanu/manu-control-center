import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DocumentBackend } from '../adapters/backends/documents/store.js';
import { DomainError } from '../core/errors.js';
import { newRecord, now } from './fixtures.js';
import type { StoredRecord } from '../core/models.js';

const identity = { instance_id: 'instance-demo', actor_id: 'alice' };
const code = (expected: string) => (error: unknown) => error instanceof DomainError && error.code === expected;
function temporary(work: (root: string, path: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'mcc-documents-'));
  try { work(root, join(root, 'store')); } finally { rmSync(root, { recursive: true, force: true }); }
}
test('document representation contains inspectable immutable JSON revisions and no SQLite state', () => temporary((_root, path) => {
  const store = new DocumentBackend(path, () => now), scope = store.forScope(identity);
  const input = newRecord('project'); input.id = '../opaque/identity';
  const first = scope.create(input) as StoredRecord<'project'>;
  const second = scope.update({ ...first, data: { ...first.data, purpose: 'Second revision' } }, first.revision);
  assert.deepEqual(readdirSync(path).sort(), ['HEAD.json', 'documents']);
  const head = JSON.parse(readFileSync(join(path, 'HEAD.json'), 'utf8'));
  assert.equal(head.entries.length, 1); assert.equal(head.entries[0].versions.length, 2);
  const docs = head.entries[0].versions.map((hash: string) => JSON.parse(readFileSync(join(path, 'documents', hash + '.json'), 'utf8')));
  assert.deepEqual(docs, [first, second]);
  const headBytes = readFileSync(join(path, 'HEAD.json'));
  const reader = new DocumentBackend(path, () => now, { readOnly: true });
  assert.deepEqual(reader.forScope(identity).history(first.id), [first, second]);
  assert.throws(() => reader.forScope(identity).update(second, second.revision), code('FORBIDDEN'));
  assert.deepEqual(readFileSync(join(path, 'HEAD.json')), headBytes);
  store.close(); reader.close(); assert.throws(() => scope.query(), code('CONFLICT'));
}));
test('unknown directories, malformed heads and symlinked storage are rejected without replacement', () => temporary((root, path) => {
  mkdirSync(path); writeFileSync(join(path, 'personal.txt'), 'Keep');
  assert.throws(() => new DocumentBackend(path), code('INCOMPATIBLE_VERSION'));
  assert.deepEqual(readdirSync(path), ['personal.txt']);
  const valid = join(root, 'valid'); new DocumentBackend(valid).close();
  const alias = join(root, 'alias'); symlinkSync(valid, alias);
  assert.throws(() => new DocumentBackend(alias), code('INCOMPATIBLE_VERSION'));
  writeFileSync(join(valid, 'HEAD.json'), JSON.stringify({ format: 'mcc-documents-v2', entries: [] }));
  assert.throws(() => new DocumentBackend(valid), code('INCOMPATIBLE_VERSION'));
  const absent = join(root, 'absent');
  assert.throws(() => new DocumentBackend(absent, () => now, { readOnly: true }), code('INCOMPATIBLE_VERSION'));
  assert.ok(!readdirSync(root).includes('absent'));
}));
test('changed, missing and symlinked revision documents never become valid records', () => temporary((root, path) => {
  const store = new DocumentBackend(path, () => now), scope = store.forScope(identity);
  const project = scope.create(newRecord('project'));
  const files = join(path, 'documents'), name = readdirSync(files)[0]!, file = join(files, name);
  const bytes = readFileSync(file); writeFileSync(file, bytes.toString() + ' ');
  assert.throws(() => scope.get(project.id), code('INCOMPATIBLE_VERSION'));
  rmSync(file); assert.throws(() => scope.get(project.id), code('INCOMPATIBLE_VERSION'));
  const external = join(root, 'external'); writeFileSync(external, bytes); symlinkSync(external, file);
  assert.throws(() => scope.get(project.id), code('INCOMPATIBLE_VERSION'));
  assert.deepEqual(readFileSync(external), bytes); store.close();
}));
test('document publication failure leaves current record, access and history together', () => temporary((_root, path) => {
  const store = new DocumentBackend(path, () => now), scope = store.forScope(identity);
  const project = scope.create(newRecord('project')) as StoredRecord<'project'>;
  const bytes = readFileSync(join(path, 'HEAD.json'));
  const next = { ...project, data: { ...project.data, purpose: 'x'.repeat(16 * 1024 * 1024) } };
  assert.throws(() => scope.update(next, project.revision), code('CAPABILITY_UNAVAILABLE'));
  assert.deepEqual(readFileSync(join(path, 'HEAD.json')), bytes);
  assert.deepEqual(scope.history(project.id), [project]);
  assert.ok(!readdirSync(path).includes('.write-lock')); store.close();
}));
for (const crash of ['before', 'after'] as const) test(`real process exit ${crash} HEAD publication preserves one coherent snapshot and fences new writes`, () => temporary((_root, path) => {
  const store = new DocumentBackend(path, () => now), scope = store.forScope(identity);
  const input = newRecord('project'); input.access.readers = ['bob'];
  const project = scope.create(input);
  const script = `const fs=require('node:fs'); const original=fs.renameSync;
    fs.renameSync=(from,to)=>{if(to.endsWith('/HEAD.json')){if(process.env.MCC_CRASH==='before')process.exit(73);original(from,to);process.exit(74);}return original(from,to);};
    require('node:module').syncBuiltinESMExports();
    (async()=>{const {DocumentBackend}=await import(process.env.MCC_MODULE);const store=new DocumentBackend(process.env.MCC_PATH,()=>${JSON.stringify(now)});const scope=store.forScope(${JSON.stringify(identity)});const record=scope.get('project-demo');record.data.purpose='Committed after restart';record.access.readers=[];scope.update(record,record.revision);})();`;
  const child = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8', env: { ...process.env, MCC_CRASH: crash, MCC_PATH: path, MCC_MODULE: new URL('../adapters/backends/documents/store.js', import.meta.url).href } });
  assert.equal(child.status, crash === 'before' ? 73 : 74, child.stderr);
  const fresh = new DocumentBackend(path, () => now), alice = fresh.forScope(identity), bob = fresh.forScope({ ...identity, actor_id: 'bob' });
  if (crash === 'before') {
    assert.deepEqual(alice.get(project.id), project); assert.deepEqual(bob.get(project.id), project);
    assert.deepEqual(alice.history(project.id), [project]);
  } else {
    assert.equal((alice.get(project.id) as StoredRecord<'project'>).data.purpose, 'Committed after restart');
    assert.equal(alice.history(project.id).length, 2);
    assert.throws(() => bob.get(project.id, project.revision), code('NOT_FOUND'));
  }
  assert.throws(() => alice.update(project, project.revision), code('CONFLICT'));
  assert.ok(readdirSync(path).includes('.write-lock'));
  // No timeout or PID-based lock takeover; orphan documents never override HEAD.
  assert.equal(readdirSync(join(path, 'documents')).length, 2);
  fresh.close(); store.close();
}));
test('malformed document index cannot traverse paths or reuse an identity', () => temporary((_root, path) => {
  const store = new DocumentBackend(path, () => now), scope = store.forScope(identity);
  scope.create(newRecord('project'));
  const file = join(path, 'HEAD.json'), original = JSON.parse(readFileSync(file, 'utf8'));
  const malformed = structuredClone(original); malformed.entries[0].versions = ['../../outside'];
  writeFileSync(file, JSON.stringify(malformed)); assert.throws(() => scope.query(), code('INCOMPATIBLE_VERSION'));
  original.entries.push(original.entries[0]); writeFileSync(file, JSON.stringify(original));
  assert.throws(() => scope.query(), code('INCOMPATIBLE_VERSION')); store.close();
}));
