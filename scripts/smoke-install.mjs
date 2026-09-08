import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), 'manu-control-center-clean-'));
const source = join(temporary, 'source');
const consumer = join(temporary, 'consumer');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const common = ['--ignore-scripts', '--no-audit', '--no-fund'];
const run = (command, args, cwd) => execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

try {
  mkdirSync(source);
  mkdirSync(consumer);
  for (const name of ['package.json', 'package-lock.json', 'tsconfig.json', '.npmrc', 'README.md', 'LICENSE', 'core', 'cli', 'adapters', 'schemas', 'examples', 'tests', 'docs', 'references']) {
    cpSync(join(root, name), join(source, name), { recursive: true });
  }
  process.stdout.write(run(npm, ['ci', '--offline', ...common], source));
  process.stdout.write(run(npm, ['test'], source));
  const packed = JSON.parse(run(npm, ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary], source));
  // npm ci caches tarballs, but not necessarily registry metadata for an unlocked consumer.
  process.stdout.write(run(npm, ['install', join(temporary, packed[0].filename), '--prefer-offline', '--cache', join(temporary, 'package-cache'), ...common], consumer));
  const installed = join(consumer, 'node_modules', 'manu-control-center');
  const cli = join(installed, 'dist', 'cli', 'main.js');
  const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
  assert.equal(run(process.execPath, [cli, '--version'], consumer).trim(), version);
  assert.equal(JSON.parse(run(process.execPath, [cli, 'doctor'], consumer)).ok, true);
  assert.equal(JSON.parse(run(process.execPath, [cli, 'validate-record', join(installed, 'examples', 'record-envelope.json')], consumer)).ok, true);
  if (process.platform !== 'win32') {
    assert.equal(run(join(consumer, 'node_modules', '.bin', 'manu-control-center'), ['--version'], consumer).trim(), version);
  }
  process.stdout.write(JSON.stringify({ ok: true, clean_source_install: true, source_tests: true, packed_cli_install: true, version }) + '\n');
} catch (error) {
  process.stderr.write(error.stdout?.toString() ?? '');
  process.stderr.write(error.stderr?.toString() ?? '');
  process.stderr.write(`${error}\n`);
  process.exitCode = 1;
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
