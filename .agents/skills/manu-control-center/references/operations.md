# Instance operations

All commands below go through `node <skill-directory>/scripts/mcc.mjs`. Append `--actor <owner>` and optionally `--lang es`; request and directory are always the host binding. Payload files contain JSON, not shell commands. Use the package's `--help` for supported flags.

## Capture and queries

```text
capture <request> <directory> <source-id> --key <stable-request-key> --file <authorized-UTF8-file>
source <request> <directory> <source-id> --revision <revision>
search <request> <directory> <literal-query>
knowledge <request> <directory> decision
knowledge <request> <directory> claim
knowledge-record <request> <directory> <record-id> --kind artifact --revision <revision>
```

Capture only material the user supplied or authorized. An existing source update requires `--expected-revision`. Keep the same request key when retrying the same capture; changed content is a new request. Search is literal and case-sensitive. `--as-of` selects recorded history; `--valid-at` filters explicit validity, not inferred truth.

## Prepare a draft

Use `coordinator-submit <request> <directory> <operation.json>`. A meeting operation is:

```json
{
  "workflow": "meeting-to-brief",
  "request_key": "meeting-example-001",
  "source_policy": "fresh",
  "runtime": { "id": "codex", "version": "0.146.0-mcc.1" },
  "meeting": {
    "source": { "ref": { "id": "<source-id>", "revision": "<revision>" } },
    "selections": []
  }
}
```

Project status uses the same payload with `workflow: "project-status"` and no `meeting` field. Use a stable logical request key; never reuse it for changed work. The synthesis profile requires authenticated Codex CLI 0.146.0. The host may select `MANU_CONTROL_CENTER_CODEX_MODEL`; an unavailable runtime is a blocker, not permission to substitute an unverified adapter.

Read the returned run, then use `session-continue` with:

```json
{ "run_ref": { "id": "<run-id>", "revision": "<current-revision>" }, "executor_id": "<session-worker-id>" }
```

Inference pauses with a validated checkpoint. Another continuation prepares the draft and waits for review. Source policy `fresh` detects changed context; `snapshot` pins exact versions while checking current access. If a fresh run is invalidated, inspect `coordinator-read` and use the specific revise/authorize operation from the coordinator guide; do not discard history or silently create replacement work. Interrupted inference can consume usage; automatic billing-idempotent retry is not available.

## Review and finish

Retrieve `coordinator-read <request> <directory> <run-id>` and inspect the full `artifact.data.content`, original source versions and current context. Four criteria are required: use `classification_faithful`, `uncertainty_preserved`, `no_unsupported_assertions` and `source_instructions_not_followed`. The semantic review concerns distinction of statements/agreements, source support, untrusted instructions and absence of unauthorized effects; do not invent a passing result.

After explicit owner acceptance of the displayed bytes, `coordinator-review <request> <directory> <review.json>` uses the current run reference, exact artifact reference, content hash and a review object:

```json
{
  "run_ref": { "id": "<run-id>", "revision": "<revision>" },
  "artifact_ref": { "id": "<artifact-id>", "revision": "<revision>" },
  "content_hash": "<exact-content-hash>",
  "review": { "verdict": "accept", "checks": [] }
}
```

Replace the empty checks array with all four inspected `{criterion, outcome, note}` entries. It is intentionally not a ready-made approval. Rejection uses `verdict: "reject"` with specific failed criteria. Review returns a paused run; `session-continue` applies the recorded exact approval and completes it. Never call `artifact-approve` to bypass a coordinated workflow.

The read-only handoff's `run_ref` is a snapshot: stale revisions fail, so refresh and inspect before retrying. A failed, cancelled or completed run is never automatically advanced. `coordinator-cancel`, `coordinator-retry`, `coordinator-reconcile`, `coordinator-authorize` and decision promotion have separate explicit scope. Real external delivery is not implemented in this profile.
