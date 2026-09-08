import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contractKinds } from '../core/schema-definitions.js';
import { assertContract, validateContract, validateModuleCatalog } from '../core/validation.js';
import { canonicalJson, effectKey, hashJson } from '../core/hashing.js';
import { fixture } from './fixtures.js';

for (const kind of contractKinds) {
  test(`contract ${kind}: accepts versioned fixture and rejects unsupported version`, () => {
    const input = fixture(kind);
    assert.equal(validateContract(kind, input).ok, true);
    const result = validateContract(kind, { ...input, schema_version: '99.0.0' });
    assert.equal(result.ok, false);
  });
}
test('resolved targets reject placeholders and unpinned versions', () => {
  const input = fixture('instance_spec'); input.targets.runtime.adapter_id = 'TO_BE_SELECTED';
  assert.equal(validateContract('instance_spec', input).ok, false);
  input.targets.runtime.adapter_id = 'runtime'; input.targets.runtime.version = '^1.0.0';
  assert.equal(validateContract('instance_spec', input).ok, false);
});
test('plan rejects missing dependencies, cycles and unsafe write preconditions', () => {
  const plan = fixture('plan'); plan.operations[0]!.depends_on = ['missing'];
  assert.equal(validateContract('plan', plan).ok, false);
  plan.operations[0]!.depends_on = [plan.operations[0]!.id];
  assert.equal(validateContract('plan', plan).ok, false);
  plan.operations[0]!.depends_on = []; plan.operations[0]!.expected_revision = 'old';
  assert.equal(validateContract('plan', plan).ok, false);
  plan.operations[0]!.operation = 'update'; plan.operations[0]!.expected_revision = null;
  assert.equal(validateContract('plan', plan).ok, false);
});
test('verified manifest needs required checks and actual evidence references', () => {
  const input = fixture('manifest'); input.state = 'verified';
  assert.equal(validateContract('manifest', input).ok, false);
  input.verification[0]!.status = 'passed';
  assert.equal(validateContract('manifest', input).ok, false);
  input.verification[0]!.evidence_refs = ['synthetic:proof'];
  assert.equal(validateContract('manifest', input).ok, true);
});
test('workflow validates bindings, cycles, outputs and acceptance independently', () => {
  const workflow = fixture('workflow'); workflow.steps[0]!.acceptance = [];
  assert.equal(validateContract('workflow', workflow).ok, false);
  workflow.steps[0]!.acceptance = ['check']; workflow.steps[0]!.input_bindings[0]!.from_step = 'missing';
  assert.equal(validateContract('workflow', workflow).ok, false);
  workflow.steps[0]!.input_bindings[0]!.from_step = null; workflow.steps[0]!.depends_on = ['brief'];
  assert.equal(validateContract('workflow', workflow).ok, false);
  workflow.steps[0]!.depends_on = []; workflow.output_refs[0]!.output = 'unknown';
  assert.equal(validateContract('workflow', workflow).ok, false);
});
test('embedded schemas are isolated from validator registry and repeatable', () => {
  const skill = fixture('skill'); skill.input_schema = { $id: 'urn:synthetic:input', type: 'object' };
  assert.equal(validateContract('skill', skill).ok, true);
  assert.equal(validateContract('skill', skill).ok, true);
  skill.input_schema = { type: 'unknown-type' };
  assert.equal(validateContract('skill', skill).ok, false);
  assert.equal(validateContract('project', fixture('project')).ok, true);
});
test('module catalog rejects missing dependencies, version mismatches and cycles', () => {
  const first = fixture('module'); validateModuleCatalog([first]);
  first.dependencies = [{ id: 'second', version: '1.0.0' }];
  assert.throws(() => validateModuleCatalog([first]));
  const second = { ...fixture('module'), id: 'second', version: '2.0.0' };
  assert.throws(() => validateModuleCatalog([first, second]));
  second.version = '1.0.0'; second.dependencies = [{ id: first.id, version: first.version }];
  assert.throws(() => validateModuleCatalog([first, second]));
  second.dependencies = []; validateModuleCatalog([first, second]);
});
test('content identity rejects corrupt artifacts and mutable effect payloads', () => {
  const artifact = fixture('artifact'); artifact.data.content = 'different';
  assert.equal(validateContract('artifact', artifact).ok, false);
  const action = fixture('action'); action.data.payload = { changed: true };
  assert.equal(validateContract('action', action).ok, false);
  assert.equal(effectKey('a','job','step','send'), effectKey('a','job','step','send'));
  assert.notEqual(effectKey('a','job','step','send'), effectKey('b','job','step','send'));
});
test('portable transfer contracts prevent active copies and unresolved executable dependencies', () => {
  const input = fixture('transfer_plan'); input.authority.activate_jobs = true;
  assert.equal(validateContract('transfer_plan', input).ok, false);
  input.mode = 'move'; input.target_instance_id = input.source_instance_id;
  assert.equal(validateContract('transfer_plan', input).ok, false);
  input.authority.source_frozen = true;
  assert.equal(validateContract('transfer_plan', input).ok, true);
  input.definitions[0]!.dependencies = [{ id: 'missing-validator', version: '1.0.0' }];
  assert.equal(validateContract('transfer_plan', input).ok, false);
  input.definitions[0]!.dependencies = []; input.definitions[0]!.hash = '0'.repeat(64);
  assert.equal(validateContract('transfer_plan', input).ok, false);
});
test('canonical hashing is stable across key order and rejects lossy inputs', () => {
  assert.equal(hashJson({b:2,a:1}), hashJson({a:1,b:2}));
  for (const input of [NaN, Infinity, undefined, { value: undefined }, [undefined], new Date(), 1n]) assert.throws(() => canonicalJson(input));
  const cyclic: Record<string, unknown> = {}; cyclic['self'] = cyclic;
  assert.throws(() => canonicalJson(cyclic));
  assert.throws(() => assertContract('need', cyclic));
});

test('construction bundle binds versions, capabilities, policy, hashes and instance identity', async () => {
  const {readFileSync}=await import('node:fs');
  const {assertConstructionBundle}=await import('../core/construction.js');
  const original=JSON.parse(readFileSync(new URL('../../examples/contracts/construction-bundle.json',import.meta.url),'utf8'));
  assertConstructionBundle(original);
  const mutations=[
    (bundle:typeof original)=>{bundle.spec.modules[0].version='2.0.0';},
    (bundle:typeof original)=>{bundle.blueprint.required_capabilities=['unavailable'];},
    (bundle:typeof original)=>{bundle.blueprint.required_configuration=['missing'];},
    (bundle:typeof original)=>{bundle.spec.instance_id='other';},
    (bundle:typeof original)=>{bundle.spec.policy.allowed_effects.push('external.send');},
    (bundle:typeof original)=>{bundle.plan.operations[0].adapter_id='unknown';},
    (bundle:typeof original)=>{bundle.plan.spec_hash='0'.repeat(64);},
    (bundle:typeof original)=>{bundle.manifest.applied_spec.revision='other';},
  ];
  for(const mutate of mutations){const bundle=structuredClone(original);mutate(bundle);assert.throws(()=>assertConstructionBundle(bundle));}
});
