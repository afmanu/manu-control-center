# Decisions, time and approved artifacts — M3.2

M3.2 makes knowledge review usable from the local CLI: record assertions with evidence, propose and authorize decisions, query recorded history or explicit validity, and preserve exact approved artifacts while working on a new draft. Inputs and outputs are structured JSON; the language option never translates user content. [M3.1 capture](knowledge.md) supplies the sources. Workflows and semantic extraction follow in M3.3; a real runtime follows in M3.5.

## Run the complete synthetic example

From a built checkout:

```bash
npm run build
node examples/review-demo.mjs
```

The [demo](../examples/review-demo.mjs) creates a disposable instance, captures a source, proposes/authorizes/activates a decision, approves a draft, edits a related new draft and changes the source. It checks historical retrieval, exact approved content, source policies and read-only behavior, then removes its temporary data. No personal instance is read or modified. Clean package installation runs the same example through the installed CLI.

For your own instance, use its original request and absolute directory. The [installation guide](installation.md) locates Manu's foundation. The following examples use shell variables `mcc_request` and `mcc_instance` for those paths. Store operation JSON files outside the repository. Obtain source IDs/revisions from `capture` or `source`; placeholders below must be replaced with those exact values.

## Record an assertion or proposal

An intake claim can be `declared` (a reported assertion), `hypothesis` or `proposed`. None implies that the system verified its truth. Intake cannot set `confirmed` or `refuted`; those existing model states require a later explicit review capability. A claim and a decision are separate entities.

Save this shape as `claim.json`, with a real source reference:

```json
{
  "id": "reported-budget",
  "expected_revision": null,
  "data": {
    "content": "The reported pilot budget is 100 units.",
    "epistemic_status": "declared",
    "evidence": [{"source": {"id": "<source-id>", "revision": "<source-revision>"}, "segment_id": "body"}],
    "validity": {"valid_from": "2026-09-01T00:00:00.000Z", "valid_to": "2026-10-01T00:00:00.000Z"}
  }
}
```

`validity` is optional. Omission means unknown, including older M1 claims. Never invent it from a source's observation date. The interval includes `valid_from` and excludes `valid_to`; null `valid_to` means no declared end. One claim ID identifies one assertion/interval; revisions correct that assertion. Use separate IDs for successive assertions with distinct validity intervals.

```bash
node dist/cli/main.js claim "$mcc_request" "$mcc_instance" /absolute/path/claim.json --actor manu
node dist/cli/main.js knowledge "$mcc_request" "$mcc_instance" claim --actor manu
```

For a decision proposal, use `decision-propose` with this payload:

```json
{
  "id": "prototype-choice",
  "expected_revision": null,
  "data": {
    "choice": "Build an internal prototype.",
    "alternatives": ["Wait for further evidence."],
    "evidence": [{"source": {"id": "<source-id>", "revision": "<source-revision>"}, "segment_id": "body"}],
    "review_criterion": "Review after the pilot."
  }
}
```

Both operations create or replace a complete draft payload. Null `expected_revision` requires absence; updates require the current exact revision. A stale revision, unknown field, invented segment, inaccessible evidence or cross-project source fails without a partial write. Editing active or historical decisions through intake is blocked. Captures remain pending; manual knowledge entry does not claim a complete extraction/integration workflow.

## Authorize and activate a reviewed decision

First read the proposed record with `knowledge-record <request> <directory> <id> --kind decision --actor manu`. To authorize exactly that reviewed revision, save this payload as `grant.json` and invoke `decision-grant`:

```json
{
  "id": "prototype-choice",
  "expected_revision": "<reviewed-proposal-revision>",
  "grant_id": "prototype-authorization-1",
  "operation": "decision.promote",
  "valid_until": "2026-09-09T18:00:00.000Z"
}
```

Choose an expiry in the future. The explicit command issues an owner grant bound to instance, actor, decision, operation, destination and exact content hash. Reusing the same grant ID for the same reviewed scope returns the existing grant; a different scope conflicts. Grant issuance is separate from applying the decision.

