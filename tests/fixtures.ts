import { readFileSync } from 'node:fs';
import type { ContractKind, ContractMap, NewRecord, RecordKind, StoredRecord } from '../core/models.js';
import type { ScopedBackend } from '../core/adapters.js';
const data = JSON.parse(readFileSync(new URL('../../examples/contracts/valid.json', import.meta.url), 'utf8')) as ContractMap;
export const now = '2026-09-08T10:05:00.000Z';
export function fixture<K extends ContractKind>(kind: K): ContractMap[K] { return structuredClone(data[kind]); }
export function newRecord<K extends RecordKind>(kind: K): NewRecord<K> {
  const { schema_version, id, instance_id, access, data } = fixture(kind);
  return { kind, schema_version, id, instance_id, access, data } as NewRecord<K>;
}
export function replaceRefs<T>(input: T, records: Map<string, StoredRecord>): T {
  function walk(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(walk);
    if (!value || typeof value !== 'object') return value;
    const object = value as Record<string, unknown>;
    if (Object.keys(object).length === 2 && typeof object['id'] === 'string' && typeof object['revision'] === 'string') {
      const current = records.get(object['id']);
      if (current) return { id: current.id, revision: current.revision };
    }
    return Object.fromEntries(Object.entries(object).map(([key, item]) => [key, walk(item)]));
  }
  return walk(input) as T;
}
export function seed(scope: ScopedBackend, kinds: RecordKind[] = ['project', 'source', 'job']): Map<string, StoredRecord> {
  const records = new Map<string, StoredRecord>();
  for (const kind of kinds) { const record = scope.create(replaceRefs(newRecord(kind), records)); records.set(record.id, record); }
  return records;
}
