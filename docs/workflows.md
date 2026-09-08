# Local meeting briefs and project status

M3.3 provides two complete local workflows in `0.1.0-dev.6`: `meeting-to-brief` and `project-status`. Both prepare a source-linked artifact, wait for an explicit semantic review, and commit acceptance or rejection in existing Job/Run records. The executor profile is `local-human`; classification and semantic judgments are supplied by the owner. No model is invoked. The first runtime adapter remains M3.5.

Run the disposable synthetic demonstration after `npm run build`:

```bash
node examples/workflow-demo.mjs
```

It creates a temporary foundation, completes both workflows through separate CLI processes, checks exact approved content and removes only its own temporary directory. It never opens Manu's instance. The same example is exercised from the installed tarball.

M3.4 now offers a [coordinated profile](coordinator.md) for new jobs, with durable steps, fencing, budgets and mediated effects. This guide retains the original synchronous commands and their compatibility boundary.

## Commands and input

Use an existing [foundation installation](installation.md). The host binds the project and actor from its request. Operation JSON cannot supply `project_id`, permissions, tools or a replacement actor.

```bash
manu-control-center workflow-prepare request.json /absolute/instance meeting-operation.json --actor local-user
manu-control-center workflow-read request.json /absolute/instance <returned-run-id> --actor local-user
manu-control-center workflow-complete request.json /absolute/instance review.json --actor local-user
```

Spanish help/error summaries use `--lang es`. Protocol fields, canonical artifact JSON and source content keep their exact values. There is no automatic paraphrasing or translation of a transcript in this profile.

Example `meeting-operation.json`:

```json
{
  "workflow": "meeting-to-brief",
  "request_key": "meeting-001",
  "source_policy": "fresh",
  "meeting": {
    "source": {
      "capture": {
        "source_id": "meeting-001",
        "request_key": "capture-001",
        "locator": "text:synthetic-meeting",
        "content": "A prototype is proposed.",
        "expected_revision": null
      }
    },
    "selections": [
      { "segment_id": "body", "start": 0, "end": 24, "category": "proposal" }
    ]
  }
}
```

Alternatively, `source` can contain only `ref: {id, revision}` to use an exact existing project source. The existing [capture CLI](knowledge.md) accepts UTF-8 files. Inline capture and workflow preparation share one write transaction; invalid extraction leaves no new source, capture, project link, artifact or job. A capture supplied by reference was already committed independently.

Selections use JavaScript UTF-16 offsets: `start` inclusive, `end` exclusive. They copy exact source substrings, retain speaker/segment/revision evidence and classify each as `agreement`, `proposal`, `open_question`, `conflict` or `context`. All non-whitespace transcript content must be covered once, with no overlap or invented quote. Keep contradictory or malicious passages visible as source data; `context` is not deletion. A transcript without decisions can have zero `agreement` items. The classifier is a human in this profile; byte fidelity and full coverage do not certify correct classification.

An `agreement` is reported meeting content. It does not create an active system decision, confer publishing permission, or invent an owner/date/budget. Use the separate [decision grant and promotion path](review.md) when the owner actually adopts a decision.

Project status uses the same context, draft, evaluation, review and completion modules:

```json
{
  "workflow": "project-status",
  "request_key": "status-001",
  "source_policy": "snapshot"
}
```

It copies the project purpose/status/responsible/next action and accessible persisted decisions/claims, including their exact status, uncertainty, declared validity and evidence. It does not infer new conclusions from raw sources or from a previously approved meeting brief. A meeting brief remains an artifact until knowledge is explicitly recorded/adopted through the existing APIs. Empty knowledge collections and a null next action stay explicit.

## Output, evaluation and review

`workflow-prepare` returns `{job, run, artifact, replayed}`. `artifact.data.content` is canonical JSON; `artifact.data.content_hash` hashes its exact UTF-8 bytes. Content includes project/version, coverage time, source references, classified quotations when present, structured project knowledge and deterministic evaluation. The run is `waiting_input`, with `accepted: false` and a concrete next action in its checkpoint.

Deterministic checks enforce fields, bounds, transcript coverage, quote fidelity, provenance and access. The owner must independently inspect the artifact and cited evidence and supply every semantic criterion with a concrete note:

```json
{
  "run_ref": { "id": "<returned-run-id>", "revision": "<returned-run-revision>" },
  "artifact_ref": { "id": "<returned-artifact-id>", "revision": "<returned-artifact-revision>" },
  "content_hash": "<returned-content-hash>",
  "review": {
    "verdict": "accept",
    "checks": [
      { "criterion": "classification_faithful", "outcome": "pass", "note": "The only transcript item says proposed and remains a proposal." },
      { "criterion": "uncertainty_preserved", "outcome": "pass", "note": "The brief contains no agreement or confirmed budget." },
      { "criterion": "no_unsupported_assertions", "outcome": "pass", "note": "The quote is exact; project fields match the pinned project record." },
      { "criterion": "source_instructions_not_followed", "outcome": "pass", "note": "The source contains no tool instructions and the result requests no external action." }
    ]
  }
}
```

