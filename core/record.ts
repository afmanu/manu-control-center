import { readFileSync } from 'node:fs';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';

export interface RecordEnvelope {
  schema_version: '0.1.0-draft';
  id: string;
  instance_id: string;
  revision: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export type RecordValidation =
  | { ok: true; value: RecordEnvelope }
  | { ok: false; code: 'INVALID_INPUT'; issues: ValidationIssue[] };

const schema = JSON.parse(readFileSync(new URL('../../schemas/record-envelope.schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: true, ownProperties: true });
addFormats.default(ajv);
const validate = ajv.compile<RecordEnvelope>(schema);

/** Validates only the record envelope. Entity semantics and access belong to M1. */
export function validateRecordEnvelope(input: unknown): RecordValidation {
  if (!validate(input)) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      issues: (validate.errors ?? []).map(error => ({
        path: error.instancePath || '/',
        message: error.message ?? 'Invalid value',
      })),
    };
  }
  const created = Date.parse(input.created_at);
  const updated = Date.parse(input.updated_at);
  if (!Number.isFinite(created) || !Number.isFinite(updated)) {
    return { ok: false, code: 'INVALID_INPUT', issues: [{ path: '/', message: 'timestamps must be representable UTC dates' }] };
  }
  if (updated < created) {
    return { ok: false, code: 'INVALID_INPUT', issues: [{ path: '/updated_at', message: 'must not precede created_at' }] };
  }
  return { ok: true, value: { ...input } };
}
