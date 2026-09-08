# Local capture and source queries — M3.1

M3.1 adds explicit text/file capture, revision retrieval, literal search and project context to an existing foundation. M3.2 extends these APIs with temporal selectors and a separate [review entry point](review.md) for claims, decisions and artifacts. It works from the CLI without a model. Sources remain unverified and standalone captures remain pending. M3.3 [local workflows](workflows.md) can integrate a capture into an exact approved artifact after explicit human classification and semantic review. Runtime interpretation follows in M3.5. See [roadmap](implementation-plan.md) and [verification evidence](m3.1-verification.json).

## Try it with synthetic data

From a built checkout, create a disposable instance outside the repository:

```bash
npm run build
mcc_demo=$(mktemp -d)
mcc_request="$PWD/examples/install-request.json"
mcc_instance="$mcc_demo/instance"
node dist/cli/main.js create "$mcc_request" "$mcc_instance" --actor local-user
node dist/cli/main.js capture "$mcc_request" "$mcc_instance" demo-notes \
  --actor local-user --key demo-notes-1 --file "$PWD/examples/local-source.txt"
node dist/cli/main.js search "$mcc_request" "$mcc_instance" 'offline mode' --actor local-user
node dist/cli/main.js context "$mcc_request" "$mcc_instance" --actor local-user
node dist/cli/main.js source "$mcc_request" "$mcc_instance" demo-notes --actor local-user
node dist/cli/main.js source-history "$mcc_request" "$mcc_instance" demo-notes --actor local-user
```

The [example](../examples/local-source.txt) is synthetic. Outputs are JSON. To pipe clean JSON, use `node dist/cli/main.js` or the installed `manu-control-center` binary; `npm start` prints npm headers. Add `--lang es` before the command for Spanish help/error summaries. Text may be in Spanish or any valid Unicode language and retains its exact value.

For text entered directly, replace `--file ...` with `--text 'Synthetic project note'`. Specify exactly one. Flag values are literal: `--text --lang` captures the string `--lang`; it does not select a locale. Put global language selection before the command or after its required positional arguments.

## Commands and results

All commands take the original installation request and the absolute instance directory. This CLI binds the actor to the installation owner. It rejects missing, unrelated or partial installations without creating them. Use [create/resume](installation.md) to complete construction first.

| Command after request/directory | Options | Result |
|---|---|---|
| `capture <source-id>` | Required `--actor`, `--key`, exactly one of `--text`/`--file`; updates require `--expected-revision` | Source, capture and project references; exact UTF-8 content hash; `replayed`. |
| `source <source-id>` | Required `--actor`; optional `--revision` | Complete source record at the requested exact revision, or the current one. |
| `source-history <source-id>` | Required `--actor`; optional `--limit`, `--after-revision` | Versions in recorded order, with references, locator, observation/recording timestamps and next cursor. |
| `search <text>` | Required `--actor`; optional `--limit`, `--after` | First matching segment per current accessible source, excerpt and provenance. |
| `context` | Required `--actor`; optional `--limit`, `--after` | Current project purpose/status/responsible/next action and a page of accessible current sources. |

Page size defaults to 20 and is limited to 1–100. For search/context, pass `next_cursor` as `--after`; for history pass it as `--after-revision`. A null cursor means no next page in that query snapshot. Each call reads a coherent database snapshot; later pages observe later state if another process writes between requests.

Without temporal flags, search uses current sources. The [M3.2 temporal guide](review.md) explains `--as-of` and `--valid-at`, including their coverage limits. Search uses a literal, case-sensitive substring, without stemming, embeddings, ranking or wildcard syntax. `%`, `_` and quotes are ordinary characters. Each match includes an exact source revision, project association revision, segment ID, locator, observation time and authority. Excerpts are at most 240 Unicode characters, starting up to 80 characters before the first match. Use `source --revision` to retrieve the complete evidence. Context returns the first segment of each source; it does not generate a summary or retrieve decisions yet.

Results declare their coverage as current accessible project sources. No matches means no literal match within that scope; it does not prove global absence or that older versions have no match. Sources outside the caller's access are filtered in SQL before matching and pagination. Source/history reads also require current project and source access. Project context omits raw reference lists whose targets may be restricted. Historical reads do not restore revoked permissions.

## Identity, retries and changes

Choose an opaque source ID that stays stable across updates. A filename is a locator, not an automatically inferred identity. New sources require no expected revision; an existing source requires its exact current revision. The capture command only updates owner-held, unverified local text snapshots in the same project. It rejects collisions with other kinds, projects or source scopes.

