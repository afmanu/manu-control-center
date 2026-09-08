import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertBudget, assertMutation, resolveSourceVersions } from '../core/state.js';
import { assertAuthorized } from '../core/policy.js';
import { fixture, now } from './fixtures.js';

test('run transition graph forbids terminal reopening and direct success from queued', () => {
  const before = fixture('run'), after = fixture('run');
  after.data.status = 'succeeded'; assert.throws(() => assertMutation(before, after));
  before.data.status = 'failed'; after.data.status = 'running'; assert.throws(() => assertMutation(before, after));
  before.data.status = 'running'; after.data.status = 'cancel_requested'; assertMutation(before, after);
  before.data.status = 'cancel_requested'; after.data.status = 'succeeded'; assert.throws(() => assertMutation(before, after));
  after.data.status = 'cancelled'; assertMutation(before, after);
});
test('step ownership cannot regress fencing tokens', () => {
  const before = fixture('step'), after = fixture('step');
  before.data.owner_id = 'old'; before.data.fencing_token = 7;
  after.data.owner_id = 'new'; after.data.fencing_token = 7;
  assert.throws(() => assertMutation(before, after));
  after.data.fencing_token = 8; assertMutation(before, after);
});
test('authorizations are scoped, temporal and reusable without changing the grant', () => {
  const grant = fixture('authorization');
  const request = { instance_id:grant.instance_id, actor_id:'alice',operation:grant.data.operation,resource_id:grant.data.resource_id,destination:grant.data.destination,content_hash:null };
  assertAuthorized(request,grant,now); assertAuthorized(request,grant,now);
  for (const changed of [{...request,actor_id:'bob'}, {...request,instance_id:'other'}, {...request,destination:'other'}, {...request,resource_id:'other'}]) assert.throws(()=>assertAuthorized(changed,grant,now));
  grant.data.content_hash = '0'.repeat(64); assert.throws(()=>assertAuthorized(request,grant,now));
  grant.data.content_hash=null; grant.data.revoked=true; assert.throws(()=>assertAuthorized(request,grant,now));
  grant.data.revoked=false; assert.throws(()=>assertAuthorized(request,grant,grant.data.valid_until));
});
test('source policy preserves snapshots or invalidates stale outputs explicitly', () => {
  const old = {id:'source',revision:'old'}, current={id:'source',revision:'new'};
  assert.deepEqual(resolveSourceVersions('snapshot',[old],[current],[old,current]),{refs:[old],invalidate:false});
  assert.deepEqual(resolveSourceVersions('fresh',[old],[current],[old,current]),{refs:[current],invalidate:true});
  assert.throws(()=>resolveSourceVersions('snapshot',[old],[current],[current]));
  assert.throws(()=>resolveSourceVersions('fresh',[old],[],[old]));
  assert.throws(()=>resolveSourceVersions('fresh',[old],[old,current],[old,current]));
});
test('budget check prevents new work at each exhausted bound', () => {
  const budget=fixture('job').data.budget;
  const usage={steps:0,attempts:0,elapsed_ms:0,tokens:0,cost:0}; assertBudget(budget,usage);
  for(const patch of [{steps:budget.max_steps},{attempts:budget.max_attempts},{elapsed_ms:budget.timeout_ms},{tokens:budget.max_tokens!},{cost:budget.max_cost!},{cost:Infinity}]) assert.throws(()=>assertBudget(budget,{...usage,...patch}));
});