Copy the returned grant's ID/revision into `activate.json`:

```json
{
  "id": "prototype-choice",
  "expected_revision": "<reviewed-proposal-revision>",
  "grant_ref": {"id": "prototype-authorization-1", "revision": "<grant-revision>"},
  "status": "active"
}
```

```bash
node dist/cli/main.js decision-grant "$mcc_request" "$mcc_instance" /absolute/path/grant.json --actor manu
node dist/cli/main.js decision-set "$mcc_request" "$mcc_instance" /absolute/path/activate.json --actor manu
```

The transition checks the persisted current grant, its interval and scope inside the transaction. Changed proposal content, wrong actor/resource/destination/operation/hash, wildcard content scope, stale grant revision, expiry or revocation blocks activation. The decision and project's active-decision reference update atomically. Activation records the grant reference and actual transition time; text in a source cannot issue that grant.

To mark an active decision `superseded` or `revoked`, issue a fresh `decision.change_status` grant against its current revision and use `decision-set` with the desired status. That operation scope permits either terminal status; it does not authorize edits to the choice. Historical decisions cannot reopen. `superseded` retires the old decision; it does not automatically select or activate a replacement. Transition retries use compare-and-swap: read current state after a conflict rather than assuming the operation did not happen.

To withdraw an unused authorization, `decision-revoke-grant` takes `{"id":"<decision-id>","grant_ref":{"id":"<grant-id>","revision":"<current-grant-revision>"}}`. This requires the trusted owner entry point. Revoking or expiring a grant prevents future use but does not undo an already active decision. Use an authorized decision status change for that.

## Recorded history and declared validity

All temporal options use normalized UTC timestamps with milliseconds, such as `2026-09-08T10:05:00.000Z`. Future recorded-time queries are rejected; declared validity may extend into the future without proving a future fact.

| Question | Command or option | Meaning |
|---|---|---|
| What is stored now? | `knowledge ... claim`, `knowledge ... decision`, `knowledge ... artifact` | Current record versions, retaining their statuses; no implicit truth/validity filter. |
| What had been recorded by a time? | `knowledge ... claim --as-of <timestamp>` | Latest record version at or before the cutoff, selected before text matching. Works for decisions/artifacts too. |
| Which assertions explicitly cover a date? | `knowledge ... claim --valid-at <timestamp>` | Filter the selected versions by their declared validity. Unknown intervals are excluded and coverage says so. |
| What did the system then say was valid on another date? | Both `--as-of` and `--valid-at` on a claim query | Recorded time and declared validity remain independent. |
| What exactly was approved or proposed? | `knowledge-record ... <id> --kind <kind> --revision <revision>` | Exact immutable historical record, not regenerated text. |
| What source snapshot was known then? | `source ... <id> --as-of <timestamp>` | The latest source version recorded by that time. |

`knowledge-record` also accepts `--as-of`; it cannot be combined with `--revision`. `search` and source-only `context` accept `--as-of` and `--valid-at`. For sources, validity refers to the selected snapshot's declared availability, not the truth of claims in its text. A validity filter never falls back to a superseded record version when the selected version does not match; use separate assertion IDs for separate intervals and recorded history for earlier knowledge. Same-millisecond writes resolve to the last recorded version at that instant; use exact revisions to distinguish them.

Knowledge list queries accept `--text` for literal case-sensitive matching, `--limit` (1–100, default 20) and `--after` for the returned ID cursor. They return complete records for review, so choose a small page size for large artifacts. Results identify recorded cutoff, time basis, validity coverage and access scope. Unknown validity and no matches never establish absence or truth. This is structured temporal retrieval, not natural-language fact checking or automatic contradiction resolution.

`context` continues to return project purpose/status/responsible/next action and source excerpts. Use `knowledge ... decision` for decision records. Workflow summaries and a combined continuity view follow in M3.3/M3.6.

## Approve exact content and create its next draft