A request key identifies one intended capture within an instance and actor. Repeating that key with the same project, source ID, locator and exact text returns the original receipt without new records or versions. Reusing it for different content or a different destination fails. A retry may return an older revision even after a later capture: retrieve the current source separately when freshness matters.

To update, first read the current source and copy its opaque `revision`, then use a new key:

```bash
node dist/cli/main.js capture "$mcc_request" "$mcc_instance" demo-notes \
  --actor local-user --key demo-notes-2 --expected-revision '<current-source-revision>' \
  --text 'Synthetic revision: the prototype is ready for review.'
node dist/cli/main.js source "$mcc_request" "$mcc_instance" demo-notes \
  --actor local-user --revision '<original-source-revision>'
```

Replace angle-bracket placeholders with the returned values. A stale revision fails without a partial write. A new key with unchanged text/locator records a new capture but retains the source revision. Source creation/update, the current project link, capture and their histories share one SQLite write transaction. Competing identical requests converge on one receipt; competing updates with the same prior revision allow one winner. These are local SQLite guarantees, not distributed leases or external-effect deduplication.

The capture retains one `body` segment with exact text, including UTF-8 BOM, CRLF and trailing newlines. `content_hash` hashes those UTF-8 bytes. Files must be regular UTF-8 text, nonempty after whitespace checking, with no NUL and at most 1 MiB (1,048,576 bytes). The adapter reads a bounded snapshot, rejects invalid encoding and detects size/timestamp changes during reading. A resolved symlink records the canonical file URL. Direct text uses a `text:` locator derived from the source ID. This is not a file watcher or a guarantee against an adversarial filesystem host. There is no PDF/Word parser, directory import, remote fetch or automatic vault ingestion.

## Trust and existing foundations

New sources use authority `unverified`; captures use processing status `pending`. Snapshot observation/availability time is recorded, but the system does not infer when statements became true. It does not extract facts, promote decisions, execute source instructions or authorize actions. Malicious-looking text is preserved as data; no real-runtime prompt-injection defense is claimed at this stage.

The CLI is an explicit trusted local owner operation over the M1 knowledge API. `--actor` selects the already trusted host identity; it is not login or proof of identity. New source access initially copies project access. Later source/project ACL changes remain separate, and retrieval requires both. The direct library supports scoped readers, but the local CLI's first profile is owner-only.

M2's `instance.install` authorization and manifest describe construction. M3.1 neither expands that authorization nor activates a runtime workflow: it adds a separate owner-operated local knowledge entry point. Runtime calls and their effect mediation remain M3.4–M3.5 work. Installed catalog/specification/manifest versions and original plan digests remain unchanged. No schema migration or reinstall is needed.

Manu's existing foundation can be queried without changing it:

```bash
node dist/cli/main.js --lang es context \
  "$HOME/Library/Application Support/manu-control-center/configuration/manu.json" \
  "$HOME/Library/Application Support/manu-control-center/instances/manu" --actor manu
```

For an intentional capture into that instance, use those same request/directory arguments, a chosen source ID and request key, and one explicit text/file input. Development verification uses synthetic instances; no personal sources are imported automatically. The existing-instance regression compares the request, original plan, database bytes and directory entries before and after read-only context retrieval.

Reads use a read-only connection. Local entry points reject WAL and pending journals without repairing them. If a process stops during a write, use authorized `resume` from the [installation guide](installation.md). SQLite performs recovery; an explicit recovery transaction also finalizes a cold leftover journal while preserving logical records and revisions. Do not delete journal files. Other writers can cause a retryable conflict; re-read current state before attempting a changed request.

## Library entry points

`manu-control-center/knowledge` exports `captureLocalSource`, `readLocalSource`, `readLocalSourceHistory`, `readLocalSourceAt`, `searchLocalSources`, `readLocalContext`, `readLocalTextFile` and the `LocalCaptureInput` type. Local operations validate the original installation request and destination before using the backend.

`manu-control-center/sqlite-knowledge` exports `SqliteKnowledgeBackend`. Its `forKnowledge({instance_id, actor_id})` returns synchronous `capture`, `source`, `sourceAt`, `history`, `search` and `context` operations. The host supplies this trusted scope; never derive it from a source or model response. `manu-control-center` exports the knowledge request/result types. A read-only backend uses `new SqliteKnowledgeBackend(path, undefined, {readOnly: true})`; always close it after use. The direct backend can serve M1 projects without a builder installation, whereas local commands deliberately require one.

Contracts remain draft APIs. [Tests](../tests/knowledge.test.ts) cover access, references, concurrent writes and rollback; [local tests](../tests/local-knowledge.test.ts) cover actual files, fresh CLI processes, installation boundaries and process interruption. [Development](development.md) explains the full suite and clean package installation.

[Home](../README.md)
