# Coordinated local work and simulated effects

M3.4 adds an owner-operated coordinator at `0.1.0-dev.7`. It persists Job, Run, Step and Action records in the existing C19 SQLite store, acquires expiring leases atomically, fences stale workers, reserves work before execution, and mediates fixed local effects. It supports the two [human-reviewed knowledge workflows](workflows.md) plus `deliver-approved-artifact` against an identified durable simulator. Real runtime invocation remains M3.5; real external delivery remains M6.

The original `workflow-*` commands and existing pending runs remain compatible. New `coordinator-*` requests use the coordinated profile; older runs are not silently migrated. The M2 foundation catalog, saved installation plan and verification scope remain unchanged.

## Try the complete path

```bash
npm run build
node examples/coordinator-demo.mjs
```

The [demo](../examples/coordinator-demo.mjs) creates a temporary foundation, completes both knowledge workflows through fresh CLI processes, simulates a delivery whose response is lost, reconciles its committed receipt and verifies exactly one simulated delivery. It removes only its own temporary directory. It neither opens Manu's instance nor contacts a mail service. Clean tarball installation runs this same example.

Use an existing [foundation](installation.md) for your own local work. Commands take the installation request and its absolute directory. The host binds the project and actor; JSON payloads cannot provide `project_id`, authorization flags or executable adapter implementations.

```bash
manu-control-center coordinator-submit request.json /absolute/instance task.json --actor local-user
manu-control-center coordinator-read request.json /absolute/instance <run-id> --actor local-user
manu-control-center coordinator-claim request.json /absolute/instance claim.json --actor local-user
manu-control-center coordinator-advance request.json /absolute/instance lease.json --actor local-user
```

`task.json` accepts the existing meeting or project-status operation, with an optional CLI budget:

```json
{
  "workflow": "project-status",
  "request_key": "status-001",
  "source_policy": "fresh",
  "budget": {
    "max_steps": 50,
    "max_attempts": 3,
    "timeout_ms": 86400000,
    "max_tokens": null,
    "max_cost": null
  }
}
```

These are the CLI defaults. The core API requires an explicit budget. The same scoped request key and exact request replay the current attempt; changed content, destination, policy or budget conflicts. Meeting input uses the [existing capture/reference and exact human classification payload](workflows.md). User source text remains data, including when it contains instructions.

`claim.json`:

```json
{
  "run_ref": { "id": "<run-id>", "revision": "<latest-run-revision>" },
  "executor_id": "worker-001",
  "lease_ms": 60000
}
```

Claim returns `{lease, result}`. Save its `lease` exactly in `lease.json`:

```json
{
  "lease": {
    "run_id": "<run-id>",
    "executor_id": "worker-001",
    "fencing_token": 1
  }
}
```

Use the returned token, not the example value. Each takeover increments the persisted epoch. Claims check the expected run revision and a live lease; worker writes check the current executor, token, expiry, current job attempt and access inside the write transaction. Reading a newer record does not make an old token valid. Leases last at most 60 seconds and can be renewed while still valid.

`coordinator-renew` takes `{lease, lease_ms}`. `coordinator-pause` takes `{lease}` and releases ownership with a checkpoint. A released or expired token cannot be renewed, advance a step or confirm an effect. Claim again from the latest run revision to resume. Executor IDs and owner identity are supplied by the trusted local host; this is not remote authentication or a sandbox against an owner with direct database access.

## Preparation, review and completion

The fixed knowledge composition has seven persisted steps: input, context, extraction, draft, evaluation, review and completion. Capture/retrieval/extraction/drafting/evaluation form one atomic local batch. The coordinator first commits its reservation, step states and effect intent; then the five local operations and their confirmation commit together. This provides a durable boundary before work and a coherent checkpoint for human review. It does not offer suspension inside that synchronous batch. Unchanged steps keep their existing records on invalidation, while the shared preparation helper rebuilds a coherent read snapshot for the replacement artifact.

Preparation returns `waiting_input`, exact artifact reference/hash, step records and confirmed local effect evidence. Classifications and semantic judgments are still human inputs. Submit the [four-criterion review](workflows.md) using `coordinator-review`, replacing its run/artifact references with those returned by the coordinator. Acceptance records the review and a grant for exactly that artifact/content; it pauses the run. Claim and advance again to apply the approval. The final local transaction approves unchanged bytes, integrates the applicable capture, confirms the local effect and succeeds the run/job. It does not promote decisions or authorize delivery.