`artifact-draft` takes this payload:

```json
{
  "id": "pilot-brief",
  "expected_revision": null,
  "data": {
    "content": "Exact text to review.\r\n",
    "source_refs": [{"id": "<source-id>", "revision": "<source-revision>"}]
  }
}
```

The adapter computes the exact UTF-8 hash. Empty drafts are allowed; nonempty text follows the 1 MiB capture limit. Read the draft, then `artifact-approve` with `{"id":"pilot-brief","expected_revision":"<reviewed-revision>","source_policy":"fresh"}`. Approval is an explicit trusted owner operation. The backend requires the trusted owner even for direct artifact state changes; an ordinary writer cannot approve. It stamps acceptance time itself and preserves content/hash.

The approved record's data is immutable. To continue editing, call `artifact-fork` with `{"approved_ref":{"id":"pilot-brief","revision":"<approved-revision>"},"draft_id":"pilot-brief-next"}`. It creates a draft and a `revision_of` relation atomically, pointing to the exact approved version. Update that new draft with `artifact-draft` and its expected revision. Both the original approved bytes and acceptance history remain retrievable. No external delivery occurs.

## Pinning and freshness

`sources-check` accepts `{"policy":"snapshot","refs":[{"id":"<source-id>","revision":"<source-revision>"}]}`. It reads the exact historical references and their current versions from storage with current permissions.

- `snapshot` preserves the pinned references even when newer ones exist; `invalidate` is false and `changed_source_ids` reports changes.
- `fresh` selects current references; changed revisions set `invalidate: true`, telling the caller to revalidate dependent work.

Artifact approval requires this explicit policy. With `fresh`, changed sources produce `STALE_PLAN` without approving or rewriting the artifact; revise the draft and review its new revision. With `snapshot`, approval retains the original exact evidence. Missing or newly restricted evidence blocks both policies. Proposal promotion is bound to its pinned evidence; use source preflight when freshness is needed before authorizing it.

Preflight is not a run or coordinator. It does not silently rewrite jobs, invalidate persisted steps or certify a workflow result. M3.4–M3.5 must call it at execution boundaries and persist the consequences. A23's real-run resumption case remains pending.

## Permissions, compatibility and API

The host supplies identity and grant-issuer authority. The local CLI remains owner-only and is not a login system or sandbox. Its explicit grant/approval commands are separate capabilities from source intake; merely accepting a field in source text cannot invoke them. An agent with arbitrary shell access would still require host controls in M3.5.

Derived records initially inherit the intersection of current project and source access. Edits do not expand explicitly narrowed access. Queries require current project, record and every pinned source's access/project association before matching and pagination, including historical records. Revocation cannot be bypassed through old ACL snapshots or derived text. A granted decision's provenance remains stored after grant expiry; it is historical evidence, not a renewable authorization.

`manu-control-center/review` exports local draft, grant, grant-revocation, decision transition, artifact approval/fork, source check and query functions. `manu-control-center/sqlite-review` exports `SqliteReviewBackend` with `forReview(scope)` and inherited `forKnowledge(scope)`. Core exports include the request/result types. SQL/clock/filesystem code remains in adapters; models, statuses and policy interfaces remain backend-neutral. Library reads can serve other authorized actors; writes in this profile require the project owner. Intake supports at most 100 references/evidence entries per operation.

Package `0.1.0-dev.5` adds optional claim validity to the draft schema while preserving older claims without it. Generated schemas remain the source of structural checks. Draft artifacts can no longer carry an acceptance timestamp, and approving an artifact requires trusted owner scope. There is no database migration, catalog replacement, instance reinstall or runtime activation. Existing approved records and original foundation plans remain readable. Review intake is a constrained layer above M1; the general trusted M1 API still supports its other declared states and grant scopes and must not be exposed as an uncontrolled agent tool.

[Evidence](m3.2-verification.json) records the tested local scope. [Handoff](handoff.md) identifies the next step. [Home](../README.md)
