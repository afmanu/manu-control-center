import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface SqliteProbe {
  sqlite_version: string;
  persistence: boolean;
  conditional_write: boolean;
  stale_write_rejected: boolean;
  transaction_rollback: boolean;
}

/** A disposable M0 capability probe, not the instance backend or coordinator. */
export function probeSqlite(parentDirectory: string = tmpdir()): SqliteProbe {
  const directory = mkdtempSync(join(parentDirectory, 'manu-control-center-probe-'));
  const path = join(directory, 'probe.sqlite');
  let writer: DatabaseSync | undefined;
  let staleWriter: DatabaseSync | undefined;
  let reopened: DatabaseSync | undefined;
  try {
    writer = new DatabaseSync(path, { timeout: 1000 });
    writer.exec('CREATE TABLE records (id TEXT PRIMARY KEY, revision TEXT NOT NULL, body TEXT NOT NULL) STRICT');
    writer.prepare('INSERT INTO records VALUES (?, ?, ?)').run('record-probe', 'rev-a', 'initial');
    staleWriter = new DatabaseSync(path, { timeout: 1000 });
    const observed = staleWriter.prepare('SELECT revision FROM records WHERE id = ?').get('record-probe');
    const write = writer.prepare('UPDATE records SET revision = ?, body = ? WHERE id = ? AND revision = ?');
    const accepted = write.run('rev-b', 'accepted', 'record-probe', 'rev-a');
    const rejected = staleWriter.prepare('UPDATE records SET revision = ?, body = ? WHERE id = ? AND revision = ?')
      .run('rev-stale', 'stale', 'record-probe', String(observed?.['revision']));
    writer.exec('BEGIN IMMEDIATE');
    write.run('rev-rollback', 'rolled back', 'record-probe', 'rev-b');
    writer.exec('ROLLBACK');
    const rolledBack = writer.prepare('SELECT revision FROM records WHERE id = ?').get('record-probe');
    staleWriter.close();
    staleWriter = undefined;
    writer.close();
    writer = undefined;
    reopened = new DatabaseSync(path, { readOnly: true });
    const saved = reopened.prepare('SELECT revision, body FROM records WHERE id = ?').get('record-probe');
    const version = reopened.prepare('SELECT sqlite_version() AS version').get();
    return {
      sqlite_version: String(version?.['version']),
      persistence: saved?.['body'] === 'accepted' && saved?.['revision'] === 'rev-b',
      conditional_write: accepted.changes === 1,
      stale_write_rejected: rejected.changes === 0,
      transaction_rollback: rolledBack?.['revision'] === 'rev-b',
    };
  } finally {
    reopened?.close();
    staleWriter?.close();
    writer?.close();
    rmSync(directory, { recursive: true, force: true });
  }
}