A rejected review leaves a draft and a failed run with the evidence notes. A failed current run may be retried with `coordinator-retry` and `{run_ref}` while the job budget permits. The new run pins `previous_run`, keeps the original job and logical action identities, and retains consumed work/attempt/deadline limits. Reusing a confirmed preparation reads its recorded result; it does not repeat the effect. Correcting a different initial request requires a new request key. An explicitly invalidated fresh transcript has the narrower revision path below.

Terminal runs never reopen. A failed run remains associated with an active job only while retry budget remains; exhausted failed jobs become failed. A blocked run retains a concrete reason and next action rather than claiming completion. All required actions must be confirmed before success.

## Source invalidation

Snapshot jobs keep exact source/project/knowledge revisions while rechecking current permissions. Fresh jobs compare source versions, project revision and the complete bounded knowledge membership, including newly created claims/decisions.

If project/supporting context changes, context and its downstream draft/evaluation/review/completion steps are replaced; input and extraction records remain. A changed meeting source invalidates all steps depending on that input. Prior step references, reason and time are recorded in the run checkpoint/history; prior artifacts remain intact. An unused old acceptance intent becomes rejected and is removed from the current required-action set, while its record and grant history remain.

Replacement work gets a new artifact identity and requires new review. Nothing rewrites an already reviewed artifact or silently applies an earlier acceptance to new content. For changed project context, use `coordinator-authorize` for renewed preparation and claim again. For a changed transcript, use `coordinator-revise`:

```json
{
  "run_ref": { "id": "<blocked-run-id>", "revision": "<latest-run-revision>" },
  "source_ref": { "id": "<original-meeting-source-id>", "revision": "<current-source-revision>" },
  "selections": [
    { "segment_id": "body", "start": 0, "end": 24, "category": "open_question" }
  ]
}
```

Ranges must classify the actual current text. The source must retain the original meeting identity. Reclassification records a new preparation grant within the existing job deadline, then queues replacement work. Context overflow and conflicting source revisions still fail explicitly; there is no automatic semantic reconciliation or arbitrary input-policy migration.

## Grants, simulated delivery and uncertainty

Local preparation receives an exact persisted grant when the trusted owner submits the request. Local approval receives a separate exact grant only after the owner's semantic review. The worker does not mint authorization from source text. The effect layer binds actor, instance, operation, resource, destination, content hash, validity and current grant revision, and checks them again immediately before dispatch or the local mutation. Wildcard, revoked, stale, expired and mismatched grants fail before invocation. Valid scope can be reused without issuing another grant.

Delivery is separate from accepting a brief:

```json
{
  "workflow": "deliver-approved-artifact",
  "request_key": "delivery-001",
  "source_policy": "snapshot",
  "delivery": {
    "artifact_ref": { "id": "<approved-artifact-id>", "revision": "<approved-revision>" },
    "destination": "simulator:synthetic-recipient",
    "target_id": "local-mailbox"
  }
}
```

Submission pins the approved artifact and creates a prepared Action without delivery authority. `coordinator-authorize` takes:

```json
{
  "run_ref": { "id": "<run-id>", "revision": "<latest-run-revision>" },
  "grant_id": "delivery-grant-001",
  "valid_until": "<future-UTC-millisecond-timestamp-within-job-deadline>"
}
```

The command derives exact scope from the persisted action. It cannot broaden content or recipient through grant fields. An existing grant ID with different scope conflicts. Grant revocation uses the trusted backend's existing authorization API; revocation blocks a future invocation without erasing evidence of an effect that already occurred.

Then claim and advance. The CLI registers only `local-mailbox@0.1.0-simulator`; real destinations are rejected. Its target data lives in `simulated-mailbox.sqlite` beside the instance store, initialized when the explicit delivery/reconciliation command opens the simulator. Unknown formats, mismatched identities and nonregular paths are rejected. The simulator stores durable delivery receipts, destination/content hashes and sealed no-effect attempts. This target ledger models the external system; C19 still owns all workflow state.

