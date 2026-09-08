import { Ajv, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { contractKinds, contractSchema, schemaId } from './schema-definitions.js';
import { cloneJson, decisionContentHash, effectKey, hashJson, hashText } from './hashing.js';
import { DomainError } from './errors.js';
import type { ContractKind, ContractMap, ModuleDefinition, Ref, StoredRecord, VersionRef } from './models.js';
import type { ValidationIssue } from './record.js';

const ajv = new Ajv({ allErrors: true, strict: true, ownProperties: true, allowUnionTypes: true });
addFormats.default(ajv);
ajv.addSchema(contractSchema);
const validators = new Map<ContractKind, ValidateFunction>();
export type Validation<K extends ContractKind> = { ok: true; value: ContractMap[K] } | { ok: false; code: 'INVALID_INPUT'; issues: ValidationIssue[] };

function unique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new DomainError('INVALID_INPUT', `${label} must have unique identities.`);
}
export function validateGraph(nodes: { id: string; depends_on: string[] }[]): void {
  unique(nodes.map(node => node.id), 'Graph');
  const graph = new Map(nodes.map(node => [node.id, node.depends_on]));
  const visiting = new Set<string>(), done = new Set<string>();
  function visit(id: string): void {
    if (!graph.has(id)) throw new DomainError('INVALID_INPUT', `Missing dependency: ${id}`);
    if (visiting.has(id)) throw new DomainError('INVALID_INPUT', `Dependency cycle at ${id}`);
    if (done.has(id)) return;
    visiting.add(id);
    for (const dependency of graph.get(id)!) visit(dependency);
    visiting.delete(id); done.add(id);
  }
  for (const node of nodes) visit(node.id);
}
const versionKey = (reference: VersionRef): string => `${reference.id}@${reference.version}`;
export function validateModuleCatalog(modules: ModuleDefinition[]): void {
  const valid = modules.map(module => assertContract('module', module));
  validateGraph(valid.map(module => ({ id: versionKey(module), depends_on: module.dependencies.map(versionKey) })));
}
function dates(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (['created_at', 'updated_at', 'observed_at', 'valid_from', 'valid_until', 'valid_to', 'accepted_at', 'at'].includes(key) && typeof item === 'string' && !Number.isFinite(Date.parse(item))) throw new DomainError('INVALID_INPUT', `Unrepresentable date: ${key}`);
  }
}
function validateEmbeddedSchema(schema: object): void {
  const local = new Ajv({ allErrors: true, strict: true, ownProperties: true, allowUnionTypes: true });
  addFormats.default(local);
  local.compile(schema);
}
function semantic(input: ContractMap[ContractKind]): void {
  dates(input);
  if ('revision' in input && 'created_at' in input && Date.parse(input.updated_at) < Date.parse(input.created_at)) throw new DomainError('INVALID_INPUT', 'updated_at precedes created_at.');
  if ('data' in input) dates(input.data);
  switch (input.kind) {
    case 'module': unique(input.dependencies.map(versionKey), 'Dependencies'); break;
    case 'blueprint': unique(input.modules.map(module => module.id), 'Modules'); break;
    case 'instance_spec': unique(input.modules.map(module => module.id), 'Resolved modules'); break;
    case 'plan':
      validateGraph(input.operations);
      for (const [index, operation] of input.operations.entries()) {
        if (operation.depends_on.some(id => input.operations.findIndex(item => item.id === id) >= index)) throw new DomainError('INVALID_INPUT', 'Plan operations must follow dependency order.');
        if (operation.operation === 'create' && operation.expected_revision !== null) throw new DomainError('INVALID_INPUT', 'Create requires absence precondition.');
        if (operation.operation === 'update' && operation.expected_revision === null) throw new DomainError('INVALID_INPUT', 'Update requires expected revision.');
      }
      break;
    case 'manifest':
      unique(input.resources.map(resource => resource.id), 'Resources');
      unique(input.verification.map(check => check.capability), 'Checks');
      if (input.verification.some(check => check.status === 'passed' && check.evidence_refs.length === 0)) throw new DomainError('INVALID_INPUT', 'Passed verification requires evidence.');
      if (input.state === 'verified' && (!input.verification.some(check => check.required) || input.verification.some(check => check.required && check.status !== 'passed'))) throw new DomainError('INVALID_INPUT', 'Required verification is incomplete.');
      break;
    case 'source':
      unique(input.data.segments.map(segment => segment.id), 'Segments');
      if (input.data.valid_to !== null && Date.parse(input.data.valid_to) <= Date.parse(input.data.valid_from)) throw new DomainError('INVALID_INPUT', 'Invalid source validity interval.');
      break;
    case 'capture': if (input.data.processing_status === 'discarded' && input.data.reason === null) throw new DomainError('INVALID_INPUT', 'Discarding a capture requires a reason.'); break;
    case 'claim':
      if (input.data.validity) {
        dates(input.data.validity);
        if (input.data.validity.valid_to !== null && Date.parse(input.data.validity.valid_to) <= Date.parse(input.data.validity.valid_from)) throw new DomainError('INVALID_INPUT', 'Invalid claim validity interval.');
      }
      break;
    case 'decision':
      if (input.data.status === 'proposed' && input.data.promotion !== null) throw new DomainError('INVALID_INPUT', 'Proposed decision cannot claim promotion.');
      if (input.data.status !== 'proposed' && input.data.promotion === null) throw new DomainError('INVALID_INPUT', 'An effective decision requires promotion provenance.');
      if (input.data.promotion) dates(input.data.promotion);
      break;
    case 'artifact':
      if (input.data.content_hash !== hashText(input.data.content)) throw new DomainError('INVALID_INPUT', 'Artifact hash does not match exact content.');
      if (input.data.status === 'approved' && input.data.accepted_at === null) throw new DomainError('INVALID_INPUT', 'Approved artifact requires acceptance timestamp.');
      if (input.data.status === 'draft' && input.data.accepted_at !== null) throw new DomainError('INVALID_INPUT', 'A draft cannot claim acceptance.');
      break;
    case 'authorization': if (Date.parse(input.data.valid_until) <= Date.parse(input.data.valid_from)) throw new DomainError('INVALID_INPUT', 'Invalid authorization interval.'); break;
    case 'run':
      if (input.data.status === 'running' && input.data.executor_id === null) throw new DomainError('INVALID_INPUT', 'Running requires executor.');
      if (input.data.status === 'paused' && (input.data.checkpoint === null || input.data.executor_id !== null)) throw new DomainError('INVALID_INPUT', 'Paused run requires checkpoint and released owner.');
      if (input.data.status === 'succeeded' && (!input.data.accepted || input.data.output_refs.length === 0)) throw new DomainError('INVALID_INPUT', 'Successful run requires accepted outputs.');
      break;
    case 'step': if (input.data.status === 'running' && (input.data.owner_id === null || input.data.fencing_token === 0)) throw new DomainError('INVALID_INPUT', 'Running step requires owner and fencing token.'); break;
    case 'action':
      if (input.data.reconciliation !== 'not_checked' && input.data.receipt_refs.length === 0) throw new DomainError('INVALID_INPUT', 'Reconciliation requires evidence.');
      if (input.data.logical_key !== effectKey(input.instance_id, input.data.job_ref.id, input.data.step_id, input.data.effect_name)) throw new DomainError('INVALID_INPUT', 'Effect key is not stable for this intent.');
      if (input.data.payload_hash !== hashJson(input.data.payload)) throw new DomainError('INVALID_INPUT', 'Payload hash mismatch.');
      if (['in_flight', 'unknown', 'confirmed'].includes(input.data.status) && input.data.attempts < 1) throw new DomainError('INVALID_INPUT', 'Effect status requires an attempt.');
      if (input.data.status === 'confirmed' && input.data.receipt_refs.length === 0) throw new DomainError('INVALID_INPUT', 'Confirmation requires receipt evidence.');
      break;
    case 'skill':
      validateEmbeddedSchema(input.input_schema); validateEmbeddedSchema(input.output_schema);
      unique(input.dependencies.map(versionKey), 'Skill dependencies');
      break;
    case 'workflow': {
      validateEmbeddedSchema(input.input_schema);
      validateGraph(input.steps);
      const steps = new Map(input.steps.map(step => [step.id, step]));
      for (const step of input.steps) {
        unique(step.input_bindings.map(binding => binding.name), 'Bindings');
        for (const binding of step.input_bindings) if (binding.from_step !== null && (!step.depends_on.includes(binding.from_step) || !steps.get(binding.from_step)?.outputs.includes(binding.output))) throw new DomainError('INVALID_INPUT', 'Binding must reference a declared dependency output.');
      }
      for (const output of input.output_refs) if (!steps.get(output.step_id)?.outputs.includes(output.output)) throw new DomainError('INVALID_INPUT', 'Unknown workflow output.');
      for (const step of input.steps) if (!input.steps.some(node => node.depends_on.includes(step.id)) && !input.output_refs.some(output => output.step_id === step.id)) throw new DomainError('INVALID_INPUT', 'Terminal step has no workflow output.');
      break;
    }
    case 'transfer_plan': {
      if (input.mode === 'copy' && (input.authority.activate_jobs || input.source_instance_id === input.target_instance_id)) throw new DomainError('INVALID_INPUT', 'Copy requires a new identity and inactive jobs.');
      if (input.mode !== 'copy' && input.source_instance_id !== input.target_instance_id) throw new DomainError('INVALID_INPUT', 'Move/restore preserve instance identity.');
      if (input.authority.activate_jobs && !input.authority.source_frozen) throw new DomainError('INVALID_INPUT', 'Active jobs require transferred authority.');
      const keys = input.definitions.map(definition => versionKey(definition.ref)); unique(keys, 'Transfer definitions');
      for (const definition of input.definitions) {
        if ((definition.content === null) === (definition.locator === null)) throw new DomainError('INVALID_INPUT', 'A definition needs exactly one content or locator.');
        if (definition.content !== null && hashJson(definition.content) !== definition.hash) throw new DomainError('INVALID_INPUT', 'Definition hash mismatch.');
        if (definition.dependencies.some(dependency => !keys.includes(versionKey(dependency)))) throw new DomainError('INVALID_INPUT', 'Missing executable dependency.');
      }
      validateGraph(input.definitions.map(definition => ({ id: versionKey(definition.ref), depends_on: definition.dependencies.map(versionKey) })));
      break;
    }
    case 'eval_fixture': {
      dates(input.input.source);
      const ids = input.input.source.segments.map(segment => segment.id); unique(ids, 'Fixture segments');
      for (const claim of [...input.expected.decisions, ...input.expected.proposals, ...input.expected.open_questions]) if (!ids.includes(claim.source_segment)) throw new DomainError('INVALID_INPUT', 'Expected claim has no source segment.');
      break;
    }
  }
}
export function validateContract<K extends ContractKind>(kind: K, input: unknown): Validation<K> {
  try {
    if (!contractKinds.includes(kind)) throw new DomainError('INVALID_INPUT', 'Unknown contract kind.');
    const copy = cloneJson(input);
    let validator = validators.get(kind);
    if (!validator) { validator = ajv.getSchema(`${schemaId}#/definitions/${kind}`)!; validators.set(kind, validator); }
    if (!validator(copy)) return { ok: false, code: 'INVALID_INPUT', issues: (validator.errors ?? []).map(error => ({ path: error.instancePath || '/', message: error.message ?? 'Invalid value' })) };
    semantic(copy as ContractMap[ContractKind]);
    return { ok: true, value: copy as ContractMap[K] };
  } catch (error) { return { ok: false, code: 'INVALID_INPUT', issues: [{ path: '/', message: error instanceof Error ? error.message : 'Invalid input' }] }; }
}
export function assertContract<K extends ContractKind>(kind: K, input: unknown): ContractMap[K] {
  const result = validateContract(kind, input);
  if (!result.ok) throw new DomainError('INVALID_INPUT', 'Contract validation failed.', { kind, issues: result.issues });
  return result.value;
}
export function sameRef(a: Ref, b: Ref): boolean { return a.id === b.id && a.revision === b.revision; }
export { decisionContentHash };
export function assertRecord(input: StoredRecord): StoredRecord { return assertContract(input.kind, input); }
