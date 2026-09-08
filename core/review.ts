import type { Evidence, Ref, SourcePolicy, StoredRecord } from './models.js';

export type ReviewKind = 'claim' | 'decision' | 'artifact';
export type IntakeStatus = 'declared' | 'hypothesis' | 'proposed';
export type DraftInput = { project_id: string; id: string; expected_revision: string | null } & (
  { kind: 'claim'; data: { content: string; epistemic_status: IntakeStatus; evidence: Evidence[]; validity?: { valid_from: string; valid_to: string | null } } } |
  { kind: 'decision'; data: { choice: string; alternatives: string[]; evidence: Evidence[]; review_criterion: string } } |
  { kind: 'artifact'; data: { content: string; source_refs: Ref[] } }
);
export interface DecisionGrantInput {
  project_id: string; id: string; expected_revision: string; grant_id: string;
  operation: 'decision.promote' | 'decision.change_status'; valid_until: string;
}
export interface DecisionChangeInput {
  project_id: string; id: string; expected_revision: string; grant_ref: Ref;
  status: 'active' | 'superseded' | 'revoked';
}
export interface DecisionGrantRevocationInput { project_id: string; id: string; grant_ref: Ref }
export interface ArtifactApprovalInput { project_id: string; id: string; expected_revision: string; source_policy: SourcePolicy }
export interface ArtifactForkInput { project_id: string; approved_ref: Ref; draft_id: string }
export interface SourceCheckInput { project_id: string; policy: SourcePolicy; refs: Ref[] }
export interface SourceCheck {
  policy: SourcePolicy; refs: Ref[]; invalidate: boolean; changed_source_ids: string[];
  scope: 'source_preflight_only';
}
export interface ReviewQuery { kind: ReviewKind; text?: string; as_of?: string; valid_at?: string; limit?: number; after_id?: string }
export interface ReviewPage {
  records: StoredRecord<ReviewKind>[]; next_cursor: string | null;
  coverage: { recorded_as_of: string; time_basis: 'recorded_history'; valid_at: string | null; claim_validity: 'not_inferred' | 'declared_interval_filter_unknown_excluded'; access: 'current_project_record_and_pinned_sources'; matching: 'literal_case_sensitive' };
}
export interface ReviewStore {
  save(input: DraftInput): StoredRecord<ReviewKind>;
  grantDecision(input: DecisionGrantInput): StoredRecord<'authorization'>;
  revokeDecisionGrant(input: DecisionGrantRevocationInput): StoredRecord<'authorization'>;
  changeDecision(input: DecisionChangeInput): { decision: StoredRecord<'decision'>; project_ref: Ref };
  approveArtifact(input: ArtifactApprovalInput): StoredRecord<'artifact'>;
  forkArtifact(input: ArtifactForkInput): { artifact: StoredRecord<'artifact'>; relation_ref: Ref };
  checkSources(input: SourceCheckInput): SourceCheck;
  query(projectId: string, query: ReviewQuery): ReviewPage;
  record(projectId: string, id: string, kind: ReviewKind, options?: { revision?: string; as_of?: string }): StoredRecord<ReviewKind>;
}
