# Local document backend

M4.1 adds `DocumentBackend`, a second implementation of the scoped entity contract. Each revision is an inspectable JSON document on the local filesystem. SQLite rows, SQL indexes and SQLite journaling are not used by this adapter. The neutral entity model, permissions, opaque references and transition rules are unchanged.

This release exposes a library adapter and an installed-package example. The existing constructor, operational profile, local capture/search commands, workflows and coordinator still use SQLite. Do not change a profile to point at a document directory: a different representation is not an authority transfer. Export/import is M4.2, safe transfer is M4.3, and a second runtime is M4.4.

## Run the example

```bash
npm run build
node examples/document-demo.mjs
```

The example creates a disposable synthetic project, writes a second revision, reopens a read-only connection, queries as a reader and verifies the exact historical and current JSON documents. It removes only its temporary test directory. It does not access the installed personal instance.

For a package consumer:

```js
import { DocumentBackend } from 'manu-control-center/documents';

// The absolute parent directory must already exist on a supported local filesystem.
const backend = new DocumentBackend('/absolute/private-parent/documents');
try {
  const store = backend.forScope({ instance_id: 'demo', actor_id: 'owner' });
  const project = store.create({
    schema_version: '0.1.0-draft', kind: 'project', id: 'project', instance_id: 'demo',
    access: { owner_id: 'owner', readers: [], writers: [] },
    data: { purpose: 'Synthetic document project', status: 'active', responsible: 'owner',
      next_action: null, decision_refs: [], source_refs: [] },
  });
  const updated = store.update({ ...project, data: { ...project.data, next_action: 'Add evidence' } }, project.revision);
  console.log(updated.revision, store.history(project.id).length);
} finally { backend.close(); }
```

The constructor accepts an optional clock and `{ readOnly: true }` as its second and third arguments. Read-only opening requires a complete existing store. Unknown existing directories, unsupported formats and incomplete initialization are rejected without replacement. The host supplies identity and `can_authorize`; neither stored documents nor model output authenticate callers.

## Representation and commit boundary

```text
document-directory/
  HEAD.json
  documents/
    <sha256-of-exact-document-bytes>.json
  .write-lock/                              # only during a write or after interruption
```

`HEAD.json` has format `mcc-documents-v1` and an ordered revision list for each `(instance_id, id)`. The last listed version is current. IDs remain arbitrary model values; they never become filesystem paths. Each document contains one complete stored entity, including its original ID, opaque revision, timestamps, access and data. Content hashes select files; they do not replace revision identities or exact artifact hashes.

Every read loads one published HEAD snapshot and resolves only its listed documents. Historical reads require access to the current record. Queries apply instance and current access filtering before pagination, with UTF-8 binary ID ordering matching SQLite. Returned objects do not share mutable state with persisted documents. Invalid manifests, changed document hashes, missing referenced files, mismatched identities and symlinked store entries fail closed.

A writer acquires an exclusive local directory lock, reloads HEAD, checks current access/revisions and shared domain policy, writes and flushes the new immutable revision, then stages and atomically renames a new HEAD. Record, access and history become visible together. Files not reachable from HEAD cannot become current. Failed validation does not publish a new HEAD. Readers do not acquire the writer lock.

An abrupt process exit before publication leaves the old record visible; an exit after publication leaves the new record visible. Both cases retain the writer lock and reject new writes. There is no timeout-based lock stealing or automatic orphan cleanup. Stop all writers and inspect the published state before any future repair; this adapter deliberately has no recovery command. If an I/O error is reported after publication, inspect the current revision before deciding whether to retry. Process-exit tests do not establish power-loss durability on arbitrary hardware or filesystems.

Supported platform profile: macOS and Linux, one host, local filesystem with exclusive directory creation and atomic same-filesystem rename. Other operating systems are rejected. Network/synced folders, multiple hosts, adversarial direct filesystem writers and automatic rollback detection are outside this profile. The files are private by default but the trusted host can read them directly; hashes and scoped APIs are not an operating-system sandbox. Editing a JSON file directly is unsupported; write through the adapter to obtain a validated revision.

## Capabilities and operational authority

| Capability | Document profile |
|---|---|
| Entities, relations, exact revision reads and history | Implemented through the scoped backend contract. |
| Current access, paginated queries and conditional updates | Implemented and tested with the same suite as SQLite. |
| Atomic writes | One entity, its current access and its history per scoped create/update/link. No public multi-entity transaction API. |
| Grants, decision transitions, exact approved artifacts and logical action identity | Shared domain guards; contract-level operations tested on both backends. |
| Constructor, capture/review composition and coordinator | Not wired to this backend. Existing SQLite instance remains the sole operational authority. |
| Export/import, migration, copy and restore | Not implemented; capability remains false. |
| Distributed fencing or live runtime handoff | Not implemented; capability remains false. |

The document adapter can represent all stored entity kinds, including execution records, but storage of a run does not establish a working coordinator on that backend. No active job is mirrored, imported or executed from a document copy. M4.2–M4.3 must implement the explicit transfer and destination activation mechanisms before advertising that combination. No personal instance is migrated in M4.1.

This bounded first profile scans documents rather than maintaining a secondary search index. Limits are 10,000 committed revisions across the store and 16 MiB for an individual document or HEAD. Exceeding a write limit fails with `CAPABILITY_UNAVAILABLE`; oversized or malformed existing data is rejected. Orphans can consume disk after failures; maintenance is future work.

## Verification

[Shared backend scenarios](../tests/backend.test.ts) run on both SQLite and documents: identities, scopes, pagination, Unicode ordering, revocation, references, source segments, grants, decision promotion, approved bytes, effect identity, reconciliation guards and concurrent conditional writes. [Document-specific scenarios](../tests/document-backend.test.ts) inspect the physical representation, read-only behavior, failed publication, malformed files and actual process exits before/after HEAD publication. The clean package check imports the public adapter and runs the [example](../examples/document-demo.mjs).

[M4.1 evidence](m4.1-verification.json) records tested scope. A19 applies to the shared scoped entity interface. M4's A07/A12/A24/A25 and full construction/runtime combinations remain pending; the shared suite is not proof of transfer or model behavior.
