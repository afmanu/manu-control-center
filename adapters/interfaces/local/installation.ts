import { existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, openSync, readSync, closeSync } from 'node:fs';
import { dirname, isAbsolute, join, normalize, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SqliteInstallation } from '../../backends/sqlite/installation.js';
import { SqliteBackend } from '../../backends/sqlite/store.js';
import { probeSqlite } from '../../backends/sqlite/probe.js';
import { DomainError } from '../../../core/errors.js';
import { hashJson } from '../../../core/hashing.js';
import { assertInstallAuthority, assertInstallPlan, assertRequest, createPlan, initialProject, resolveSpecification } from '../../../builder/planner.js';
import type { ApplyHooks, CapabilityCheck, Inspection, InstallAuthority, InstallPlan, InstallRequest } from '../../../builder/model.js';

function readHeader(path: string): Buffer {
  const file = openSync(path, 'r'), header = Buffer.alloc(100);
  try { readSync(file, header, 0, header.length, 0); return header; } finally { closeSync(file); }
}
const packageRoot = fileURLToPath(new URL('../../../../', import.meta.url));
export function installationDirectory(value: string): string {
  if (typeof value !== 'string' || !isAbsolute(value)) throw new DomainError('INVALID_INPUT', 'Installation directory must be absolute.');
  let ancestor = normalize(value);
  const suffix: string[] = [];
  while (!existsSync(ancestor)) { suffix.unshift(ancestor.slice(dirname(ancestor).length + (dirname(ancestor).endsWith(sep) ? 0 : 1))); ancestor = dirname(ancestor); }
  const path = join(realpathSync(ancestor), ...suffix), rel = relative(realpathSync(packageRoot), path);
  if (!rel || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel))) throw new DomainError('FORBIDDEN', 'Instance data must live outside the product distribution.');
  if (existsSync(path) && !lstatSync(path).isDirectory()) throw new DomainError('INVALID_INPUT', 'Installation destination is not a directory.');
  const database = join(path, 'store.sqlite');
  if (existsSync(database) && (!lstatSync(database).isFile() || lstatSync(database).isSymbolicLink())) throw new DomainError('FORBIDDEN', 'Store must be a regular local file.');
  if (existsSync(database)) {
    const header = readHeader(database);
    // SQLite file-format offsets 18/19 are the write/read journal format versions.
    if (header[18] === 2 || header[19] === 2) throw new DomainError('CAPABILITY_UNAVAILABLE', 'M2 requires rollback journal mode, not WAL. Change mode explicitly while the store is idle.');
  }
  if (['-wal', '-shm'].some(suffix => existsSync(database + suffix))) throw new DomainError('CAPABILITY_UNAVAILABLE', 'M2 requires a quiescent store in the default rollback journal mode; checkpoint and close WAL writers before inspection.');
  if (existsSync(path) && !existsSync(database) && readdirSync(path).length) throw new DomainError('CONFLICT', 'Use a dedicated empty directory or an existing MCC store; arbitrary folders require an import adapter.');
  return path;
}
/** Executes the actual selected backend on disposable stores; does not touch the planned destination. */
export function inspectLocalCapabilities(): CapabilityCheck[] {
  const probe = probeSqlite();
  const backend = new SqliteBackend(':memory:');
  try {
    const request: InstallRequest = { kind: 'install_request', schema_version: '0.1.0-draft', instance_id: 'capability-probe', owner_id: 'probe-owner', purpose: 'Synthetic probe', project: { id: 'probe-project', purpose: 'Synthetic probe' }, runtime: 'unconfigured', adoption: null };
    const scope = backend.forScope({ instance_id: request.instance_id, actor_id: request.owner_id });
    const original = scope.create(initialProject(request));
    scope.update(original, original.revision);
    const history = scope.history(original.id).length === 2;
    const isolation = backend.forScope({ instance_id: 'other-instance', actor_id: request.owner_id }).query().records.length === 0
      && backend.forScope({ instance_id: request.instance_id, actor_id: 'other-actor' }).query().records.length === 0;
    const checks = { conditional_writes: probe.conditional_write && probe.stale_write_rejected, atomic_writes: probe.transaction_rollback,
      history: history && probe.persistence, scoped_queries: isolation };
    const receipt = hashJson({ node: process.versions.node, sqlite: probe.sqlite_version, checks });
    return Object.entries(checks).map(([capability, passed]) => ({ capability, required: true, status: passed ? 'passed' : 'failed', evidence_refs: [`local-backend-probe:${receipt}:${capability}`] }));
  } finally { backend.close(); }
}
export function inspectLocalInstallation(input: unknown, directory: string): Inspection {
  const request = assertRequest(input), destination = installationDirectory(directory), path = join(destination, 'store.sqlite');
  if (!existsSync(path)) return { instance_id: request.instance_id, owner_id: request.owner_id, destination, store_exists: false, installation_revision: null, resources: [], project: null };
  if (existsSync(path + '-journal')) throw new DomainError('CONFLICT', 'SQLite journal pending; use authorized apply/resume for recovery, without deleting the journal.');
  const backend = new SqliteInstallation(path, true);
  try { return backend.inspect(request, destination); } finally { backend.close(); }
}
export function resolveLocalInstallation(input: unknown, directory: string) {
  const destination = installationDirectory(directory), checks = inspectLocalCapabilities();
  return { spec: resolveSpecification(input, destination, checks), checks };
}
export function planLocalInstallation(input: unknown, directory: string): InstallPlan {
  const request = assertRequest(input);
  const { spec } = resolveLocalInstallation(request, directory);
  return createPlan(request, spec, inspectLocalInstallation(request, directory));
}
export function applyLocalInstallation(input: unknown, authority: InstallAuthority, hooks: ApplyHooks = {}) {
  const plan = assertInstallPlan(input);
  assertInstallAuthority(plan, authority);
  const destination = installationDirectory(plan.observation.destination);
  // Re-demonstrate the selected backend before any write; declarations in a plan do not suffice.
  resolveSpecification(plan.request, destination, inspectLocalCapabilities());
  const recovering = existsSync(join(destination, 'store.sqlite-journal'));
  if (recovering) recoverLocalConstruction(plan.request, destination, authority.actor_id);
  const current = inspectLocalInstallation(plan.request, destination);
  if (current.installation_revision === null && hashJson(current) !== hashJson(plan.observation)) throw new DomainError('STALE_PLAN', 'Destination changed after planning.');
  mkdirSync(destination, { recursive: true, mode: 0o700 });
  const backend = new SqliteInstallation(join(destination, 'store.sqlite'));
  try {
    let state = backend.start(plan, authority);
    for (const operation of plan.plan.operations) {
      state = backend.step(plan, authority, operation.id, hooks);
      hooks.afterCheckpoint?.(operation.id);
    }
    return state.manifest;
  } finally { backend.close(); }
}
export function verifyLocalInstallation(input: unknown, directory: string) {
  const request = assertRequest(input), destination = installationDirectory(directory);
  if (!readLocalManifest(request, destination)) throw new DomainError('NOT_FOUND', 'No installed construction manifest.');
  const checks = inspectLocalCapabilities(), backend = new SqliteInstallation(join(destination, 'store.sqlite'));
  try { return backend.verify(request, checks); } finally { backend.close(); }
}
export function readLocalManifest(input: unknown, directory: string) {
  const request = assertRequest(input), destination = installationDirectory(directory);
  if (!existsSync(join(destination, 'store.sqlite'))) return null;
  const backend = new SqliteInstallation(join(destination, 'store.sqlite'), true);
  try { return backend.state(request.owner_id, request.instance_id)?.manifest ?? null; } finally { backend.close(); }
}

