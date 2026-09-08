import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateRecordEnvelope } from '../core/record.js';

const fixture = JSON.parse(readFileSync(new URL('../../examples/record-envelope.json', import.meta.url), 'utf8')) as Record<string, unknown>;

test('accepts opaque identities and revisions without modifying input', () => {
  const input = { ...fixture, id: 'source:opaque/identifier', revision: 'etag-opaque' };
  const before = JSON.stringify(input);
  const result = validateRecordEnvelope(input);
  assert.equal(result.ok, true);
  assert.equal(JSON.stringify(input), before);
  if (result.ok) assert.notEqual(result.value, input);
});

const invalid: [string, unknown][] = [
  ['null input', null],
  ['missing instance identity', Object.fromEntries(Object.entries(fixture).filter(([key]) => key !== 'instance_id'))],
  ['blank identity', { ...fixture, id: '  ' }],
  ['numeric revision', { ...fixture, revision: 1 }],
  ['unknown schema version', { ...fixture, schema_version: '9.0.0' }],
  ['unknown fields', { ...fixture, arbitrary: true }],
  ['invalid calendar date', { ...fixture, created_at: '2026-02-30T09:00:00Z' }],
  ['missing timezone', { ...fixture, created_at: '2026-09-08T09:00:00' }],
  ['unrepresentable leap second', { ...fixture, created_at: '2016-12-31T23:59:60Z' }],
  ['unnormalized offset', { ...fixture, created_at: '2026-09-08T11:00:00+02:00' }],
  ['update before creation', { ...fixture, updated_at: '2026-09-07T09:00:00Z' }],
];
for (const [name, input] of invalid) {
  test(`rejects ${name} with structured issues`, () => {
    const result = validateRecordEnvelope(input);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, 'INVALID_INPUT');
      assert.ok(result.issues.length > 0);
    }
  });
}
