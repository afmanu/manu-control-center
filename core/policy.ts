import { DomainError } from './errors.js';
import type { StoredRecord } from './models.js';
export interface AuthorizationRequest { instance_id: string; actor_id: string; operation: string; resource_id: string; destination: string; content_hash: string | null }
/** The host supplies authenticated scope and current grants; payloads cannot issue grants. */
export function assertAuthorized(request: AuthorizationRequest, grant: StoredRecord<'authorization'>, now: string): void {
  const time = Date.parse(now), start = Date.parse(grant.data.valid_from), end = Date.parse(grant.data.valid_until);
  if (![time, start, end].every(Number.isFinite)) throw new DomainError('INVALID_INPUT', 'Authorization needs valid timestamps.');
  const value = grant.data;
  if (grant.instance_id !== request.instance_id || value.actor_id !== request.actor_id || value.operation !== request.operation || value.resource_id !== request.resource_id || value.destination !== request.destination || (value.content_hash !== null && value.content_hash !== request.content_hash) || value.revoked || time < start || time >= end) throw new DomainError('FORBIDDEN', 'Authorization does not cover this operation.');
}
