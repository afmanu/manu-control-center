import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { probeSqlite } from '../adapters/backends/sqlite/probe.js';
import { resolveDataDirectory } from '../adapters/interfaces/local/data-directory.js';

test('SQLite persists across reopen, rejects stale writer and rolls back transactions', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mcc-storage-test-'));
  try {
    const result = probeSqlite(directory);
    assert.equal(result.persistence, true);
    assert.equal(result.conditional_write, true);
    assert.equal(result.stale_write_rejected, true);
    assert.equal(result.transaction_rollback, true);
    assert.match(result.sqlite_version, /^\d+\.\d+\.\d+$/);
    assert.deepEqual(readdirSync(directory), []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('resolves private local paths independently of the repository and rejects relative overrides', () => {
  assert.equal(resolveDataDirectory({}, 'darwin', '/synthetic/home'), '/synthetic/home/Library/Application Support/manu-control-center');
  assert.equal(resolveDataDirectory({ MANU_CONTROL_CENTER_DATA_DIR: '/synthetic/data' }), '/synthetic/data');
  assert.equal(resolveDataDirectory({ XDG_DATA_HOME: 'relative' }, 'linux', '/synthetic/home'), '/synthetic/home/.local/share/manu-control-center');
  assert.throws(() => resolveDataDirectory({ MANU_CONTROL_CENTER_DATA_DIR: './private' }), /absolute path/);
  assert.throws(() => resolveDataDirectory({ MANU_CONTROL_CENTER_DATA_DIR: '' }), /absolute path/);
});
