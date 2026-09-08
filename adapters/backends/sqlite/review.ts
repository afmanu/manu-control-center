import { SqliteKnowledgeBackend } from './knowledge.js';
import { versionArguments, versionSelection } from './temporal.js';
import { DomainError } from '../../../core/errors.js';
import { decisionContentHash, hashJson, hashText } from '../../../core/hashing.js';
import { readProject, recordRef, requiredText, validateCaptureText } from '../../../core/knowledge.js';
import { assertAsOf, assertInstant } from '../../../core/time.js';
import { resolveSourceVersions } from '../../../core/state.js';
import type { AccessScope, ScopedBackend } from '../../../core/adapters.js';
import type { Access, Evidence, NewRecord, Ref, StoredRecord } from '../../../core/models.js';
import type { ArtifactApprovalInput, ArtifactForkInput, DecisionChangeInput, DecisionGrantInput, DecisionGrantRevocationInput, DraftInput, ReviewKind, ReviewQuery, ReviewStore, SourceCheckInput } from '../../../core/review.js';

function fields(value: unknown, names: string[]): void {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== [...names].sort().join(',')) throw new DomainError('INVALID_INPUT', 'Invalid knowledge operation fields.');
}
function reference(value: Ref): void { fields(value, ['id', 'revision']); requiredText(value.id, 'reference id'); requiredText(value.revision, 'reference revision'); }
function references(value: Ref[]): void {
  if (!Array.isArray(value) || value.length > 100) throw new DomainError('INVALID_INPUT', 'Use at most 100 source references.');
  value.forEach(reference);
  if (new Set(value.map(ref => ref.id)).size !== value.length) throw new DomainError('INVALID_INPUT', 'Source identities must be unique.');
}
function evidence(value: Evidence[]): void {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) throw new DomainError('INVALID_INPUT', 'Provide 1 to 100 evidence segments.');
  for (const item of value) { fields(item, ['source', 'segment_id']); reference(item.source); requiredText(item.segment_id, 'segment_id'); }
  if (new Set(value.map(item => hashJson(item))).size !== value.length) throw new DomainError('INVALID_INPUT', 'Evidence segments must be unique.');
}
function knownRevision(record: StoredRecord, revision: string): void {
  requiredText(revision, 'expected_revision');
  if (record.revision !== revision) throw new DomainError('CONFLICT', 'Record revision changed.', { current_revision: record.revision });
}
function intersection(project: Access, sources: { access: Access }[]): Access {
  const allowed = sources.map(source => new Set([source.access.owner_id, ...source.access.readers, ...source.access.writers]));
  const retain = (ids: string[]) => ids.filter(id => allowed.every(actors => actors.has(id)));
  return { owner_id: project.owner_id, readers: retain(project.readers), writers: retain(project.writers) };
}
function dependencies(record: StoredRecord<ReviewKind>): Ref[] { return record.kind === 'artifact' ? record.data.source_refs : record.data.evidence.map(item => item.source); }

