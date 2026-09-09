import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DocumentBackend } from '../dist/adapters/backends/documents/store.js';

const root = mkdtempSync(join(tmpdir(), 'mcc-document-demo-'));
const path = join(root, 'store');
const identity = { instance_id: 'document-demo', actor_id: 'owner' };
let backend;
try {
  backend = new DocumentBackend(path);
  const store = backend.forScope(identity);
  const project = store.create({
    schema_version: '0.1.0-draft', kind: 'project', id: 'project', instance_id: identity.instance_id,
    access: { owner_id: identity.actor_id, readers: ['reader'], writers: [] },
    data: { purpose: 'Demonstrate local document persistence.', status: 'active', responsible: 'owner', next_action: null, decision_refs: [], source_refs: [] },
  });
  const updated = store.update({ ...project, data: { ...project.data, next_action: 'Inspect the stored document.' } }, project.revision);
  backend.close(); backend = new DocumentBackend(path, undefined, { readOnly: true });
  const reader = backend.forScope({ ...identity, actor_id: 'reader' });
  assert.deepEqual(reader.get(project.id, project.revision), project);
  assert.deepEqual(reader.get(project.id), updated);
  assert.equal(reader.history(project.id).length, 2);
  assert.equal(reader.query({ kind: 'project' }).records.length, 1);
  const head = JSON.parse(readFileSync(join(path, 'HEAD.json'), 'utf8'));
  const document = JSON.parse(readFileSync(join(path, 'documents', head.entries[0].versions.at(-1) + '.json'), 'utf8'));
  assert.deepEqual(document, updated);
  assert.deepEqual(readdirSync(path).sort(), ['HEAD.json', 'documents']);
  console.log(JSON.stringify({ ok: true, backend: 'mcc-documents-v1', opaque_revisions: true, exact_historical_read: true, scoped_query: true, document_representation: true, operational_coordinator: false, export_import: false }));
} finally { backend?.close(); rmSync(root, { recursive: true, force: true }); }
