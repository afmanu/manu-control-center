import { Ajv } from 'ajv';
import { assertContract } from '../core/validation.js';
import { assertConstructionBundle } from '../core/construction.js';
import { cloneJson, hashJson } from '../core/hashing.js';
import { DomainError } from '../core/errors.js';
import type { InstanceSpec, Need, Plan } from '../core/models.js';
import { BACKEND_ID, BUILDER_VERSION, EFFECT, foundationCatalog } from './catalog.js';
import type { CapabilityCheck, InitialProject, Inspection, InstallAuthority, InstallPlan, InstallRequest } from './model.js';

const text = { type: 'string', minLength: 1, pattern: '\\S' };
const object = (properties: Record<string, unknown>) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
export const requestSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'urn:manu-control-center:install-request:0.1.0-draft',
  ...object({ kind: { const: 'install_request' }, schema_version: { const: BUILDER_VERSION }, instance_id: text, purpose: text, owner_id: text,
    project: object({ id: text, purpose: text }), runtime: { enum: ['unconfigured', 'codex', 'claude-code'] },
    adoption: { anyOf: [{ type: 'null' }, object({ revision: text, ownership: { enum: ['shared', 'user_owned'] } })] } }),
};
const validate = new Ajv({ strict: true, allErrors: true }).compile<InstallRequest>(requestSchema);
export function assertRequest(value: unknown): InstallRequest {
  const copy = cloneJson(value);
  if (!validate(copy)) throw new DomainError('INVALID_INPUT', 'Invalid installation request.', { issues: validate.errors });
  if (['configuration', 'catalog'].includes(copy.project.id)) throw new DomainError('INVALID_INPUT', 'Reserved project identity.');
  return copy;
}
export function initialProject(request: InstallRequest): InitialProject {
  return { kind: 'project', schema_version: BUILDER_VERSION, id: request.project.id, instance_id: request.instance_id,
    access: { owner_id: request.owner_id, readers: [], writers: [] },
    data: { purpose: request.project.purpose, status: 'active', responsible: request.owner_id, next_action: null, source_refs: [], decision_refs: [] } };
}
export function resolveSpecification(input: unknown, destination: string, checks: CapabilityCheck[]): InstanceSpec {
  const request = assertRequest(input), catalog = foundationCatalog();
  const required = new Set([...catalog.blueprint.required_capabilities, ...catalog.modules.flatMap(module => module.requires_capabilities)]);
  for (const capability of required) if (!checks.some(check => check.capability === capability && check.status === 'passed' && check.evidence_refs.length)) {
    throw new DomainError('CAPABILITY_UNAVAILABLE', `Required capability was not demonstrated: ${capability}`);
  }
  const base = {
    kind: 'instance_spec', schema_version: BUILDER_VERSION, id: `spec:${request.instance_id}`, instance_id: request.instance_id, purpose: request.purpose,
    blueprint: { id: catalog.blueprint.id, version: catalog.blueprint.version }, modules: catalog.modules.map(({ id, version }) => ({ id, version })),
    kernel: { id: 'manu-control-center', version: BUILDER_VERSION },
    targets: {
      backend: { adapter_id: BACKEND_ID, version: BUILDER_VERSION, capabilities: [...required].sort(), configuration: { directory: destination } },
      runtime: { adapter_id: request.runtime, version: BUILDER_VERSION, capabilities: [], configuration: { status: 'not_verified' } },
      interface: { adapter_id: 'local-cli', version: BUILDER_VERSION, capabilities: ['construct'], configuration: {} },
    },
    policy: { allowed_effects: [EFFECT], source_policy: 'snapshot' }, secret_refs: [],
    configuration: { owner_id: request.owner_id, project_id: request.project.id, profile: 'foundation' }, overrides: {},
  };
  return assertContract('instance_spec', { ...base, revision: hashJson(base) });
}
export function createPlan(input: unknown, spec: InstanceSpec, observation: Inspection): InstallPlan {
  const request = assertRequest(input), catalog = foundationCatalog();
  if (observation.instance_id !== request.instance_id || observation.owner_id !== request.owner_id || observation.destination !== spec.targets.backend.configuration['directory']) throw new DomainError('FORBIDDEN', 'Inspection scope differs from request.');
  const adopted = observation.project;
  if (request.adoption && (!adopted || adopted.revision !== request.adoption.revision)) throw new DomainError('STALE_PLAN', 'Adoption requires an explicit current project revision.');
  if (!request.adoption && adopted && observation.installation_revision === null) throw new DomainError('CONFLICT', 'Existing project needs an explicit adoption mapping.');
  const resources = ['configuration', 'catalog', request.project.id];
  const operations: Plan['operations'] = resources.map((id, index) => {
    const observed = observation.resources.find(resource => resource.id === id);
    return { id: `install:${id}`, operation: observed ? 'reuse' : 'create', resource_id: id, adapter_id: BACKEND_ID,
      depends_on: index === 0 ? [] : [`install:${resources[index - 1]!}`], ownership: id === request.project.id && request.adoption ? request.adoption.ownership : 'managed',
      expected_revision: observed?.revision ?? null, required_effect: EFFECT, evidence_requirements: ['resource_revision', 'transaction_checkpoint'], recovery: 'resume_same_plan' };
  });
  const base = { kind: 'plan', schema_version: BUILDER_VERSION, instance_id: request.instance_id, spec_hash: hashJson(spec),
    observations: observation.resources.map(({ id, revision }) => ({ id, revision })), operations, authorization_scope: [EFFECT],
    verification: ['configuration', 'catalog', 'project', 'storage'], recovery: 'Atomic resource and checkpoint; resume identical plan after interruption.' };
  const plan = assertContract('plan', { ...base, id: `plan:${hashJson(base)}` });
  const need: Need = { kind: 'need', schema_version: BUILDER_VERSION, id: `need:${request.instance_id}`, instance_id: request.instance_id, purpose: request.purpose, preferences: {}, allowed_effects: [EFFECT] };
  assertConstructionBundle({ need, ...catalog, spec, plan, manifest: null });
  const contents = { kind: 'installation_plan' as const, format_version: 1 as const, request, catalog, spec, plan, observation };
  return { ...contents, digest: hashJson(contents) };
}
/** Rebuild from the supported catalog instead of trusting executable instructions in a plan file. */
function validateInstallPlan(input: unknown): InstallPlan {
  const value = cloneJson(input) as InstallPlan;
  if (!value || value.kind !== 'installation_plan' || value.format_version !== 1) throw new DomainError('INVALID_INPUT', 'Unsupported installation plan.');
  const request = assertRequest(value.request);
  const checks = foundationCatalog().blueprint.required_capabilities.map(capability => ({ capability, required: true, status: 'passed' as const, evidence_refs: ['validation:declared-only'] }));
  const spec = resolveSpecification(request, value.observation.destination, checks);
  const expected = createPlan(request, spec, value.observation);
  if (hashJson(expected) !== hashJson(value)) throw new DomainError('INVALID_INPUT', 'Plan content, catalog or digest differs from the supported resolution.');
  return expected;
}
export function assertInstallAuthority(plan: InstallPlan, authority: InstallAuthority, now = new Date().toISOString()): void {
  if (authority.actor_id !== plan.request.owner_id || authority.instance_id !== plan.request.instance_id || authority.plan_digest !== plan.digest || authority.destination !== plan.observation.destination || !authority.effects.includes(EFFECT) || !Number.isFinite(Date.parse(authority.valid_until)) || Date.parse(authority.valid_until) <= Date.parse(now)) throw new DomainError('FORBIDDEN', 'Installation authority is absent, expired or outside this plan scope.');
}

export function assertInstallPlan(input: unknown): InstallPlan {
  try { return validateInstallPlan(input); }
  catch (error) {
    if (error instanceof DomainError) throw error;
    throw new DomainError('INVALID_INPUT', 'Malformed installation plan.');
  }
}
