import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { contractSchema } from '../dist/core/schema-definitions.js';
const path = new URL('../schemas/contracts.schema.json', import.meta.url);
if (process.argv.includes('--write')) writeFileSync(path, JSON.stringify(contractSchema, null, 2) + '\n');
assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), contractSchema, 'Schema artifact differs: run npm run schemas:write');
process.stdout.write('Contract schema artifact verified.\n');
