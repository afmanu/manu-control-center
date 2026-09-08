import { randomUUID } from 'node:crypto';
import { SqliteBackend } from './store.js';
import { hashJson, cloneJson } from '../../../core/hashing.js';
import { DomainError } from '../../../core/errors.js';
import { assertContract } from '../../../core/validation.js';
import type { Manifest, StoredRecord } from '../../../core/models.js';
import { assertInstallAuthority, initialProject } from '../../../builder/planner.js';
import type { ApplyHooks, CapabilityCheck, Inspection, InstallationState, InstallAuthority, InstallPlan, InstallRequest, ResourceObservation, ResourceReceipt } from '../../../builder/model.js';

/** Construction state and knowledge share a transaction, while retaining separate tables/authorities. */
export class SqliteInstallation extends SqliteBackend {
  constructor(path: string, readOnly = false) {
    super(path, () => new Date().toISOString(), { readOnly });
    if (!readOnly) this.db.exec(`CREATE TABLE IF NOT EXISTS builder_state (id INTEGER PRIMARY KEY CHECK(id=1), document TEXT NOT NULL) STRICT;
      CREATE TABLE IF NOT EXISTS builder_resources (id TEXT PRIMARY KEY, revision TEXT NOT NULL, document TEXT NOT NULL) STRICT;
      CREATE TABLE IF NOT EXISTS builder_evidence (id TEXT PRIMARY KEY, document TEXT NOT NULL) STRICT;`);
  }
  private hasTable(name: string): boolean { return !!this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name); }
  finishRecovery(request: InstallRequest): void {
    this.transaction(() => {
      const state = this.state(request.owner_id, request.instance_id);
      if (!state || hashJson(state.installation.request) !== hashJson(request)) throw new DomainError('FORBIDDEN', 'Recovery request differs from the recorded installation.');
      // Finish even a cold leftover journal through SQLite's own write/commit path.
      // This explicit recovery preserves logical records, revisions and builder evidence.
      this.db.exec('PRAGMA application_id=1296253773');
    });
  }
  state(owner: string, instance: string): InstallationState | null {
    if (!this.hasTable('builder_state')) return null;
    const row = this.db.prepare('SELECT document FROM builder_state WHERE id=1').get();
    if (!row) return null;
    const state = JSON.parse(String(row['document'])) as InstallationState;
    if (state.format_version !== 1) throw new DomainError('INCOMPATIBLE_VERSION', 'Unsupported construction state.');
    if (state.owner_id !== owner || state.installation.request.instance_id !== instance) throw new DomainError('FORBIDDEN', 'Installation is outside this actor/instance scope.');
    return state;
  }
  private project(request: InstallRequest): StoredRecord<'project'> | null {
    // Test existence without returning another actor's content; a hidden collision must not look writable.
    const exists = this.db.prepare('SELECT id FROM records WHERE instance_id=? AND id=?').get(request.instance_id, request.project.id);
    if (!exists) return null;
    const record = this.forScope({ instance_id: request.instance_id, actor_id: request.owner_id }).get(request.project.id);
    if (record.kind !== 'project') throw new DomainError('CONFLICT', 'Mapped identity is not a project.');
    return record;
  }
  private resource(id: string): ResourceObservation | null {
    if (!this.hasTable('builder_resources')) return null;
    const row = this.db.prepare('SELECT revision,document FROM builder_resources WHERE id=?').get(id);
    return row ? { id, revision: String(row['revision']), hash: hashJson(JSON.parse(String(row['document']))) } : null;
  }
  inspect(request: InstallRequest, destination: string): Inspection {
    const state = this.state(request.owner_id, request.instance_id);
    const project = this.project(request);
    const resources = ['configuration', 'catalog'].flatMap(id => { const resource = this.resource(id); return resource ? [resource] : []; });
    if (project) resources.push({ id: project.id, revision: project.revision, hash: hashJson(project) });
    return { instance_id: request.instance_id, owner_id: request.owner_id, destination, store_exists: true,
      installation_revision: state?.revision ?? null, resources, project };
  }
  private save(state: InstallationState): InstallationState {
    state.revision = randomUUID();
    state.manifest.revision = state.revision;
    assertContract('manifest', state.manifest);
    this.db.prepare('INSERT INTO builder_state VALUES (1,?) ON CONFLICT(id) DO UPDATE SET document=excluded.document').run(JSON.stringify(state));
    return cloneJson(state);
  }
  start(plan: InstallPlan, authority: InstallAuthority): InstallationState {
    return this.transaction(() => {
      assertInstallAuthority(plan, authority);
      const { request } = plan;
      const state = this.state(request.owner_id, request.instance_id);
      if (state?.installation.digest === plan.digest) return state;
      if (state && state.manifest.state === 'partial') throw new DomainError('CONFLICT', 'Resume the recorded partial plan before planning another installation.');
      if (state && state.manifest.resources.some(resource => plan.plan.operations.find(operation => operation.resource_id === resource.id)?.ownership !== resource.ownership)) throw new DomainError('CONFLICT', 'Replanning cannot change resource ownership.');
      const current = this.inspect(request, plan.observation.destination);
      // Creating an empty SQLite store is the only change allowed between absent observation and start.
      const observed = { ...current, store_exists: plan.observation.store_exists };
      if (hashJson(observed) !== hashJson(plan.observation)) throw new DomainError('STALE_PLAN', 'Destination changed after planning; inspect and generate a new plan.');
      for (const id of ['configuration', 'catalog']) {
        const actual = this.resource(id), expected = id === 'configuration' ? plan.spec : plan.catalog;
        if (actual && actual.hash !== hashJson(expected)) throw new DomainError('CONFLICT', 'Existing managed configuration differs; update/migration is outside M2.');
      }
      const manifest: Manifest = { kind: 'manifest', schema_version: '0.1.0-draft', id: `manifest:${request.instance_id}`,
        instance_id: request.instance_id, revision: 'pending', spec_hash: hashJson(plan.spec), applied_spec: { id: plan.spec.id, revision: plan.spec.revision },
        state: 'partial', resources: [], overrides: plan.spec.overrides,
        verification: [{ capability: 'installation', required: true, status: 'not_run', evidence_refs: [] }, { capability: 'runtime.invoke', required: false, status: 'not_run', evidence_refs: [] }] };
      return this.save({ format_version: 1, owner_id: request.owner_id, revision: 'pending', installation: plan, authorizations: [...(state?.authorizations ?? []), cloneJson(authority)], completed: [], receipts: [], manifest });
    });
  }
  step(plan: InstallPlan, authority: InstallAuthority, operationId: string, hooks: ApplyHooks): InstallationState {
    return this.transaction(() => {
      assertInstallAuthority(plan, authority);
      const state = this.state(plan.request.owner_id, plan.request.instance_id);
      if (!state || state.installation.digest !== plan.digest) throw new DomainError('CONFLICT', 'Another installation owns the checkpoint.');
      const operation = plan.plan.operations.find(item => item.id === operationId);
      if (!operation) throw new DomainError('INVALID_INPUT', 'Unknown installation operation.');
      if (operation.depends_on.some(id => !state.completed.includes(id))) throw new DomainError('CONFLICT', 'Missing installation checkpoint.');
      // Revalidate every completed resource too; a resumed plan cannot silently accept intervening edits.
      const inspection = this.inspect(plan.request, plan.observation.destination);
      for (const receipt of state.receipts) {
        const current = inspection.resources.find(resource => resource.id === receipt.id);
        if (!current || current.revision !== receipt.revision || current.hash !== receipt.hash) throw new DomainError('STALE_PLAN', 'A checkpoint resource changed after installation.');
      }
      if (state.completed.includes(operationId)) return state;
      const before = inspection.resources.find(resource => resource.id === operation.resource_id);
      if ((before?.revision ?? null) !== operation.expected_revision) throw new DomainError('STALE_PLAN', 'Resource precondition changed.');
      if (operation.operation === 'create' && before) throw new DomainError('STALE_PLAN', 'Creation requires absence.');
      let receipt: ResourceReceipt;
      if (operation.resource_id === plan.request.project.id) {
        const project = operation.operation === 'create'
          ? this.forScope({ instance_id: plan.request.instance_id, actor_id: plan.request.owner_id }).create(initialProject(plan.request))
          : inspection.project!;
        receipt = { id: project.id, revision: project.revision, hash: hashJson(project), ownership: operation.ownership, physical_ref: `records:${plan.request.instance_id}:${project.id}` };
      } else {
        const value = operation.resource_id === 'configuration' ? plan.spec : plan.catalog;
        if (operation.operation === 'create') this.db.prepare('INSERT INTO builder_resources VALUES (?,?,?)').run(operation.resource_id, randomUUID(), JSON.stringify(value));
        const saved = this.resource(operation.resource_id)!;
        if (saved.hash !== hashJson(value)) throw new DomainError('CONFLICT', 'Managed resource content differs.');
        receipt = { ...saved, ownership: operation.ownership, physical_ref: `builder_resources:${operation.resource_id}` };
      }
      hooks.beforeCheckpoint?.(operationId);
      if (!state.authorizations.some(saved => hashJson(saved) === hashJson(authority))) state.authorizations.push(cloneJson(authority));
      state.completed.push(operationId);
      state.receipts.push(receipt);
      state.manifest.resources.push({ id: receipt.id, adapter_id: 'sqlite-local', physical_ref: receipt.physical_ref,
        ownership: receipt.ownership, revision: receipt.revision, baseline_hash: receipt.hash });
      if (state.completed.length === plan.plan.operations.length) state.manifest.state = 'installed_unverified';
      return this.save(state);
    });
  }
  verificationEvidence(owner: string, instance: string): unknown[] {
    const state = this.state(owner, instance);
    if (!state || !this.hasTable('builder_evidence')) return [];
    const ids = new Set(state.manifest.verification.flatMap(check => check.evidence_refs).filter(ref => ref.startsWith('builder_evidence:')).map(ref => ref.split(':')[1]!));
    return [...ids].map(id => {
      const row = this.db.prepare('SELECT document FROM builder_evidence WHERE id=?').get(id);
      if (!row) throw new DomainError('VALIDATION_FAILED', 'Verification evidence is unavailable.');
      const document: unknown = JSON.parse(String(row['document']));
      if (hashJson(document) !== id) throw new DomainError('VALIDATION_FAILED', 'Verification evidence hash mismatch.');
      return { id, document };
    });
  }
  verify(request: InstallRequest, checks: CapabilityCheck[]): Manifest {
    return this.transaction(() => {
      const state = this.state(request.owner_id, request.instance_id);
      if (!state) throw new DomainError('NOT_FOUND', 'No installation to verify.');
      if (state.installation.request.project.id !== request.project.id) throw new DomainError('FORBIDDEN', 'Project mapping differs from installation.');
      const observed = this.inspect(request, state.installation.observation.destination);
      const evidence = (id: string) => `sqlite:${state.installation.digest}:${id}`;
      const complete = state.completed.length === state.installation.plan.operations.length;
      const configuration = this.resource('configuration')?.hash === hashJson(state.installation.spec);
      const catalog = this.resource('catalog')?.hash === hashJson(state.installation.catalog);
      const project = observed.project !== null && assertContract('project', observed.project).instance_id === request.instance_id;
      const integrity = this.db.prepare('PRAGMA quick_check').get()?.['quick_check'] === 'ok';
      const actual: CapabilityCheck[] = [
        { capability: 'installation', required: true, status: complete && configuration && catalog && project && integrity ? 'passed' : 'failed', evidence_refs: [evidence('resource-and-integrity-check')] },
        ...checks,
        { capability: 'runtime.invoke', required: false, status: 'not_run', evidence_refs: [] },
      ];
      const report = { checked_at: new Date().toISOString(), node: process.versions.node,
        sqlite: this.db.prepare('SELECT sqlite_version() AS version').get()?.['version'],
        plan_digest: state.installation.digest, complete, configuration, catalog, project,
        sqlite_quick_check: integrity, resource_revisions: observed.resources, checks: actual };
      const reportId = hashJson(report);
      this.db.prepare('INSERT OR IGNORE INTO builder_evidence VALUES (?,?)').run(reportId, JSON.stringify(report));
      state.manifest.verification = actual.map(check => ({ ...check, evidence_refs: check.status === 'not_run' ? [] : [`builder_evidence:${reportId}:${check.capability}`] }));
      state.manifest.state = !complete ? 'partial' : actual.some(check => check.required && check.status !== 'passed') ? 'installed_unverified' : 'verified';
      return this.save(state).manifest;
    });
  }
}
