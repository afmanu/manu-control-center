import type { NewRecord, StoredRecord, RecordKind, Ref, JsonObject, VersionRef, Json } from './models.js';
/** Trusted host scope, not identity inferred from a source or an LLM payload. */
export interface AccessScope { instance_id: string; actor_id: string; can_authorize?: boolean }
export interface BackendCapabilities { conditional_writes: boolean; atomic_writes: boolean; history: boolean; scoped_queries: boolean; export_import: boolean; distributed_fencing: boolean }
export interface Query { kind?: RecordKind; limit?: number; after_id?: string }
export interface ScopedBackend {
  get(id: string, revision?: string): StoredRecord;
  query(query?: Query): { records: StoredRecord[]; next_cursor: string | null };
  create(record: NewRecord): StoredRecord;
  update(record: StoredRecord, expectedRevision: string): StoredRecord;
  history(id: string): StoredRecord[];
  link(record: NewRecord<'relation'>): StoredRecord<'relation'>;
}
export interface BackendAdapter { capabilities: BackendCapabilities; forScope(scope: AccessScope): ScopedBackend; close(): void }
export interface RuntimeAdapter {
  definition: VersionRef;
  inspect(): Promise<{ availability: 'available' | 'unavailable' | 'not_verified'; capabilities: string[]; evidence_refs: string[] }>;
  invoke(input: { scope: AccessScope; capability: VersionRef; input: JsonObject; source_refs: Ref[] }): Promise<{ output: Json; evidence_refs: string[] }>;
}
export interface ToolAdapter {
  definition: VersionRef; effects: string[]; idempotency: 'destination_key' | 'reconcile' | 'none';
  invoke(input: { scope: AccessScope; operation: string; payload: Json; idempotency_key: string }): Promise<{ status: 'confirmed' | 'failed' | 'unknown'; receipt_refs: string[] }>;
  reconcile(key: string): Promise<{ status: 'confirmed' | 'no_effect_proven' | 'unknown'; receipt_refs: string[] }>;
}
