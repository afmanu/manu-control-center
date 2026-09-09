import { randomUUID } from 'node:crypto';
import type { AccessScope } from '../../../core/adapters.js';
import type { NewRecord, StoredRecord, Ref, RecordKind } from '../../../core/models.js';
import { DomainError } from '../../../core/errors.js';
import { assertRecord } from '../../../core/validation.js';
import { assertInitial, assertMutation } from '../../../core/state.js';
import { assertAuthorized } from '../../../core/policy.js';
import { cloneJson, decisionContentHash, hashJson } from '../../../core/hashing.js';

/** Shared domain guards; each backend supplies an access-checked transaction snapshot. */
export class RecordPolicy {
  constructor(private readonly read: (scope: AccessScope, id: string, revision?: string) => StoredRecord, private readonly clock: () => string) {}
  create(scope: AccessScope, input: NewRecord): StoredRecord {
    const now = this.clock();
    const record = assertRecord({ ...cloneJson(input), revision: randomUUID(), created_at: now, updated_at: now } as StoredRecord);
    if (record.instance_id !== scope.instance_id || record.access.owner_id !== scope.actor_id) throw new DomainError('FORBIDDEN', 'Create must use the bound instance and owner.');
    if (record.kind === 'authorization' && !scope.can_authorize) throw new DomainError('FORBIDDEN', 'Only a trusted grant issuer can issue authorization.');
    assertInitial(record);
    return record;
  }
  update(scope: AccessScope, input: StoredRecord, before: StoredRecord): StoredRecord {
    const record = assertRecord({ ...cloneJson(input), revision: randomUUID(), updated_at: this.clock() } as StoredRecord);
    if (Date.parse(record.updated_at) < Date.parse(before.updated_at)) throw new DomainError('CONFLICT', 'Store clock moved backwards.');
    assertMutation(before, record);
    if (before.kind === 'artifact' && record.kind === 'artifact' && before.data.status === 'draft' && record.data.status === 'approved') {
      if (!scope.can_authorize || scope.actor_id !== before.access.owner_id) throw new DomainError('FORBIDDEN', 'Only the trusted artifact owner can approve exact content.');
      record.data.accepted_at = record.updated_at;
    }
    if (scope.actor_id !== before.access.owner_id && hashJson(before.access) !== hashJson(record.access)) throw new DomainError('FORBIDDEN', 'Only the owner can change access.');
    if (record.kind === 'authorization' && !scope.can_authorize) throw new DomainError('FORBIDDEN', 'Only a trusted grant issuer can change authorization.');
    // Cancelling an owned job changes status only; its immutable, previously validated input refs need not remain readable.
    if (!(record.kind === 'job' && record.data.status === 'cancelled' && record.access.owner_id === scope.actor_id)) this.validateReferences(scope, record);
    if (before.kind === 'decision' && record.kind === 'decision' && (before.data.status !== record.data.status || (record.data.status !== 'proposed' && (decisionContentHash(before) !== decisionContentHash(record) || hashJson(before.data.promotion) !== hashJson(record.data.promotion))))) {
      if (!record.data.promotion || record.data.actor_id !== scope.actor_id) throw new DomainError('FORBIDDEN', 'Decision change needs actor and current promotion provenance.');
      record.data.promotion.at = record.updated_at;
      this.checkGrant(scope, record.data.promotion.grant_ref, record, record.data.status === 'active' ? 'decision.promote' : 'decision.change_status', `instance:${scope.instance_id}`, decisionContentHash(record));
    }
    if (record.kind === 'action' && before.kind === 'action' && record.data.status === 'in_flight' && before.data.status !== 'in_flight') {
      if (!record.data.grant_ref) throw new DomainError('AUTH_REQUIRED', 'Effect invocation requires a grant.');
      this.checkGrant(scope, record.data.grant_ref, record, record.data.effect_name, record.data.destination, record.data.payload_hash);
    }
    if (record.kind === 'run' && record.data.status === 'succeeded') for (const reference of record.data.action_refs) {
      const action = this.read(scope, reference.id);
      if (action.kind !== 'action' || action.data.status !== 'confirmed') throw new DomainError('EFFECT_UNKNOWN', 'Run cannot succeed with unconfirmed effects.');
    }
    return record;
  }
  private checkGrant(scope: AccessScope, ref: Ref, record: StoredRecord, operation: string, destination: string, content_hash: string): void {
    const grant = this.read(scope, ref.id);
    if (grant.kind !== 'authorization' || grant.revision !== ref.revision) throw new DomainError('FORBIDDEN', 'Grant is no longer current.');
    assertAuthorized({ instance_id: scope.instance_id, actor_id: scope.actor_id, operation, resource_id: record.id, destination, content_hash }, grant, record.updated_at);
  }
  validateReferences(scope: AccessScope, record: StoredRecord): void {
    const load = (reference: Ref, kind?: RecordKind): StoredRecord => {
      const target = this.read(scope, reference.id, reference.revision);
      if (kind && target.kind !== kind) throw new DomainError('INVALID_INPUT', `Reference must point to ${kind}.`);
      return target;
    };
    const data = record.data;
    if ('project_ref' in data && data.project_ref) load(data.project_ref, 'project');
    if ('source_refs' in data) for (const reference of data.source_refs) load(reference, 'source');
    if ('decision_refs' in data) for (const reference of data.decision_refs) load(reference, 'decision');
    if ('evidence' in data) for (const item of data.evidence) {
      const source = load(item.source, 'source') as StoredRecord<'source'>;
      if (!source.data.segments.some(segment => segment.id === item.segment_id)) throw new DomainError('INVALID_INPUT', 'Evidence segment is unavailable.');
    }
    if (record.kind === 'capture') {
      const source = load(record.data.source_ref, 'source') as StoredRecord<'source'>;
      if (record.data.segment_ids.some(id => !source.data.segments.some(segment => segment.id === id))) throw new DomainError('INVALID_INPUT', 'Capture references unknown segment.');
    }
    if (record.kind === 'relation') { load(record.data.from); load(record.data.to); }
    if ('job_ref' in data) load(data.job_ref, 'job');
    if ('run_ref' in data) load(data.run_ref, 'run');
    if ('input_refs' in data) for (const reference of data.input_refs) load(reference);
    if ('output_refs' in data) for (const reference of data.output_refs) load(reference);
    if ('action_refs' in data) for (const reference of data.action_refs) load(reference, 'action');
    if ('grant_ref' in data && data.grant_ref) load(data.grant_ref, 'authorization');
    if (record.kind === 'decision' && record.data.promotion) load(record.data.promotion.grant_ref, 'authorization');
    if (record.kind === 'run') {
      const job = load(record.data.job_ref, 'job') as StoredRecord<'job'>;
      if (hashJson(job.data.workflow) !== hashJson(record.data.workflow)) throw new DomainError('INVALID_INPUT', 'Run workflow differs from its pinned job.');
      if (record.data.previous_run) {
        const previous = load(record.data.previous_run, 'run') as StoredRecord<'run'>;
        if (previous.data.job_ref.id !== job.id) throw new DomainError('INVALID_INPUT', 'Previous attempt belongs to another job.');
      }
    }
  }
}
