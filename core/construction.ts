import { assertContract, validateModuleCatalog } from './validation.js';
import { cloneJson, hashJson } from './hashing.js';
import { DomainError } from './errors.js';
import type { Blueprint, InstanceSpec, Manifest, ModuleDefinition, Need, Plan, VersionRef } from './models.js';

export interface ConstructionBundle { need: Need; blueprint: Blueprint; modules: ModuleDefinition[]; spec: InstanceSpec; plan: Plan; manifest: Manifest | null }
const key = (reference: VersionRef): string => `${reference.id}@${reference.version}`;
const require = (condition: boolean, message: string): void => { if (!condition) throw new DomainError('INVALID_INPUT', message); };
/** Verifies declared coherence only. Actual capability inspection and planning belong to M2. */
export function assertConstructionBundle(input: unknown): ConstructionBundle {
  const value = cloneJson(input);
  require(!!value && typeof value === 'object' && !Array.isArray(value), 'Construction bundle must be an object.');
  const object = value as Record<string, unknown>;
  require(Object.keys(object).sort().join(',') === 'blueprint,manifest,modules,need,plan,spec', 'Unexpected or missing bundle fields.');
  require(Array.isArray(object['modules']), 'Bundle modules must be an array.');
  const need = assertContract('need', object['need']), blueprint = assertContract('blueprint', object['blueprint']);
  const modules = (object['modules'] as unknown[]).map(module => assertContract('module', module));
  const spec = assertContract('instance_spec', object['spec']), plan = assertContract('plan', object['plan']);
  const manifest = object['manifest'] === null ? null : assertContract('manifest', object['manifest']);
  validateModuleCatalog(modules);
  const catalog = new Map(modules.map(module => [key(module), module]));
  const selected = new Set(spec.modules.map(key));
  require(need.instance_id === spec.instance_id && spec.instance_id === plan.instance_id && (!manifest || manifest.instance_id === spec.instance_id), 'Bundle instance identities differ.');
  require(key(spec.blueprint) === key(blueprint), 'Resolved blueprint differs from the provided definition.');
  require(blueprint.modules.every(module => selected.has(key(module))), 'Required blueprint module is missing.');
  for (const module of spec.modules) {
    require(catalog.has(key(module)), 'Resolved module version is unavailable.');
    require(catalog.get(key(module))!.dependencies.every(dependency => selected.has(key(dependency))), 'Required module dependency is not selected.');
  }
  const capabilities = new Set(Object.values(spec.targets).flatMap(target => target.capabilities));
  require([...blueprint.required_capabilities, ...spec.modules.flatMap(module => catalog.get(key(module))!.requires_capabilities)].every(capability => capabilities.has(capability)), 'Declared target capabilities are insufficient.');
  require(blueprint.required_configuration.every(name => Object.hasOwn(spec.configuration, name)), 'Required configuration is missing.');
  require(spec.policy.allowed_effects.every(effect => need.allowed_effects.includes(effect)), 'Resolved policy expands requested effects.');
  require(plan.spec_hash === hashJson(spec), 'Plan hash does not match resolved specification.');
  const adapters = new Set(Object.values(spec.targets).map(target => target.adapter_id));
  for (const operation of plan.operations) {
    require(adapters.has(operation.adapter_id), 'Plan operation targets an unresolved adapter.');
    require(spec.policy.allowed_effects.includes(operation.required_effect) && plan.authorization_scope.includes(operation.required_effect), 'Plan effect is outside declared scope.');
  }
  if (manifest) require(manifest.spec_hash === hashJson(spec) && manifest.applied_spec.id === spec.id && manifest.applied_spec.revision === spec.revision, 'Manifest references another specification.');
  return { need, blueprint, modules, spec, plan, manifest };
}
