import type { ContractKind } from './models.js';

type Schema = Record<string, unknown>;
const text: Schema = { type: 'string', minLength: 1, pattern: '\\S' };
const date: Schema = { type: 'string', format: 'date-time', pattern: 'Z$' };
const hash: Schema = { type: 'string', pattern: '^[a-f0-9]{64}$' };
const version: Schema = { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?$' };
const integer = (minimum = 0): Schema => ({ type: 'integer', minimum });
const enumeration = (...values: string[]): Schema => ({ type: 'string', enum: values });
const nullable = (schema: Schema): Schema => ({ anyOf: [schema, { type: 'null' }] });
const array = (items: Schema, minItems = 0): Schema => ({ type: 'array', items, minItems, uniqueItems: true });
const object = (properties: Record<string, Schema>, optional: Record<string, Schema> = {}): Schema => ({ type: 'object', properties: { ...properties, ...optional }, required: Object.keys(properties), additionalProperties: false });
const ref = (name: string): Schema => ({ $ref: `#/definitions/${name}` });
const strings = array(text);
const nonempty = array(text, 1);
const jsonObject: Schema = { type: 'object', additionalProperties: ref('json') };
const reference = ref('reference');
const references = array(reference);
const versionRef = ref('version_ref');
const versions = array(versionRef);
const evidence = array(ref('evidence'), 1);
const budget = ref('budget');
const sourcePolicy = enumeration('snapshot', 'fresh');
const ownership = enumeration('managed', 'shared', 'user_owned');
const common = { schema_version: { const: '0.1.0-draft' }, id: text };
const base = (kind: string, properties: Record<string, Schema>): Schema => object({ kind: { const: kind }, ...common, ...properties });
const definition = (kind: string, properties: Record<string, Schema>): Schema => base(kind, { version, purpose: text, ...properties });
const record = (kind: string, data: Schema): Schema => base(kind, { instance_id: text, revision: text, created_at: date, updated_at: date, access: ref('access'), data });
export const contractKinds: ContractKind[] = ['need', 'module', 'blueprint', 'instance_spec', 'plan', 'manifest', 'project', 'source', 'capture', 'claim', 'decision', 'artifact', 'relation', 'authorization', 'job', 'run', 'step', 'action', 'skill', 'workflow', 'transfer_plan', 'eval_fixture'];
export const schemaId = 'urn:manu-control-center:contracts:0.1.0-draft';
export const contractSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#', $id: schemaId,
  oneOf: contractKinds.map(ref),
  definitions: {
    json: { anyOf: [{ type: ['null', 'boolean', 'number', 'string'] }, { type: 'array', items: ref('json') }, jsonObject] },
    reference: object({ id: text, revision: text }), version_ref: object({ id: text, version }),
    access: object({ owner_id: text, readers: strings, writers: strings }),
    evidence: object({ source: reference, segment_id: text }),
    budget: object({ max_steps: integer(1), max_attempts: integer(1), timeout_ms: integer(1), max_tokens: nullable(integer()), max_cost: nullable({ type: 'number', minimum: 0 }) }),
    target: object({ adapter_id: { ...text, not: { enum: ['TO_BE_SELECTED'] } }, version, capabilities: strings, configuration: jsonObject }),
    segment: object({ id: text, text, speaker: nullable(text) }),
    need: base('need', { instance_id: text, purpose: text, preferences: jsonObject, allowed_effects: strings }),
    module: definition('module', { dependencies: versions, requires_capabilities: strings, exports: nonempty }),
    blueprint: definition('blueprint', { modules: array(versionRef, 1), required_capabilities: strings, required_configuration: strings, entity_kinds: array(enumeration('project', 'source', 'capture', 'claim', 'decision', 'artifact', 'relation'), 1), acceptance: nonempty }),
    instance_spec: base('instance_spec', { revision: text, instance_id: text, purpose: text, blueprint: versionRef, modules: array(versionRef, 1), kernel: versionRef, targets: object({ backend: ref('target'), runtime: ref('target'), interface: ref('target') }), policy: object({ allowed_effects: strings, source_policy: sourcePolicy }), secret_refs: strings, configuration: jsonObject, overrides: jsonObject }),
    plan: base('plan', { instance_id: text, spec_hash: hash, observations: references,
      operations: array(object({ id: text, operation: enumeration('inspect', 'create', 'reuse', 'update', 'verify'), resource_id: text, adapter_id: text, depends_on: strings, ownership, expected_revision: nullable(text), required_effect: text, evidence_requirements: nonempty, recovery: text }), 1), authorization_scope: strings, verification: nonempty, recovery: text }),
    manifest: base('manifest', { instance_id: text, revision: text, spec_hash: hash, applied_spec: reference, state: enumeration('partial', 'installed_unverified', 'verified'),
      resources: array(object({ id: text, adapter_id: text, physical_ref: text, ownership, revision: text, baseline_hash: hash })), overrides: jsonObject,
      verification: array(object({ capability: text, required: { type: 'boolean' }, status: enumeration('passed', 'failed', 'not_run'), evidence_refs: strings })) }),
    project: record('project', object({ purpose: text, status: enumeration('active', 'paused', 'completed'), responsible: text, next_action: nullable(text), decision_refs: references, source_refs: references })),
    source: record('source', object({ project_ref: nullable(reference), locator: text, scope: text, observed_at: date, valid_from: date, valid_to: nullable(date), authority: enumeration('primary', 'secondary', 'unverified'), segments: array(ref('segment'), 1) })),
    capture: record('capture', object({ project_ref: reference, source_ref: reference, segment_ids: nonempty, processing_status: enumeration('pending', 'integrated', 'discarded'), dedup_key: text, reason: nullable(text) })),
    claim: record('claim', object({ project_ref: reference, content: text, epistemic_status: enumeration('declared', 'hypothesis', 'proposed', 'confirmed', 'refuted'), evidence }, { validity: object({ valid_from: date, valid_to: nullable(date) }) })),
    decision: record('decision', object({ project_ref: reference, choice: text, status: enumeration('proposed', 'active', 'superseded', 'revoked'), actor_id: text, alternatives: strings, evidence, review_criterion: text, promotion: nullable(object({ grant_ref: reference, at: date })) })),
    artifact: record('artifact', object({ project_ref: reference, content: { type: 'string' }, content_hash: hash, status: enumeration('draft', 'approved'), source_refs: references, accepted_at: nullable(date) })),
    relation: record('relation', object({ from: reference, to: reference, relation_type: text, evidence: array(ref('evidence')) })),
    authorization: record('authorization', object({ actor_id: text, operation: text, resource_id: text, destination: text, content_hash: nullable(hash), valid_from: date, valid_until: date, revoked: { type: 'boolean' } })),
    job: record('job', object({ workflow: versionRef, input_refs: references, dedup_key: text, source_policy: sourcePolicy, status: enumeration('queued', 'active', 'succeeded', 'failed', 'cancelled'), budget })),
    run: record('run', object({ job_ref: reference, workflow: versionRef, previous_run: nullable(reference), status: enumeration('queued', 'running', 'waiting_input', 'blocked', 'paused', 'succeeded', 'failed', 'cancel_requested', 'cancelled'), executor_id: nullable(text), checkpoint: nullable(jsonObject), output_refs: references, action_refs: references, accepted: { type: 'boolean' }, cause: nullable(text) })),
    step: record('step', object({ run_ref: reference, step_id: text, status: enumeration('pending', 'running', 'waiting_input', 'succeeded', 'failed', 'skipped'), input_refs: references, output_refs: references, owner_id: nullable(text), fencing_token: integer(), checkpoint: nullable(jsonObject) })),
    action: record('action', object({ job_ref: reference, step_id: text, effect_name: text, logical_key: hash, destination: text, payload: ref('json'), payload_hash: hash, grant_ref: nullable(reference), status: enumeration('prepared', 'in_flight', 'confirmed', 'failed', 'unknown', 'rejected'), attempts: integer(), receipt_refs: strings, reconciliation: enumeration('not_checked', 'effect_confirmed', 'no_effect_proven') }, { result: jsonObject })),
    skill: definition('skill', { input_schema: jsonObject, output_schema: jsonObject, allowed_sources: strings, allowed_tools: versions, effects: strings, dependencies: versions, limits: budget, errors: nonempty, evals: nonempty }),
    workflow: definition('workflow', { input_schema: jsonObject, steps: array(object({ id: text, type: enumeration('deterministic', 'agent', 'human'), capability: versionRef, depends_on: strings, input_bindings: array(object({ name: text, from_step: nullable(text), output: text })), outputs: nonempty, effects: strings, recovery: enumeration('retry', 'pause', 'fail'), acceptance: nonempty }), 1), output_refs: array(object({ step_id: text, output: text }), 1), acceptance: nonempty, source_policy: sourcePolicy, limits: budget }),
    transfer_plan: base('transfer_plan', { source_instance_id: text, target_instance_id: text, mode: enumeration('move', 'copy', 'restore'), authority: object({ source_host: text, destination_host: text, generation: integer(1), source_frozen: { type: 'boolean' }, activate_jobs: { type: 'boolean' } }), records: references, secret_refs: strings,
      definitions: array(object({ ref: versionRef, kind: enumeration('skill', 'workflow', 'validator'), hash, content: nullable(jsonObject), locator: nullable(text), dependencies: versions })) }),
    eval_fixture: object({ kind: { const: 'eval_fixture' }, schema_version: { const: '0.1.0-draft' }, fixture_id: text, fixture_version: { const: '0.2.0-draft' }, synthetic: { const: true },
      input: object({ project: object({ id: text, purpose: text }), source: object({ id: text, revision: text, observed_at: date, segments: array(ref('segment'), 1) }) }),
      expected: object({ decisions: array(ref('expected_claim')), proposals: array(ref('expected_claim')), open_questions: array(ref('expected_claim')), must_not_assert: strings }) }),
    expected_claim: object({ meaning: text, source_segment: text }),
  },
};
