import type { SourcePolicy, WorkflowDefinition, WorkflowStep } from './models.js';
import { workflowVersion } from './workflows.js';

/** Contracts for the fixed local adapter composition, not a general workflow interpreter. */
export function localWorkflowDefinition(id: 'meeting-to-brief' | 'project-status', policy: SourcePolicy): WorkflowDefinition {
  const stages: { id: string; capability: string; type: WorkflowStep['type']; acceptance: string[]; effects: string[] }[] = [
    { id: 'input', capability: id === 'meeting-to-brief' ? 'capture-or-pin-source' : 'project-snapshot', type: 'deterministic', acceptance: ['authorized-project-and-input'], effects: id === 'meeting-to-brief' ? ['knowledge.capture'] : [] },
    { id: 'context', capability: 'bounded-project-knowledge', type: 'deterministic', acceptance: ['current-access', 'complete-bounded-coverage'], effects: [] },
    { id: 'extract', capability: id === 'meeting-to-brief' ? 'human-classified-quotes' : 'copy-epistemic-labels', type: id === 'meeting-to-brief' ? 'human' : 'deterministic', acceptance: ['no-inferred-authority', 'exact-provenance'], effects: [] },
    { id: 'draft', capability: 'structured-workflow-artifact', type: 'deterministic', acceptance: ['bounded-artifact', 'pinned-context'], effects: ['artifact.draft'] },
    { id: 'evaluate', capability: 'quote-and-coverage-validation', type: 'deterministic', acceptance: ['exact-quotes', 'semantic-review-required'], effects: [] },
    { id: 'review', capability: 'exact-owner-semantic-review', type: 'human', acceptance: ['four-criteria-with-evidence', 'exact-artifact-revision-and-hash'], effects: [] },
    { id: 'complete', capability: 'local-workflow-completion', type: 'deterministic', acceptance: ['current-access-and-policy', 'accepted-artifact-or-explicit-failure'], effects: ['artifact.approve', 'capture.integrate', 'workflow.state'] },
  ];
  return { kind: 'workflow', schema_version: '0.1.0-draft', id, version: workflowVersion,
    purpose: id === 'meeting-to-brief' ? 'Turn a fully classified transcript into a cited brief for explicit owner review.' : 'Summarize persisted project knowledge with its exact authority and uncertainty labels for owner review.',
    input_schema: { type: 'object', additionalProperties: false, required: ['project_id', 'workflow', 'request_key', 'source_policy', ...(id === 'meeting-to-brief' ? ['meeting'] : [])], properties: { project_id: { type: 'string', minLength: 1 }, workflow: { const: id }, request_key: { type: 'string', minLength: 1, maxLength: 512 }, source_policy: { const: policy }, ...(id === 'meeting-to-brief' ? { meeting: { type: 'object' } } : {}) } },
    steps: stages.map((stage, index) => ({ id: stage.id, type: stage.type, capability: { id: stage.capability, version: workflowVersion }, depends_on: index ? [stages[index - 1]!.id] : [], input_bindings: [{ name: 'input', from_step: index ? stages[index - 1]!.id : null, output: index ? 'result' : 'request' }], outputs: ['result'], effects: stage.effects, recovery: stage.type === 'human' ? 'pause' : 'fail', acceptance: stage.acceptance })),
    output_refs: [{ step_id: 'complete', output: 'result' }], acceptance: ['exact-approved-artifact', 'human-semantic-review', 'no-implicit-decision-or-delivery'], source_policy: policy,
    limits: { max_steps: 7, max_attempts: 1, timeout_ms: 30000, max_tokens: null, max_cost: null } };
}

/** Agent synthesis is a bounded computation; the host validates and writes its draft through local effects. */
export function agentWorkflowDefinition(id: 'meeting-to-brief' | 'project-status', policy: SourcePolicy): WorkflowDefinition {
  const base = localWorkflowDefinition(id, policy), version = '0.1.0-agent';
  const runtime: WorkflowStep = { id: 'runtime', type: 'agent', capability: { id: 'knowledge.synthesize', version: '0.1.0' }, depends_on: [], input_bindings: [{ name: 'context', from_step: null, output: 'authorized_snapshot' }], outputs: ['validated_synthesis'], effects: [], recovery: 'fail', acceptance: ['closed-output-schema', 'exact-quotes-and-coverage', 'authorized-citation-identities', 'human-semantic-review-still-required'] };
  return { ...base, version, input_schema: { ...base.input_schema, required: [...base.input_schema['required'] as string[], 'runtime'], properties: { ...base.input_schema['properties'] as object, runtime: { type: 'object', additionalProperties: false, required: ['id', 'version'], properties: { id: { type: 'string', minLength: 1 }, version: { type: 'string', minLength: 1 } } } } }, purpose: `Generate a cited ${id} draft through a registered runtime, then validate and obtain exact human approval.`, steps: [runtime, ...base.steps.map((step, index) => ({ ...step, ...(index === 0 ? { depends_on: ['runtime'], input_bindings: [{ name: 'input', from_step: 'runtime', output: 'validated_synthesis' }] } : {}), ...(step.id === 'extract' ? { type: 'deterministic' as const, capability: { id: 'validated-runtime-classification', version } } : {}) }))], limits: { ...base.limits, max_steps: 8, max_attempts: 3, timeout_ms: 180000 } };
}
