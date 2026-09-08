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
  for (const name of ['package.json', 'package-lock.json', 'tsconfig.json', '.npmrc', 'README.md', 'LICENSE', 'core', 'cli', 'adapters', 'evals', 'builder', 'schemas', 'examples', 'tests', 'docs', 'references']) {
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
  assert.match(run(process.execPath, [cli, '--lang', 'en', '--help'], consumer), /Usage:/);
  assert.match(run(process.execPath, [cli, '--lang', 'es', '--help'], consumer), /Uso:/);
  assert.equal(JSON.parse(run(process.execPath, [cli, 'doctor'], consumer)).ok, true);
  assert.equal(JSON.parse(run(process.execPath, [cli, 'validate-record', join(installed, 'examples', 'record-envelope.json')], consumer)).ok, true);
  assert.equal(JSON.parse(run(process.execPath, [cli, 'validate-bundle', join(installed, 'examples', 'contracts', 'construction-bundle.json')], consumer)).ok, true);
  assert.equal(JSON.parse(run(process.execPath, [cli, 'validate', 'eval_fixture', join(installed, 'examples', 'meeting.json')], consumer)).ok, true);
  run(process.execPath, ['--input-type=module', '-e', "import {assertContract} from 'manu-control-center'; import {SqliteBackend} from 'manu-control-center/sqlite'; import {prepareEvalInput} from 'manu-control-center/evals'; if(typeof assertContract!=='function'||typeof prepareEvalInput!=='function')throw new Error('Missing public exports'); const store=new SqliteBackend(':memory:'); store.close();"], consumer);
  const instance = join(temporary, 'installed-instance');
  const request = join(installed, 'examples', 'install-request.json');
  const created = JSON.parse(run(process.execPath, [cli, 'create', request, instance, '--actor', 'local-user'], consumer));
  assert.equal(created.ok, true);
  assert.equal(created.manifest.state, 'verified');
  assert.equal(created.runtime_integration, 'not_verified');
  assert.equal(JSON.parse(run(process.execPath, [cli, 'inspect', request, instance], consumer)).verification_evidence.length, 1);
  run(process.execPath, ['--input-type=module', '-e', "import {assertRequest} from 'manu-control-center/builder'; import {inspectLocalInstallation} from 'manu-control-center/local'; if(typeof assertRequest!=='function'||typeof inspectLocalInstallation!=='function') throw new Error('Missing builder exports');"], consumer);
  run(process.execPath, ['--input-type=module', '-e', "import {SqliteKnowledgeBackend} from 'manu-control-center/sqlite-knowledge'; import {captureLocalSource,readLocalContext} from 'manu-control-center/knowledge'; if(typeof captureLocalSource!=='function'||typeof readLocalContext!=='function') throw new Error('Missing knowledge exports'); const backend=new SqliteKnowledgeBackend(':memory:'); backend.close();"], consumer);
  const captured = JSON.parse(run(process.execPath, [cli, 'capture', request, instance, 'synthetic-notes', '--actor', 'local-user', '--key', 'notes-1', '--file', join(installed, 'examples', 'local-source.txt')], consumer));
  assert.equal(captured.replayed, false);
  const initialSource = JSON.parse(run(process.execPath, [cli, 'source', request, instance, 'synthetic-notes', '--actor', 'local-user', '--revision', captured.source_ref.revision], consumer));
  assert.equal(initialSource.data.segments[0].text, readFileSync(join(installed, 'examples', 'local-source.txt'), 'utf8'));
  assert.equal(initialSource.data.authority, 'unverified');
  const change = [cli, 'capture', request, instance, 'synthetic-notes', '--actor', 'local-user', '--key', 'notes-2', '--expected-revision', captured.source_ref.revision, '--text', 'Synthetic updated notes'];
  const updated = JSON.parse(run(process.execPath, change, consumer));
  assert.equal(JSON.parse(run(process.execPath, change, consumer)).replayed, true);
  assert.deepEqual(JSON.parse(run(process.execPath, [cli, 'search', request, instance, 'updated', '--actor', 'local-user'], consumer)).matches[0].source_ref, updated.source_ref);
  assert.equal(JSON.parse(run(process.execPath, [cli, 'source-history', request, instance, 'synthetic-notes', '--actor', 'local-user'], consumer)).versions.length, 2);
  assert.equal(JSON.parse(run(process.execPath, [cli, '--lang', 'es', 'context', request, instance, '--actor', 'local-user'], consumer)).sources.matches.length, 1);
  assert.deepEqual(JSON.parse(run(process.execPath, [cli, 'source', request, instance, 'synthetic-notes', '--actor', 'local-user', '--revision', captured.source_ref.revision], consumer)), initialSource);
  assert.equal(JSON.parse(run(process.execPath, [cli, 'verify', request, instance], consumer)).ok, true);
  run(process.execPath, ['--input-type=module', '-e', "import {SqliteReviewBackend} from 'manu-control-center/sqlite-review'; import {queryLocalKnowledge,grantLocalDecision} from 'manu-control-center/review'; if(typeof queryLocalKnowledge!=='function'||typeof grantLocalDecision!=='function') throw new Error('Missing review exports'); const backend=new SqliteReviewBackend(':memory:');backend.close();"], consumer);
  const reviewDemo = JSON.parse(run(process.execPath, [join(installed, 'examples', 'review-demo.mjs')], consumer));
  assert.equal(reviewDemo.ok, true); assert.equal(reviewDemo.approved_artifact_exact, true); assert.equal(reviewDemo.temporal_retrieval, true);
  run(process.execPath, ['--input-type=module', '-e', "import {SqliteWorkflowBackend} from 'manu-control-center/sqlite-workflows'; import {prepareLocalWorkflow,completeLocalWorkflow} from 'manu-control-center/workflows'; if(typeof prepareLocalWorkflow!=='function'||typeof completeLocalWorkflow!=='function') throw new Error('Missing workflow exports'); const backend=new SqliteWorkflowBackend(':memory:');backend.close();"], consumer);
  const workflowDemo = JSON.parse(run(process.execPath, [join(installed, 'examples', 'workflow-demo.mjs')], consumer));
  assert.equal(workflowDemo.ok, true); assert.equal(workflowDemo.meeting_to_brief, true); assert.equal(workflowDemo.project_status, true); assert.equal(workflowDemo.model_invoked, false);
  run(process.execPath, ['--input-type=module', '-e', "import {SqliteCoordinatorBackend} from 'manu-control-center/sqlite-coordinator'; import {operateLocalCoordinator} from 'manu-control-center/coordinator'; import {SimulatedMailbox} from 'manu-control-center/simulated-mailbox'; if(typeof operateLocalCoordinator!=='function') throw new Error('Missing coordinator exports'); const backend=new SqliteCoordinatorBackend(':memory:'); backend.close(); const target=new SimulatedMailbox(':memory:');target.close();"], consumer);
  const coordinatorDemo = JSON.parse(run(process.execPath, [join(installed, 'examples', 'coordinator-demo.mjs')], consumer));
  assert.equal(coordinatorDemo.ok, true); assert.equal(coordinatorDemo.durable_steps, true); assert.equal(coordinatorDemo.simulated_deliveries, 1); assert.equal(coordinatorDemo.real_external_deliveries, 0);
  if (process.platform !== 'win32') {
    assert.equal(run(join(consumer, 'node_modules', '.bin', 'manu-control-center'), ['--version'], consumer).trim(), version);
  }
  process.stdout.write(JSON.stringify({ ok: true, clean_source_install: true, source_tests: true, packed_cli_install: true, packed_instance_create_verify: true, packed_knowledge_capture_query: true, packed_authority_time_review: true, packed_local_human_workflows: true, packed_coordinator_and_simulated_effects: true, version }) + '\n');
} catch (error) {
  process.stderr.write(error.stdout?.toString() ?? '');
  process.stderr.write(error.stderr?.toString() ?? '');
  process.stderr.write(`${error}\n`);
  process.exitCode = 1;
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