export class SqliteReviewBackend extends SqliteKnowledgeBackend {
  forReview(input: AccessScope): ReviewStore {
    const scope = Object.freeze({ ...input }), store = this.forScope(scope);
    return {
      save: value => this.transaction(() => this.saveDraft(scope, store, value)),
      grantDecision: value => this.transaction(() => this.grant(scope, store, value)),
      revokeDecisionGrant: value => this.transaction(() => this.revokeGrant(scope, store, value)),
      changeDecision: value => this.transaction(() => this.change(scope, store, value)),
      approveArtifact: value => this.transaction(() => this.approve(scope, store, value)),
      forkArtifact: value => this.transaction(() => this.fork(scope, store, value)),
      checkSources: value => this.snapshot(() => this.sourceCheck(scope, store, value)),
      query: (project, query) => this.snapshot(() => this.queryRecords(scope, store, project, query)),
      record: (project, id, kind, options = {}) => this.snapshot(() => {
        if (!options || Object.keys(options).some(key => !['revision', 'as_of'].includes(key))) throw new DomainError('INVALID_INPUT', 'Invalid record read options.');
        return this.reviewRecord(scope, store, project, id, kind, options.revision, options.as_of);
      }),
    };
  }
  private owner(scope: AccessScope, store: ScopedBackend, projectId: string) {
    const project = readProject(store, projectId);
    if (project.access.owner_id !== scope.actor_id) throw new DomainError('FORBIDDEN', 'Knowledge changes require the project owner.');
    return project;
  }
  private reviewRecord(scope: AccessScope, store: ScopedBackend, project: string, id: string, kind: ReviewKind, revision?: string, asOf?: string): StoredRecord<ReviewKind> {
    if (!['claim', 'decision', 'artifact'].includes(kind)) throw new DomainError('INVALID_INPUT', 'Choose claim, decision or artifact.');
    this.projectVersion(store, scope, project, asOf);
    const current = store.get(id);
    if (current.kind !== kind || !('project_ref' in current.data) || current.data.project_ref?.id !== project) throw new DomainError('NOT_FOUND', 'Knowledge record is unavailable in this project.');
    const record = this.recordVersion(store, scope, id, revision, asOf) as StoredRecord<ReviewKind>;
    if (record.kind !== kind || record.data.project_ref.id !== project) throw new DomainError('NOT_FOUND', 'Knowledge version is unavailable in this project.');
    for (const ref of dependencies(record)) {
      const source = this.sourceRecord(store, scope, project, ref.id, ref.revision);
      if (asOf && Date.parse(source.updated_at) > Date.parse(asOf)) throw new DomainError('NOT_FOUND', 'Pinned evidence was not recorded at the requested time.');
    }
    return record;
  }
  private saveDraft(scope: AccessScope, store: ScopedBackend, input: DraftInput): StoredRecord<ReviewKind> {
    fields(input, ['kind', 'project_id', 'id', 'expected_revision', 'data']);
    requiredText(input.id, 'id');
    if (input.expected_revision !== null) requiredText(input.expected_revision, 'expected_revision');
    if (input.kind === 'claim') {
      fields(input.data, ['content', 'epistemic_status', 'evidence', ...(input.data && typeof input.data === 'object' && 'validity' in input.data ? ['validity'] : [])]); validateCaptureText(input.data.content); evidence(input.data.evidence);
      if (input.data.validity !== undefined) {
        fields(input.data.validity, ['valid_from', 'valid_to']); assertInstant(input.data.validity.valid_from, 'valid_from');
        if (input.data.validity.valid_to !== null) assertInstant(input.data.validity.valid_to, 'valid_to');
      }
      if (!['declared', 'hypothesis', 'proposed'].includes(input.data.epistemic_status)) throw new DomainError('FORBIDDEN', 'Intake cannot confirm or refute claims.');
    } else if (input.kind === 'decision') {
      fields(input.data, ['choice', 'alternatives', 'evidence', 'review_criterion']); validateCaptureText(input.data.choice); evidence(input.data.evidence); requiredText(input.data.review_criterion, 'review_criterion', 4096);
      if (!Array.isArray(input.data.alternatives) || input.data.alternatives.length > 100) throw new DomainError('INVALID_INPUT', 'Use at most 100 alternatives.');
      input.data.alternatives.forEach(value => requiredText(value, 'alternative', 4096));
    } else if (input.kind === 'artifact') {
      fields(input.data, ['content', 'source_refs']); if (input.data.content !== '') validateCaptureText(input.data.content); references(input.data.source_refs);
    } else throw new DomainError('INVALID_INPUT', 'Unknown draft kind.');
    const project = this.owner(scope, store, input.project_id);
    const refs = input.kind === 'artifact' ? input.data.source_refs : input.data.evidence.map(item => item.source);
    const sources = refs.map(ref => this.sourceRecord(store, scope, project.id, ref.id, ref.revision));
    const current = input.expected_revision === null ? null : this.reviewRecord(scope, store, project.id, input.id, input.kind);
    if (current) {
      knownRevision(current, input.expected_revision!);
      if (current.access.owner_id !== scope.actor_id || (current.kind === 'decision' && current.data.status !== 'proposed') || (current.kind === 'artifact' && current.data.status !== 'draft') || (current.kind === 'claim' && !['declared', 'hypothesis', 'proposed'].includes(current.data.epistemic_status))) throw new DomainError('CONFLICT', 'Only owner-held drafts and unconfirmed claims can be edited through intake.');
    }
    const projectRef = current?.data.project_ref ?? recordRef(project);
    const data = input.kind === 'artifact' ? { ...input.data, project_ref: projectRef, content_hash: hashText(input.data.content), status: 'draft', accepted_at: null }
      : input.kind === 'decision' ? { ...input.data, project_ref: projectRef, status: 'proposed', actor_id: scope.actor_id, promotion: null } : { ...input.data, project_ref: projectRef };
    // Subsequent edits never silently expand a record's explicitly narrowed access.
    const access = intersection(current?.access ?? project.access, [project, ...sources.map(source => store.get(source.id))]);
    if (current) return store.update({ ...current, data, access } as StoredRecord, current.revision) as StoredRecord<ReviewKind>;
    return store.create({ kind: input.kind, schema_version: '0.1.0-draft', id: input.id, instance_id: scope.instance_id, access, data } as NewRecord) as StoredRecord<ReviewKind>;
  }
  private grant(scope: AccessScope, store: ScopedBackend, input: DecisionGrantInput): StoredRecord<'authorization'> {
    fields(input, ['project_id', 'id', 'expected_revision', 'grant_id', 'operation', 'valid_until']);
    if (!scope.can_authorize) throw new DomainError('FORBIDDEN', 'Only a trusted grant issuer can authorize a decision.');
    this.owner(scope, store, input.project_id); requiredText(input.grant_id, 'grant_id');
    const record = this.reviewRecord(scope, store, input.project_id, input.id, 'decision') as StoredRecord<'decision'>;
    knownRevision(record, input.expected_revision); assertInstant(input.valid_until, 'valid_until');
    if (!['decision.promote', 'decision.change_status'].includes(input.operation) || record.data.status !== (input.operation === 'decision.promote' ? 'proposed' : 'active')) throw new DomainError('CONFLICT', 'Grant operation does not match the current decision state.');
    const now = this.observedClock();
    if (Date.parse(input.valid_until) <= Date.parse(now)) throw new DomainError('INVALID_INPUT', 'Grant expiry must be in the future.');
    const data = { actor_id: scope.actor_id, operation: input.operation, resource_id: record.id, destination: `instance:${scope.instance_id}`, content_hash: decisionContentHash(record), valid_from: now, valid_until: input.valid_until, revoked: false };
    let existing: StoredRecord | null = null;
    try { existing = store.get(input.grant_id); } catch (error) { if (!(error instanceof DomainError && error.code === 'NOT_FOUND')) throw error; }
    if (existing) {
      if (existing.kind !== 'authorization' || hashJson({ ...existing.data, valid_from: now }) !== hashJson(data)) throw new DomainError('CONFLICT', 'Grant identity belongs to a different authorization.');
      return existing;
    }
    return store.create({ kind: 'authorization', schema_version: '0.1.0-draft', id: input.grant_id, instance_id: scope.instance_id, access: { owner_id: scope.actor_id, readers: [], writers: [] }, data }) as StoredRecord<'authorization'>;
  }
  private change(scope: AccessScope, store: ScopedBackend, input: DecisionChangeInput) {
    fields(input, ['project_id', 'id', 'expected_revision', 'grant_ref', 'status']); reference(input.grant_ref);
    if (!['active', 'superseded', 'revoked'].includes(input.status)) throw new DomainError('INVALID_INPUT', 'Invalid decision status change.');
    let project = this.owner(scope, store, input.project_id);
    const current = this.reviewRecord(scope, store, project.id, input.id, 'decision') as StoredRecord<'decision'>; knownRevision(current, input.expected_revision);
    const authorization = store.get(input.grant_ref.id);
    if (authorization.kind !== 'authorization' || authorization.data.content_hash !== decisionContentHash(current)) throw new DomainError('FORBIDDEN', 'Decision review requires authorization for this exact content.');
    if (current.data.status === input.status) throw new DomainError('CONFLICT', 'Decision already has this status; read its current revision.');
    const decision = store.update({ ...current, data: { ...current.data, status: input.status, promotion: { grant_ref: input.grant_ref, at: this.observedClock() } } }, current.revision) as StoredRecord<'decision'>;
    let refs = project.data.decision_refs.filter(ref => ref.id !== decision.id);
    if (decision.data.status === 'active') refs = [...refs, recordRef(decision)];
    project = store.update({ ...project, data: { ...project.data, decision_refs: refs } }, project.revision) as StoredRecord<'project'>;
    return { decision, project_ref: recordRef(project) };
  }
  private revokeGrant(scope: AccessScope, store: ScopedBackend, input: DecisionGrantRevocationInput): StoredRecord<'authorization'> {
    fields(input, ['project_id', 'id', 'grant_ref']); reference(input.grant_ref);
    if (!scope.can_authorize) throw new DomainError('FORBIDDEN', 'Only a trusted grant issuer can revoke authorization.');
    this.owner(scope, store, input.project_id);
    const decision = store.get(input.id), grant = store.get(input.grant_ref.id);
    if (decision.kind !== 'decision' || decision.data.project_ref.id !== input.project_id || grant.kind !== 'authorization' || grant.data.resource_id !== decision.id || !['decision.promote', 'decision.change_status'].includes(grant.data.operation)) throw new DomainError('FORBIDDEN', 'Grant is outside this decision scope.');
    knownRevision(grant, input.grant_ref.revision);
    if (grant.data.revoked) return grant;
    return store.update({ ...grant, data: { ...grant.data, revoked: true } }, grant.revision) as StoredRecord<'authorization'>;
  }
  private sourceCheck(scope: AccessScope, store: ScopedBackend, input: SourceCheckInput) {
    fields(input, ['project_id', 'policy', 'refs']); references(input.refs); readProject(store, input.project_id);
    if (!['snapshot', 'fresh'].includes(input.policy)) throw new DomainError('INVALID_INPUT', 'Choose snapshot or fresh source policy.');
    const pinned = input.refs.map(ref => this.sourceRecord(store, scope, input.project_id, ref.id, ref.revision));
    const current = input.refs.map(ref => this.sourceRecord(store, scope, input.project_id, ref.id));
    const resolved = resolveSourceVersions(input.policy, input.refs, current.map(recordRef), [...pinned, ...current].map(recordRef));
    return { policy: input.policy, ...resolved, changed_source_ids: current.filter((record, index) => record.revision !== input.refs[index]!.revision).map(record => record.id), scope: 'source_preflight_only' as const };
  }
  private approve(scope: AccessScope, store: ScopedBackend, input: ArtifactApprovalInput): StoredRecord<'artifact'> {
    fields(input, ['project_id', 'id', 'expected_revision', 'source_policy']);
    if (!scope.can_authorize) throw new DomainError('FORBIDDEN', 'Artifact approval requires the trusted owner approval entry point.');
    this.owner(scope, store, input.project_id);
    const record = this.reviewRecord(scope, store, input.project_id, input.id, 'artifact') as StoredRecord<'artifact'>; knownRevision(record, input.expected_revision);
    if (record.data.status !== 'draft') throw new DomainError('CONFLICT', 'Only a draft can be approved.');
    const checked = this.sourceCheck(scope, store, { project_id: input.project_id, policy: input.source_policy, refs: record.data.source_refs });
    if (checked.invalidate) throw new DomainError('STALE_PLAN', 'Sources changed; revise and review the draft before approval.', { changed_source_ids: checked.changed_source_ids });
    return store.update({ ...record, data: { ...record.data, status: 'approved', accepted_at: this.observedClock() } }, record.revision) as StoredRecord<'artifact'>;
  }
  private fork(scope: AccessScope, store: ScopedBackend, input: ArtifactForkInput) {
    fields(input, ['project_id', 'approved_ref', 'draft_id']); reference(input.approved_ref); requiredText(input.draft_id, 'draft_id');
    const project = this.owner(scope, store, input.project_id);
    const approved = this.reviewRecord(scope, store, project.id, input.approved_ref.id, 'artifact', input.approved_ref.revision) as StoredRecord<'artifact'>;
    if (approved.data.status !== 'approved') throw new DomainError('CONFLICT', 'Fork requires an exact approved artifact revision.');
    const sources = approved.data.source_refs.map(ref => this.sourceRecord(store, scope, project.id, ref.id));
    const artifact = store.create({ kind: 'artifact', schema_version: '0.1.0-draft', id: input.draft_id, instance_id: scope.instance_id, access: intersection(approved.access, [project, ...sources]), data: { ...approved.data, status: 'draft', accepted_at: null } }) as StoredRecord<'artifact'>;
    const relation = store.link({ kind: 'relation', schema_version: '0.1.0-draft', id: `relation:${hashJson(['artifact-fork-v1', scope.instance_id, input.approved_ref, artifact.id])}`, instance_id: scope.instance_id, access: structuredClone(artifact.access), data: { from: recordRef(artifact), to: input.approved_ref, relation_type: 'revision_of', evidence: [] } });
    return { artifact, relation_ref: recordRef(relation) };
  }
  private queryRecords(scope: AccessScope, store: ScopedBackend, projectId: string, query: ReviewQuery) {
    if (!query || Object.keys(query).some(key => !['kind', 'text', 'as_of', 'valid_at', 'limit', 'after_id'].includes(key)) || !['claim', 'decision', 'artifact'].includes(query.kind)) throw new DomainError('INVALID_INPUT', 'Invalid knowledge query.');
    const limit = query.limit ?? 20;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new DomainError('INVALID_INPUT', 'Page limit must be an integer from 1 to 100.');
    if (query.text !== undefined) requiredText(query.text, 'text', 2000);
    if (query.after_id !== undefined) requiredText(query.after_id, 'after_id');
    if (query.as_of !== undefined) assertAsOf(query.as_of, this.observedClock());
    if (query.valid_at !== undefined) {
      assertInstant(query.valid_at, 'valid_at');
      if (query.kind !== 'claim') throw new DomainError('INVALID_INPUT', 'Declared claim validity applies only to claim queries.');
    }
    this.projectVersion(store, scope, projectId, query.as_of);
    // Every pinned dependency must still be accessible, before matching and LIMIT.
    const rows = this.db.prepare(`WITH selected AS (${versionSelection(query.as_of)})
      SELECT r.id,r.document FROM selected r
      JOIN records c ON c.instance_id=r.instance_id AND c.id=r.id AND json_extract(c.document,'$.data.project_ref.id')=?
      JOIN access a ON a.instance_id=r.instance_id AND a.id=r.id AND a.actor_id=?
      WHERE json_extract(r.document,'$.kind')=? AND json_extract(r.document,'$.data.project_ref.id')=?
      AND (? IS NULL OR r.id>?) AND (? IS NULL OR instr(coalesce(json_extract(r.document,'$.data.content'),json_extract(r.document,'$.data.choice')),?)>0)
      AND (? IS NULL OR (mcc_timestamp(json_extract(r.document,'$.data.validity.valid_from'))<=? AND (json_extract(r.document,'$.data.validity.valid_to') IS NULL OR mcc_timestamp(json_extract(r.document,'$.data.validity.valid_to'))>?)))
      AND NOT EXISTS (
        SELECT 1 FROM json_each(CASE WHEN json_extract(r.document,'$.kind')='artifact' THEN json_extract(r.document,'$.data.source_refs') ELSE json_extract(r.document,'$.data.evidence') END) d
        WHERE NOT EXISTS (
          SELECT 1 FROM records s JOIN access sa ON sa.instance_id=s.instance_id AND sa.id=s.id AND sa.actor_id=?
          JOIN history h ON h.instance_id=s.instance_id AND h.id=s.id
          WHERE s.instance_id=r.instance_id AND s.kind='source' AND json_extract(s.document,'$.data.project_ref.id')=?
          AND s.id=coalesce(json_extract(d.value,'$.source.id'),json_extract(d.value,'$.id'))
          AND h.revision=coalesce(json_extract(d.value,'$.source.revision'),json_extract(d.value,'$.revision'))
          AND json_extract(h.document,'$.data.project_ref.id')=?
          AND (? IS NULL OR mcc_timestamp(json_extract(h.document,'$.updated_at'))<=?)
        )
      ) ORDER BY r.id LIMIT ?`).all(...versionArguments(scope.instance_id, query.as_of), projectId, scope.actor_id, query.kind, projectId, query.after_id ?? null, query.after_id ?? null, query.text ?? null, query.text ?? null, query.valid_at ?? null, query.valid_at ? Date.parse(query.valid_at) : null, query.valid_at ? Date.parse(query.valid_at) : null, scope.actor_id, projectId, projectId, query.as_of ?? null, query.as_of ? Date.parse(query.as_of) : null, limit + 1);
    const records = rows.slice(0, limit).map(row => JSON.parse(String(row['document'])) as StoredRecord<ReviewKind>);
    return { records, next_cursor: rows.length > limit ? records.at(-1)!.id : null, coverage: { recorded_as_of: query.as_of ?? this.observedClock(), time_basis: 'recorded_history' as const, valid_at: query.valid_at ?? null, claim_validity: query.valid_at ? 'declared_interval_filter_unknown_excluded' as const : 'not_inferred' as const, access: 'current_project_record_and_pinned_sources' as const, matching: 'literal_case_sensitive' as const } };
  }
}
