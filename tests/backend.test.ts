import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { DatabaseSync } from 'node:sqlite';
import { SqliteBackend } from '../adapters/backends/sqlite/store.js';
import { DomainError } from '../core/errors.js';
import { decisionContentHash, hashJson, hashText } from '../core/hashing.js';
import type { ScopedBackend } from '../core/adapters.js';
import type { StoredRecord } from '../core/models.js';
import { newRecord, now, replaceRefs, seed } from './fixtures.js';

const identity = { instance_id:'instance-demo', actor_id:'alice' };
const reference = (record: StoredRecord) => ({id:record.id,revision:record.revision});
function code(error: unknown, expected: string): boolean { return error instanceof DomainError && error.code === expected; }
async function database(work: (store: SqliteBackend, scope: ScopedBackend, path: string) => void | Promise<void>): Promise<void> {
  const directory=mkdtempSync(join(tmpdir(),'mcc-m1-test-')),path=join(directory,'store.sqlite');
  const store=new SqliteBackend(path,()=>now);
  try { await work(store,store.forScope(identity),path); }
  finally { store.close();rmSync(directory,{recursive:true,force:true}); }
}

test('backend persists opaque identities and exact historical revisions across connections',()=>database((store,scope,path)=>{
  const created=scope.create(newRecord('project'));
  const updated=scope.update({...created,data:{...created.data,purpose:'Changed purpose'}} as StoredRecord,created.revision);
  assert.notEqual(updated.revision,created.revision);
  const reopened=new SqliteBackend(path,()=>now);
  try {
    assert.deepEqual(reopened.forScope(identity).get(created.id,created.revision),created);
    assert.deepEqual(reopened.forScope(identity).get(created.id),updated);
    assert.equal(reopened.forScope(identity).history(created.id).length,2);
  } finally {reopened.close();}
  assert.equal(store.capabilities.export_import,false);
}));
test('instance scopes isolate identical logical IDs in read, query, history and writes',()=>database((store,scope)=>{
  const first=scope.create(newRecord('project'));
  const other=store.forScope({...identity,instance_id:'other-instance'});
  const secondInput=newRecord('project');secondInput.instance_id='other-instance';secondInput.data.purpose='Other private project';
  const second=other.create(secondInput);
  assert.equal(scope.query().records.length,1);assert.equal(other.query().records.length,1);
  assert.notDeepEqual(scope.get(first.id),other.get(second.id));
  assert.throws(()=>other.get(first.id,first.revision),error=>code(error,'NOT_FOUND'));
  assert.throws(()=>scope.update(second,second.revision),error=>code(error,'FORBIDDEN'));
  assert.throws(()=>scope.create(secondInput),error=>code(error,'FORBIDDEN'));
  assert.equal(scope.history(first.id).length,1);
}));
test('access is filtered before pagination and protects historical reads and writes',()=>database((store,alice)=>{
  const privateInput=newRecord('project');privateInput.id='00-private';alice.create(privateInput);
  for(const id of ['10-shared','20-shared']){const input=newRecord('project');input.id=id;input.access.readers=['bob'];alice.create(input);}
  const bob=store.forScope({...identity,actor_id:'bob'});
  const page=bob.query({limit:1});assert.deepEqual(page.records.map(record=>record.id),['10-shared']);assert.equal(page.next_cursor,'10-shared');
  assert.deepEqual(bob.query({limit:1,after_id:page.next_cursor!}).records.map(record=>record.id),['20-shared']);
  for(const operation of [()=>bob.get('00-private'),()=>bob.history('00-private')])assert.throws(operation,error=>code(error,'NOT_FOUND'));
  const visible=bob.get('10-shared');assert.throws(()=>bob.update(visible,visible.revision),error=>code(error,'FORBIDDEN'));
  const revoked=alice.get(visible.id);revoked.access.readers=[];alice.update(revoked,revoked.revision);
  assert.throws(()=>bob.get(visible.id,visible.revision),error=>code(error,'NOT_FOUND'));
  assert.throws(()=>bob.history(visible.id),error=>code(error,'NOT_FOUND'));
  assert.throws(()=>bob.query({limit:0}),error=>code(error,'INVALID_INPUT'));
}));
test('writers cannot change ownership, grant themselves access or issue authorization',()=>database((store,alice)=>{
  const input=newRecord('project');input.access.writers=['bob'];const created=alice.create(input);
  const bob=store.forScope({...identity,actor_id:'bob'});
  const altered=bob.get(created.id);altered.access.readers=['mallory'];
  assert.throws(()=>bob.update(altered,altered.revision),error=>code(error,'FORBIDDEN'));
  const owner=bob.get(created.id);owner.access.owner_id='bob';assert.throws(()=>bob.update(owner,owner.revision));
  assert.throws(()=>alice.create(newRecord('authorization')),error=>code(error,'FORBIDDEN'));
  const issuer=store.forScope({...identity,can_authorize:true});const grant=issuer.create(newRecord('authorization'));
  assert.throws(()=>alice.update(grant,grant.revision),error=>code(error,'FORBIDDEN'));
}));
test('foreign and missing references are rejected atomically without dangling relations',()=>database((store,alice)=>{
  const project=alice.create(newRecord('project'));
  const source=newRecord('source');source.data.project_ref=reference(project);source.data.project_ref.revision='missing';
  assert.throws(()=>alice.create(source),error=>code(error,'NOT_FOUND'));
  assert.equal(alice.query().records.length,1);
  const bob=store.forScope({...identity,actor_id:'bob'});const hidden=newRecord('project');hidden.id='bob-private';hidden.access.owner_id='bob';const bobProject=bob.create(hidden);
  const relation=newRecord('relation');relation.data.from=reference(project);relation.data.to=reference(bobProject);
  assert.throws(()=>alice.link(relation),error=>code(error,'NOT_FOUND'));
  assert.equal(alice.query({kind:'relation'}).records.length,0);
  const records=seed(store.forScope({...identity,instance_id:'another'}),[]);assert.equal(records.size,0);
}));
test('relations and evidence resolve exact source revisions and segment identities',()=>database((_store,scope)=>{
  const records=seed(scope,['project','source']);
  const relation=scope.link(replaceRefs(newRecord('relation'),records));assert.equal(relation.kind,'relation');
  const claim=replaceRefs(newRecord('claim'),records);claim.data.evidence[0]!.segment_id='missing';
  assert.throws(()=>scope.create(claim),error=>code(error,'INVALID_INPUT'));
  const capture=replaceRefs(newRecord('capture'),records);capture.data.segment_ids=['missing'];assert.throws(()=>scope.create(capture));
  const valid=scope.create(replaceRefs(newRecord('claim'),records));assert.equal(valid.kind,'claim');
}));
test('two real worker connections cannot both update the same expected revision',()=>database(async(_store,scope,path)=>{
  const original=scope.create(newRecord('project'));
  const moduleUrl=new URL('../adapters/backends/sqlite/store.js',import.meta.url).href;
  const workerScript=`const {parentPort,workerData}=require('node:worker_threads');
    (async()=>{let store;let result;try{const {SqliteBackend}=await import(workerData.moduleUrl);store=new SqliteBackend(workerData.path,()=>workerData.now);const scope=store.forScope(workerData.identity);const record=workerData.record;record.data.purpose=workerData.purpose;scope.update(record,record.revision);result={status:'written'};}catch(error){result={status:error.code||String(error)};}finally{store?.close();}parentPort.postMessage(result);})();`;
  const run=(purpose:string)=>new Promise<{status:string}>((resolve,reject)=>{const worker=new Worker(workerScript,{eval:true,workerData:{moduleUrl,path,now,identity,record:original,purpose}});worker.once('message',resolve);worker.once('error',reject);worker.once('exit',exit=>{if(exit!==0)reject(new Error(`Worker exited ${exit}`));});});
  const outcomes=await Promise.all([run('writer-a'),run('writer-b')]);
  assert.deepEqual(outcomes.map(result=>result.status).sort(),['CONFLICT','written']);
  assert.equal(scope.history(original.id).length,2);
  assert.throws(()=>scope.update(original,original.revision),error=>code(error,'CONFLICT'));
}));
test('decisions require a current scoped grant; promotion records server time',()=>database((store,scope)=>{
  const records=seed(scope,['project','source']);
  const proposed=scope.create(replaceRefs(newRecord('decision'),records)) as StoredRecord<'decision'>;
  const forged={...proposed,data:{...proposed.data,status:'active' as const,promotion:{grant_ref:{id:'missing',revision:'r1'},at:now}}};
  assert.throws(()=>scope.update(forged,forged.revision),error=>code(error,'NOT_FOUND'));
  const issuer=store.forScope({...identity,can_authorize:true});
  const input=newRecord('authorization');input.data.content_hash=decisionContentHash(proposed);const grant=issuer.create(input);
  const active=scope.update({...forged,data:{...forged.data,promotion:{grant_ref:reference(grant),at:'2020-01-01T00:00:00Z'}}},proposed.revision) as StoredRecord<'decision'>;
  assert.equal(active.data.status,'active');assert.equal(active.data.promotion!.at,now);
  const altered=structuredClone(active);altered.data.choice='Another decision';
  assert.throws(()=>scope.update(altered,active.revision),error=>code(error,'FORBIDDEN'));
  assert.equal((scope.get(proposed.id) as StoredRecord<'decision'>).data.choice,proposed.data.choice);
}));
test('revoked or stale grant revisions cannot authorize a later promotion',()=>database((store,scope)=>{
  const records=seed(scope,['project','source']);const proposed=scope.create(replaceRefs(newRecord('decision'),records)) as StoredRecord<'decision'>;
  const issuer=store.forScope({...identity,can_authorize:true});const grant=issuer.create(newRecord('authorization')) as StoredRecord<'authorization'>;
  const revoked=structuredClone(grant);revoked.data.revoked=true;issuer.update(revoked,grant.revision);
  proposed.data.status='active';proposed.data.promotion={grant_ref:reference(grant),at:now};
  assert.throws(()=>scope.update(proposed,proposed.revision),error=>code(error,'FORBIDDEN'));
  assert.equal(scope.history(proposed.id).length,1);
}));
test('approved artifacts preserve exact bytes and acceptance history',()=>database((_store,scope)=>{
  const records=seed(scope,['project','source']);let artifact=scope.create(replaceRefs(newRecord('artifact'),records)) as StoredRecord<'artifact'>;
  artifact.data.status='approved';artifact.data.accepted_at=now;artifact=scope.update(artifact,artifact.revision) as StoredRecord<'artifact'>;
  const altered=structuredClone(artifact);altered.data.content='Regenerated approximation';altered.data.content_hash=hashText(altered.data.content);
  assert.throws(()=>scope.update(altered,artifact.revision),error=>code(error,'CONFLICT'));
  assert.equal((scope.get(artifact.id,artifact.revision) as StoredRecord<'artifact'>).data.content,'Exact draft');
}));
test('logical effects deduplicate, reject payload changes and require reconciliation before completion',()=>database((store,scope)=>{
  const records=seed(scope);const input=replaceRefs(newRecord('action'),records);
  let action=scope.create(input) as StoredRecord<'action'>;
  const repeated={...input,id:'another-action-id'};assert.equal(scope.create(repeated).id,action.id);
  const conflicting=structuredClone(repeated);conflicting.data.payload={changed:true};conflicting.data.payload_hash=hashJson(conflicting.data.payload);
  assert.throws(()=>scope.create(conflicting),error=>code(error,'CONFLICT'));
  const issuer=store.forScope({...identity,can_authorize:true});const grantInput=newRecord('authorization');
  grantInput.data={...grantInput.data,operation:action.data.effect_name,resource_id:action.id,destination:action.data.destination,content_hash:action.data.payload_hash};const grant=issuer.create(grantInput);
  action.data.grant_ref=reference(grant);action.data.status='in_flight';action.data.attempts=1;action=scope.update(action,action.revision) as StoredRecord<'action'>;
  action.data.status='unknown';action=scope.update(action,action.revision) as StoredRecord<'action'>;
  const retry=structuredClone(action);retry.data.status='prepared';assert.throws(()=>scope.update(retry,retry.revision),error=>code(error,'CONFLICT'));
  action.data.status='confirmed';action.data.receipt_refs=['synthetic:receipt'];
  assert.throws(()=>scope.update(action,action.revision),error=>code(error,'CONFLICT'));
  action.data.reconciliation='effect_confirmed';const confirmed=scope.update(action,action.revision);
  assert.equal(scope.create(repeated).id,confirmed.id);
  assert.equal(scope.query({kind:'action'}).records.length,1);assert.equal(scope.history(action.id).length,4);
}));
test('unconfirmed effects prevent successful run even when output acceptance is set',()=>database((_store,scope)=>{
  const records=seed(scope,['project','source','job','artifact','action']);
  let run=scope.create(replaceRefs(newRecord('run'),records)) as StoredRecord<'run'>;
  run.data.status='running';run.data.executor_id='worker';run=scope.update(run,run.revision) as StoredRecord<'run'>;
  run.data.status='succeeded';run.data.accepted=true;run.data.output_refs=[reference(records.get('artifact-demo')!)];run.data.action_refs=[reference(records.get('action-demo')!)];
  assert.throws(()=>scope.update(run,run.revision),error=>code(error,'EFFECT_UNKNOWN'));
  assert.equal((scope.get(run.id) as StoredRecord<'run'>).data.status,'running');
  run=scope.get(run.id) as StoredRecord<'run'>;run.data.status='cancel_requested';run=scope.update(run,run.revision) as StoredRecord<'run'>;run.data.status='cancelled';scope.update(run,run.revision);
  assert.equal((scope.get('action-demo') as StoredRecord<'action'>).data.status,'prepared');
}));
test('existing unrelated SQLite databases are rejected without modifying their tables',()=>{
  const directory=mkdtempSync(join(tmpdir(),'mcc-unrelated-')),path=join(directory,'other.sqlite');
  const db=new DatabaseSync(path);db.exec('CREATE TABLE personal_data(value TEXT); INSERT INTO personal_data VALUES (\'preserved\')');db.close();
  try{assert.throws(()=>new SqliteBackend(path),error=>code(error,'INCOMPATIBLE_VERSION'));const verify=new DatabaseSync(path);try{assert.equal(verify.prepare('SELECT value FROM personal_data').get()?.['value'],'preserved');assert.equal(verify.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE name='records'").get()?.['count'],0);}finally{verify.close();}}finally{rmSync(directory,{recursive:true,force:true});}
});
