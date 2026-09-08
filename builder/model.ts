import type { Blueprint, InstanceSpec, Manifest, ModuleDefinition, NewRecord, Ownership, Plan, StoredRecord } from '../core/models.js';

export interface InstallRequest {
  kind: 'install_request'; schema_version: '0.1.0-draft'; instance_id: string; purpose: string; owner_id: string;
  project: { id: string; purpose: string };
  runtime: 'unconfigured' | 'codex' | 'claude-code';
  adoption: { revision: string; ownership: 'shared' | 'user_owned' } | null;
}
export interface Catalog { blueprint: Blueprint; modules: ModuleDefinition[] }
export interface ResourceObservation { id: string; revision: string; hash: string }
export interface Inspection {
  instance_id: string; owner_id: string; destination: string; store_exists: boolean;
  installation_revision: string | null; resources: ResourceObservation[]; project: StoredRecord<'project'> | null;
}
export interface CapabilityCheck { capability: string; required: boolean; status: 'passed' | 'failed' | 'not_run'; evidence_refs: string[] }
export interface InstallPlan {
  kind: 'installation_plan'; format_version: 1; request: InstallRequest; catalog: Catalog;
  spec: InstanceSpec; plan: Plan; observation: Inspection; digest: string;
}
export interface InstallAuthority {
  actor_id: string; instance_id: string; plan_digest: string; destination: string; effects: string[]; valid_until: string;
}
export interface ResourceReceipt extends ResourceObservation { ownership: Ownership; physical_ref: string }
export interface InstallationState {
  format_version: 1; owner_id: string; revision: string; installation: InstallPlan;
  authorizations: InstallAuthority[]; completed: string[]; receipts: ResourceReceipt[]; manifest: Manifest;
}
export interface ApplyHooks {
  /** Fault-injection/observation points for hosts; never serialized in a plan. */
  beforeCheckpoint?: (operationId: string) => void;
  afterCheckpoint?: (operationId: string) => void;
}
export type InitialProject = NewRecord<'project'>;