export function readLocalPlan(input: unknown, directory: string) {
  const request = assertRequest(input), destination = installationDirectory(directory);
  if (!existsSync(join(destination, 'store.sqlite'))) return null;
  const backend = new SqliteInstallation(join(destination, 'store.sqlite'), true);
  try {
    const plan = backend.state(request.owner_id, request.instance_id)?.installation ?? null;
    if (plan && hashJson(plan.request) !== hashJson(request)) throw new DomainError('CONFLICT', 'Resume requires the original request; inspect the recorded installation.');
    return plan;
  } finally { backend.close(); }
}

export function readLocalVerification(input: unknown, directory: string) {
  const request = assertRequest(input), destination = installationDirectory(directory);
  if (!existsSync(join(destination, 'store.sqlite'))) return [];
  const backend = new SqliteInstallation(join(destination, 'store.sqlite'), true);
  try { return backend.verificationEvidence(request.owner_id, request.instance_id); } finally { backend.close(); }
}

/** Explicit host recovery: SQLite rolls back an interrupted transaction before scoped state is read. */
export function recoverLocalConstruction(input: unknown, directory: string, actor: string): void {
  const request = assertRequest(input);
  if (actor !== request.owner_id) throw new DomainError('FORBIDDEN', 'Recovery actor differs from request owner.');
  const destination = installationDirectory(directory), path = join(destination, 'store.sqlite');
  if (!existsSync(path + '-journal')) return;
  if (readHeader(path).readUInt32BE(68) !== 1296253773) throw new DomainError('INCOMPATIBLE_VERSION', 'Recovery requires an initialized MCC store. Preserve incomplete initialization for explicit repair.');
  const backend = new SqliteInstallation(path);
  try {
    backend.finishRecovery(request);
  } finally { backend.close(); }
}