For the loss-of-response test, add `--simulate lose_response` to `coordinator-advance`. The target commits a receipt but returns uncertainty. The Action remains `unknown`; further advance calls cannot resend it. Claim and call `coordinator-reconcile` with `{lease}`. A matching target receipt is verified against its ledger before the Action becomes confirmed. The logical key excludes worker/run attempts and includes instance, job, logical step and effect. Content or destination reuse with the same key conflicts.

Other explicit simulator modes are `confirm`, `no_effect` and `unavailable`, available only on advance/reconcile. Absence alone is not proof: this simulator atomically seals an absent attempt before returning `no_effect_proven`. A late old invocation of that attempt then cannot deliver. A new bounded attempt may use the same logical key, preserving its evidence and exactly one final delivery. These semantics must be independently established for any real M6 target.

## Cancellation, budgets and recovery

`coordinator-cancel` takes `{run_ref}`. It invalidates the current lease immediately and schedules no further work. If an effect is in flight or unknown, the run stays `cancel_requested`. Claiming it permits reconciliation only. Once the target proves delivery or no effect, cancellation completes while preserving the observed outcome. Cancellation never asserts that a delivered effect was undone.

A lost source permission redacts artifact content, action payloads, step details and checkpoints from coordinator reads. The owner can still read minimal execution metadata, cancel and reconcile their job. Storage permits owner cancellation of a job without rereading its immutable, previously validated input references; the existing mutation guard still rejects changing those references. Other record writes and knowledge reads retain their current-access checks.

Budgets are enforced before reserving new steps and before dispatch. Reservations and effect attempts survive failure; retrying does not reset them. `max_steps` bounds total started step work across attempts/generations; `max_attempts` bounds both run attempts and each logical effect's attempts. The wall-clock deadline is fixed at submission and includes human waiting time. Maximum configurable bounds are 1000 steps, 10 attempts and 30 days. Leases have their own shorter renewal window. Token/cost limits must be null because this profile invokes no metered model; numeric limits fail closed pending a metered runtime.

An already in-flight effect may complete after cancellation, a budget deadline or lease expiry. Its old worker cannot confirm new coordinator writes; a current lease must reconcile the target evidence. Reconciliation remains available after deadline exhaustion so uncertain effects are not abandoned. Completion is a budgeted step and may remain blocked after a confirmed delivery; cancellation retains that receipt.

After process failure, reopen and claim from the latest state. An expired in-flight action becomes unknown, never automatically retried. Local effects and their confirmation share one transaction; after the old executor is fenced, an uncommitted local action can be proven rolled back and retried from a new run. A pending SQLite journal must first be recovered through the existing authorized `resume`/construction recovery path. Never delete a journal or replace an unrecognized database to force recovery.

## APIs and verified boundary

Public exports: `manu-control-center/coordinator` (`operateLocalCoordinator`), `manu-control-center/sqlite-coordinator` (`SqliteCoordinatorBackend`), `manu-control-center/simulated-mailbox` (`SimulatedMailbox`) and neutral coordinator types from the root export. The backend exposes `forCoordinator(scope)` with submit/read/claim/renew/pause/advance/review/revise/authorize/cancel/reconcile/retry. Targets are trusted host registrations with a pinned ID/version and independent observation verification, never implementations supplied in a job payload.

The coordinator uses `0.1.0-coordinated` job/run definitions. The shared artifact producer retains the M3.3 local-human capability contract. This is a fixed registered composition, not an interpreter for arbitrary workflows. All model input, semantic extraction quality and runtime tool confinement remain M3.5 work. Per-store SQLite fencing is enforced through coordinator APIs; it is not a cross-database migration protocol or a sandbox against trusted raw backend code.

Action records gain an optional `result` evidence object; existing records remain valid, with no database migration. Confirmed/rejected action data is immutable and receipt references cannot be removed. History retains earlier attempts and receipts.

[Evidence](m3.4-verification.json) covers both workflows, source invalidation, independent competing workers, stale tokens, current grants, cancellation/budget races, forged receipts, and actual process exits during local writes and after target commit. Simulator evidence establishes A09 only for this identified target. It does not establish a real mail integration, distributed host migration or runtime compatibility.

[Home](../README.md)
