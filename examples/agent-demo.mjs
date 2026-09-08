import assert from 'node:assert/strict';
import { SqliteCoordinatorBackend } from '../dist/adapters/backends/sqlite/coordinator.js';
import { defaultCoordinatorBudget } from '../dist/core/coordinator.js';
import { recordRef } from '../dist/core/knowledge.js';
import { semanticCriteria } from '../dist/core/workflows.js';

// Deterministic packaging/mechanism demonstration. This mock is never real-runtime evidence.
const runtime = { definition: { id: 'synthetic', version: '1' }, inspect: async () => ({ availability: 'available', capabilities: [], evidence_refs: ['mock'] }), invoke: async ({ input }) => ({ output: { classifications: input.meeting ? [{ segment_id: 'body', quote: 'A prototype is proposed.', category: 'proposal' }] : [], statements: [{ text: input.meeting ? 'A prototype is proposed.' : 'The project is active.', evidence_ids: [input.meeting ? 'source-0' : 'project'] }] }, evidence_refs: ['mock:packaging'], metadata: { simulated: true } }) };
const backend = new SqliteCoordinatorBackend(':memory:', undefined, new Map(), {}, new Map([['synthetic', runtime]]));
try {
  const scope = { instance_id: 'synthetic-instance', actor_id: 'synthetic-owner' }, raw = backend.forScope(scope), owner = backend.forCoordinator({ ...scope, can_authorize: true });
  const project = raw.create({ kind: 'project', id: 'synthetic-project', schema_version: '0.1.0-draft', instance_id: scope.instance_id, access: { owner_id: scope.actor_id, readers: [], writers: [] }, data: { purpose: 'Exercise the installed agent workflow contracts.', status: 'active', responsible: scope.actor_id, next_action: null, source_refs: [], decision_refs: [] } });
  const source = backend.forKnowledge(scope).capture({ project_id: project.id, source_id: 'source', request_key: 'capture', locator: 'text:synthetic', content: 'A prototype is proposed.', expected_revision: null }).source_ref;
  const claim = result => owner.claim({ project_id: project.id, run_ref: recordRef(result.run), executor_id: 'mock-worker', lease_ms: 60000 }).lease;
  for (const workflow of ['meeting-to-brief','project-status']) {
    let result = owner.submit({ workflow, project_id: project.id, request_key: workflow, source_policy: 'snapshot', budget: defaultCoordinatorBudget, runtime: runtime.definition, ...(workflow === 'meeting-to-brief' ? { meeting: { source: { ref: source }, selections: [] } } : {}) });
    result = await owner.advance(project.id, claim(result)); assert.equal(result.run.data.status, 'paused');
    result = await owner.advance(project.id, claim(result)); assert.equal(result.run.data.status, 'waiting_input');
    const draft = JSON.parse(result.artifact.data.content); assert.equal(draft.agent.metadata.simulated, true);
    result = owner.review({ project_id: project.id, run_ref: recordRef(result.run), artifact_ref: recordRef(result.artifact), content_hash: result.artifact.data.content_hash, review: { verdict: 'accept', checks: semanticCriteria.map(criterion => ({ criterion, outcome: 'pass', note: 'Deterministic synthetic packaging fixture; this attestation is not real model-quality evidence.' })) } });
    result = await owner.advance(project.id, claim(result)); assert.equal(result.run.data.status, 'succeeded');
  }
  console.log(JSON.stringify({ ok: true, scope: 'mock_runtime_packaging_only', workflows: 2, real_runtime_invoked: false, external_deliveries: 0 }));
} finally { backend.close(); }