These example notes apply to the synthetic example only. Write findings for the actual artifact under review. Acceptance requires four distinct passing criteria; rejection requires at least one failure and its evidence note. The API checks this structure and binds the attestation to the exact artifact/run/hash; it cannot determine whether the human's judgment is correct. There is no automatic semantic truth claim or independent human identity requirement: one owner may classify and review, with that limitation recorded.

Acceptance stamps the artifact without rewriting its bytes, marks an inline pending capture integrated, and succeeds the run/job atomically. It records actor, review time, rubric outcomes and original reviewed reference/hash. Integration means the capture contributed to a reviewed artifact, not that its assertions became authoritative. Rejection leaves the artifact draft, keeps the capture pending, fails the run/job and records the concrete corrections needed. Submit corrected work under a new request key; terminal runs are not reopened.

Repeated preparation with the same scoped request key and exact input returns the existing run. Different input with that key conflicts. Repeating the exact completed review returns its stored result; a different review or stale revision conflicts. `workflow-read` retrieves this persisted state in a new process without conversation history. This is local continuity evidence, not the M3.6 agent handoff experience.

## Versions, access and limits

- `snapshot` approves the pinned context, even if later versions exist. It still rechecks current permissions on the project and every pinned source/knowledge dependency.
- `fresh` rejects changed source, project or knowledge revisions, newly added knowledge and context that now exceeds bounds. Preparation also rejects evidence already stale. Nothing silently substitutes a new source in reviewed content. Reject the stale draft or prepare a new request; dependent-step invalidation/recomputation is M3.4.
- The local profile is owner-only. Execution metadata and artifact access are owner-private. Retrieved decisions/claims must also be owned by that project owner; this avoids copying other owners' revocable derived records into artifacts whose generic M3.2 dependency model only tracks sources. Current source access remains mandatory on both workflow and generic artifact reads. Broader sharing needs an explicit derived-dependency model.
- Retrieval is a coherent SQLite snapshot inside the preparation transaction. It includes at most 50 accessible decisions, 50 claims and 100 unique source identities; overflow fails explicitly. Context with multiple pinned revisions of one source also fails instead of silently collapsing evidence. There is no search ranking, per-workflow filtering or automatic contradiction resolution yet.
- Capture and artifact content are bounded at 1 MiB; meeting selections at 200; review notes at 4096 characters per criterion. Stored definition/job step, attempt and timeout limits are declarations for the future coordinator, not enforced asynchronous leases or elapsed human-review deadlines. This profile invokes no model or external operation.
- Ordinary scope cannot complete a workflow. The explicit owner CLI review supplies trusted `can_authorize` scope. Source content and classification payloads cannot set it. Raw backend APIs remain trusted-host APIs, not a security sandbox.

Use workflow completion for its generated artifact; independent editing or approval changes its current revision and blocks workflow acceptance. Prepare a new workflow to revise a generated result. General cancellation/recovery, step records, leases/fencing, usage measurement and effect mediation belong to M3.4. No scheduler, remote delivery, catalog activation, database migration or rewrite of saved construction plans is included.

## Components and evidence

`localWorkflowDefinition` exports validated contracts for the fixed compositions at `0.1.0-local-human`. They identify input, context, extraction, drafting, deterministic evaluation, human review and completion. They are not installed into the M2 foundation catalog or interpreted by a general engine. The implementation composes existing knowledge/review APIs; its prepare and complete transactions persist ordinary Job/Run records in the same C19 store, with checkpoints rather than a parallel state file. Nested read snapshots join that transaction.

Public APIs: `manu-control-center/workflows` for local entry points, `manu-control-center/sqlite-workflows` for `SqliteWorkflowBackend`, and core exports for types, pure extraction/drafting and definitions. `forWorkflows(scope)` exposes `prepare`, `read` and `complete`. The trusted host binds identity and authorization.

The A27 harness still withholds `expected` from executor input. `evaluateMeetingCategories` checks held-out category/segment expectations and produces missing/unexpected findings, then returns semantic review material to the evaluator side. Four synthetic cases cover explicit agreements, no decisions, conflicting evidence and malicious text. Their classifications are human-authored test inputs, not an automatic extractor benchmark. Meanings and `must_not_assert` require semantic review; passing category checks does not prove model quality or prompt-injection resistance.

See [verification evidence](m3.3-verification.json), [decisions](decisions.md) and [roadmap](implementation-plan.md). Full M3 and A26/A27 real-runtime integration remain pending.

[Home](../README.md)

M3.5 adds [Codex synthesis](codex-runtime.md) over the coordinator. The original local human profile described above remains compatible.
