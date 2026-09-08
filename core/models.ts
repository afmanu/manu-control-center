import type { RecordEnvelope } from './record.js';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };
export interface Ref { id: string; revision: string }
export interface VersionRef { id: string; version: string }
export interface Access { owner_id: string; readers: string[]; writers: string[] }
export interface Evidence { source: Ref; segment_id: string }
export interface Budget { max_steps: number; max_attempts: number; timeout_ms: number; max_tokens: number | null; max_cost: number | null }
export type SourcePolicy = 'snapshot' | 'fresh';
export type Ownership = 'managed' | 'shared' | 'user_owned';
export interface Document<K extends string> { kind: K; schema_version: '0.1.0-draft'; id: string }
export interface Definition<K extends string> extends Document<K> { version: string; purpose: string }
export interface Need extends Document<'need'> { instance_id: string; purpose: string; preferences: JsonObject; allowed_effects: string[] }
export interface ModuleDefinition extends Definition<'module'> { dependencies: VersionRef[]; requires_capabilities: string[]; exports: string[] }
export interface Blueprint extends Definition<'blueprint'> { modules: VersionRef[]; required_capabilities: string[]; required_configuration: string[]; entity_kinds: EntityKind[]; acceptance: string[] }
export interface Target { adapter_id: string; version: string; capabilities: string[]; configuration: JsonObject }
export interface InstanceSpec extends Document<'instance_spec'> {
  revision: string; instance_id: string; purpose: string; blueprint: VersionRef; modules: VersionRef[]; kernel: VersionRef;
  targets: { backend: Target; runtime: Target; interface: Target };
  policy: { allowed_effects: string[]; source_policy: SourcePolicy }; secret_refs: string[];
  configuration: JsonObject; overrides: JsonObject;
}
export interface PlanOperation {
  id: string; operation: 'inspect' | 'create' | 'reuse' | 'update' | 'verify'; resource_id: string; adapter_id: string;
  depends_on: string[]; ownership: Ownership; expected_revision: string | null; required_effect: string;
  evidence_requirements: string[]; recovery: string;
}
export interface Plan extends Document<'plan'> { instance_id: string; spec_hash: string; observations: Ref[]; operations: PlanOperation[]; authorization_scope: string[]; verification: string[]; recovery: string }
export interface Manifest extends Document<'manifest'> {
  instance_id: string; revision: string; spec_hash: string; applied_spec: Ref; state: 'partial' | 'installed_unverified' | 'verified';
  resources: { id: string; adapter_id: string; physical_ref: string; ownership: Ownership; revision: string; baseline_hash: string }[];
  overrides: JsonObject; verification: { capability: string; required: boolean; status: 'passed' | 'failed' | 'not_run'; evidence_refs: string[] }[];
}
export interface EntityData {
  project: { purpose: string; status: 'active' | 'paused' | 'completed'; responsible: string; next_action: string | null; decision_refs: Ref[]; source_refs: Ref[] };
  source: { project_ref: Ref | null; locator: string; scope: string; observed_at: string; valid_from: string; valid_to: string | null; authority: 'primary' | 'secondary' | 'unverified'; segments: { id: string; text: string; speaker: string | null }[] };
  capture: { project_ref: Ref; source_ref: Ref; segment_ids: string[]; processing_status: 'pending' | 'integrated' | 'discarded'; dedup_key: string; reason: string | null };
  claim: { project_ref: Ref; content: string; epistemic_status: 'declared' | 'hypothesis' | 'proposed' | 'confirmed' | 'refuted'; evidence: Evidence[]; validity?: { valid_from: string; valid_to: string | null } };
  decision: { project_ref: Ref; choice: string; status: 'proposed' | 'active' | 'superseded' | 'revoked'; actor_id: string; alternatives: string[]; evidence: Evidence[]; review_criterion: string; promotion: { grant_ref: Ref; at: string } | null };
  artifact: { project_ref: Ref; content: string; content_hash: string; status: 'draft' | 'approved'; source_refs: Ref[]; accepted_at: string | null };
  relation: { from: Ref; to: Ref; relation_type: string; evidence: Evidence[] };
}
export type EntityKind = keyof EntityData;
export type RunStatus = 'queued' | 'running' | 'waiting_input' | 'blocked' | 'paused' | 'succeeded' | 'failed' | 'cancel_requested' | 'cancelled';
export type ActionStatus = 'prepared' | 'in_flight' | 'confirmed' | 'failed' | 'unknown' | 'rejected';
export interface StateData {
  authorization: { actor_id: string; operation: string; resource_id: string; destination: string; content_hash: string | null; valid_from: string; valid_until: string; revoked: boolean };
  job: { workflow: VersionRef; input_refs: Ref[]; dedup_key: string; source_policy: SourcePolicy; status: 'queued' | 'active' | 'succeeded' | 'failed' | 'cancelled'; budget: Budget };
  run: { job_ref: Ref; workflow: VersionRef; previous_run: Ref | null; status: RunStatus; executor_id: string | null; checkpoint: JsonObject | null; output_refs: Ref[]; action_refs: Ref[]; accepted: boolean; cause: string | null };
  step: { run_ref: Ref; step_id: string; status: 'pending' | 'running' | 'waiting_input' | 'succeeded' | 'failed' | 'skipped'; input_refs: Ref[]; output_refs: Ref[]; owner_id: string | null; fencing_token: number; checkpoint: JsonObject | null };
  action: { job_ref: Ref; step_id: string; effect_name: string; logical_key: string; destination: string; payload: Json; payload_hash: string; grant_ref: Ref | null; status: ActionStatus; attempts: number; receipt_refs: string[]; reconciliation: 'not_checked' | 'effect_confirmed' | 'no_effect_proven'; result?: JsonObject };
}
export type RecordData = EntityData & StateData;
export type RecordKind = keyof RecordData;
export type StoredRecord<K extends RecordKind = RecordKind> = { [P in K]: RecordEnvelope & { kind: P; access: Access; data: RecordData[P] } }[K];
export type NewRecord<K extends RecordKind = RecordKind> = { [P in K]: Omit<StoredRecord<P>, 'revision' | 'created_at' | 'updated_at'> }[K];
export interface SkillDefinition extends Definition<'skill'> { input_schema: JsonObject; output_schema: JsonObject; allowed_sources: string[]; allowed_tools: VersionRef[]; effects: string[]; dependencies: VersionRef[]; limits: Budget; errors: string[]; evals: string[] }
export interface WorkflowStep {
  id: string; type: 'deterministic' | 'agent' | 'human'; capability: VersionRef; depends_on: string[];
  input_bindings: { name: string; from_step: string | null; output: string }[];
  outputs: string[]; effects: string[]; recovery: 'retry' | 'pause' | 'fail'; acceptance: string[];
}
export interface WorkflowDefinition extends Definition<'workflow'> { input_schema: JsonObject; steps: WorkflowStep[]; output_refs: { step_id: string; output: string }[]; acceptance: string[]; source_policy: SourcePolicy; limits: Budget }
export interface TransferPlan extends Document<'transfer_plan'> {
  source_instance_id: string; target_instance_id: string; mode: 'move' | 'copy' | 'restore';
  authority: { source_host: string; destination_host: string; generation: number; source_frozen: boolean; activate_jobs: boolean };
  records: Ref[]; secret_refs: string[];
  definitions: { ref: VersionRef; kind: 'skill' | 'workflow' | 'validator'; hash: string; content: JsonObject | null; locator: string | null; dependencies: VersionRef[] }[];
}
export interface MeetingInput { project: { id: string; purpose: string }; source: { id: string; revision: string; observed_at: string; segments: { id: string; speaker: string | null; text: string }[] } }
export interface ExpectedBrief { decisions: { meaning: string; source_segment: string }[]; proposals: { meaning: string; source_segment: string }[]; open_questions: { meaning: string; source_segment: string }[]; must_not_assert: string[] }
export interface EvalFixture { kind: 'eval_fixture'; schema_version: '0.1.0-draft'; fixture_id: string; fixture_version: '0.2.0-draft'; synthetic: true; input: MeetingInput; expected: ExpectedBrief }
export type ContractMap = {
  need: Need; module: ModuleDefinition; blueprint: Blueprint; instance_spec: InstanceSpec; plan: Plan; manifest: Manifest;
  skill: SkillDefinition; workflow: WorkflowDefinition; transfer_plan: TransferPlan; eval_fixture: EvalFixture;
} & { [K in RecordKind]: StoredRecord<K> };
export type ContractKind = keyof ContractMap;
