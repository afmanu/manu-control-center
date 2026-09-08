import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { contractSchema } from '../dist/core/schema-definitions.js';
import { requestSchema } from '../dist/builder/planner.js';
for (const [name, schema] of [['contracts.schema.json', contractSchema], ['install-request.schema.json', requestSchema]]) {
  const path = new URL(`../schemas/${name}`, import.meta.url);
  if (process.argv.includes('--write')) writeFileSync(path, JSON.stringify(schema, null, 2) + '\n');
  assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), schema, 'Schema artifact differs: run npm run schemas:write');
}
process.stdout.write('Contract schema artifacts verified.\n');
