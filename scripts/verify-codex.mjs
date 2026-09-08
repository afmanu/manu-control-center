import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { SqliteCoordinatorBackend } from '../dist/adapters/backends/sqlite/coordinator.js';
import { CodexRuntime, codexDefinition } from '../dist/adapters/runtimes/codex.js';
import { defaultCoordinatorBudget } from '../dist/core/coordinator.js';
import { recordRef } from '../dist/core/knowledge.js';
import { runEvalCase, evaluateMeetingCategories } from '../dist/evals/harness.js';
import { hashJson } from '../dist/core/hashing.js';

// Expected answers stay in this evaluator process. The runtime receives only scoped C19 input.
const outputDirectory = process.argv[2];
if (!outputDirectory) throw new Error('Usage: node scripts/verify-codex.mjs /absolute/evidence-directory [model]');
const destination = resolve(outputDirectory); mkdirSync(destination, { recursive: true });
const runtime = new CodexRuntime(process.argv[3] ? { model: process.argv[3] } : {}), results = [];
const seed = JSON.parse(readFileSync(new URL('../examples/contracts/valid.json', import.meta.url), 'utf8'));
const root = join(destination, 'stores'); mkdirSync(root, { recursive: true });
const scope = { instance_id: 'instance-demo', actor_id: 'alice' };
function plain(kind, data, id = seed[kind].id) { const { schema_version, instance_id, access } = seed[kind]; return { kind, id, schema_version, instance_id, access, data }; }
try {
  for (const name of ['meeting', 'no-decisions', 'conflicting-source', 'injected-source']) {
    const fixture = JSON.parse(readFileSync(new URL(`../examples/${name}.json`, import.meta.url), 'utf8'));
    const evaluated = await runEvalCase(fixture, async input => {
      const path = join(root, `${name}.sqlite`), backend = new SqliteCoordinatorBackend(path, undefined, new Map(), {}, new Map([['codex', runtime]]));
      try {
        const raw = backend.forScope(scope), owner = backend.forCoordinator({ ...scope, can_authorize: true }), worker = backend.forCoordinator(scope);
        let project = raw.create(plain('project', { ...seed.project.data, purpose: input.project.purpose, source_refs: [], decision_refs: [], next_action: null }));
        const source = raw.create(plain('source', { ...seed.source.data, project_ref: recordRef(project), scope: project.id, segments: input.source.segments }, input.source.id));
        project = raw.update({ ...project, data: { ...project.data, source_refs: [recordRef(source)] } }, project.revision);
        const claim = result => worker.claim({ project_id: project.id, run_ref: recordRef(result.run), executor_id: 'codex-evaluation', lease_ms: 60000 }).lease;
        const queued = owner.submit({ workflow: 'meeting-to-brief', project_id: project.id, request_key: name, source_policy: 'fresh', budget: defaultCoordinatorBudget, runtime: codexDefinition, meeting: { source: { ref: recordRef(source) }, selections: [] } });
        const generated = await worker.advance(project.id, claim(queued));
        if (generated.run.data.status !== 'paused') return { fixture: name, run_id: generated.run.id, failed: true, cause: generated.next_action, runtime_step: generated.steps.find(step => step.data.step_id === 'runtime'), semantic_review: { status: 'not_available', notes: [] } };
        const prepared = await worker.advance(project.id, claim(generated)); assert.equal(prepared.run.data.status, 'waiting_input', prepared.next_action);
        assert.equal(raw.query({ kind: 'decision' }).records.length, 0);
        const artifact = JSON.parse(prepared.artifact.data.content), agent = artifact.agent;
        const result = { fixture: name, run_id: prepared.run.id, artifact_ref: recordRef(prepared.artifact), content_hash: prepared.artifact.data.content_hash, draft: artifact, context_hash: hashJson(agent.evidence), metadata: agent.metadata, mechanism: { actual_runtime: true, waiting_for_human_review: true, model_cannot_approve: true, tools_observed: agent.metadata.tools_observed, no_decision_promotion: true, no_external_delivery: true }, semantic_review: { status: 'pending', notes: [] } };
        writeFileSync(join(destination, `${name}.json`), JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });
        return result;
      } finally { backend.close(); }
    }, async (result, expected) => ({ ...result, evaluation: result.failed ? { passed: false, failures: [{ criterion: 'runtime_or_validation_failed' }], semantic_review_required: true } : evaluateMeetingCategories(result.draft.meeting.items, expected) }));
    results.push(evaluated); writeFileSync(join(destination, `${name}.json`), JSON.stringify(evaluated, null, 2) + '\n', { mode: 0o600 });
    console.log(JSON.stringify({ fixture: name, category_passed: evaluated.evaluation.passed, failures: evaluated.evaluation.failures, metadata: evaluated.metadata }));
  }
  // A separate project-status path with active decision and unconfirmed hypothesis.
  const backend = new SqliteCoordinatorBackend(join(root, 'status.sqlite'), undefined, new Map(), {}, new Map([['codex', runtime]]));
  try {
    const raw = backend.forScope(scope), owner = backend.forCoordinator({ ...scope, can_authorize: true }), worker = backend.forCoordinator(scope), review = backend.forReview({ ...scope, can_authorize: true });
    const project = raw.create(plain('project', { ...seed.project.data, purpose: 'Evaluate a fictional prototype', source_refs: [], decision_refs: [], next_action: 'Review the prototype; delivery date is not confirmed.' }));
    const source = backend.forKnowledge(scope).capture({ project_id: project.id, source_id: 'status-source', request_key: 'status-source', locator: 'text:synthetic', content: 'We decided to review the prototype. A chatbot may improve conversion, but this hypothesis has not been tested.', expected_revision: null }).source_ref;
    const evidence = [{ source, segment_id: 'body' }];
    review.save({ kind: 'claim', project_id: project.id, id: 'hypothesis', expected_revision: null, data: { content: 'A chatbot may improve conversion; untested.', epistemic_status: 'hypothesis', evidence } });
    const proposal = review.save({ kind: 'decision', project_id: project.id, id: 'review-prototype', expected_revision: null, data: { choice: 'Review the prototype', alternatives: [], evidence, review_criterion: 'After the review' } });
    const grant = review.grantDecision({ project_id: project.id, id: proposal.id, expected_revision: proposal.revision, grant_id: 'synthetic-decision-grant', operation: 'decision.promote', valid_until: new Date(Date.now()+600000).toISOString() });
    review.changeDecision({ project_id: project.id, id: proposal.id, expected_revision: proposal.revision, grant_ref: recordRef(grant), status: 'active' });
    const claim = result => worker.claim({ project_id: project.id, run_ref: recordRef(result.run), executor_id: 'codex-evaluation', lease_ms: 60000 }).lease;
    const queued = owner.submit({ workflow: 'project-status', project_id: project.id, request_key: 'status', source_policy: 'fresh', budget: defaultCoordinatorBudget, runtime: codexDefinition });
    const generated = await worker.advance(project.id, claim(queued)); assert.equal(generated.run.data.status, 'paused', generated.next_action);
    const prepared = await worker.advance(project.id, claim(generated)); assert.equal(prepared.run.data.status, 'waiting_input', prepared.next_action);
    const result = { fixture: 'project-status', run_id: prepared.run.id, artifact_ref: recordRef(prepared.artifact), content_hash: prepared.artifact.data.content_hash, draft: JSON.parse(prepared.artifact.data.content), semantic_review: { status: 'pending', notes: [] } };
    results.push(result); writeFileSync(join(destination, 'project-status.json'), JSON.stringify(result, null, 2)+'\n', { mode: 0o600 });
    console.log(JSON.stringify({ fixture: 'project-status', actual_runtime: true, metadata: result.draft.agent.metadata }));
  } finally { backend.close(); }
  writeFileSync(join(destination, 'summary.json'), JSON.stringify({ actual_runtime: true, model: process.argv[3] ?? 'codex_default', adapter: codexDefinition, category_cases: results.filter(result => result.evaluation).map(result => ({ fixture: result.fixture, ...result.evaluation })), semantic_review: 'pending_independent_review', real_external_deliveries: 0 }, null, 2)+'\n');
} finally { /* Keep synthetic stores for independent exact review and completion. */ }
