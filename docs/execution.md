# Kernel, skills, workflows and execution state

Contracts and transitions `0.1.0-draft` were adopted in M1. State, budget, version and authorization guards exist with reference persistence. M3.3 adds fixed local human-reviewed workflow compositions. M3.4 adds the [local coordinator](coordinator.md), durable steps, current leases/fencing, reservation/retry/deadline enforcement and verified simulated effects. M3.5 adds the [Codex synthesis profile](codex-runtime.md), actual invocation and reported token usage; hard token/cost enforcement remains unavailable. See [local workflow scope](workflows.md). [M1 scope](m1-implementation.md) bounds verified guarantees. Responsibility separation follows [the architecture](architecture.md).

## Kernel and policy

The kernel retains types, invariants and shared rules for authority, writes, context, continuity and acceptance. A person's preferences/sources belong to their instance. Runtime entry points are generated from or reference the kernel, with consistency checks; copied text does not prove semantic equivalence.

A policy decision binds actor, instance, operation, resource, destination, content version/hash where applicable, time scope and revocation state. It returns allow, deny or an unmet requirement. The point performing an effect rechecks scope, revisions and fencing; a permission read at conversation start is insufficient.

## Skill and workflow

Skill contract: ID/version, purpose, input/output schemas, permitted sources/tools, effects, dependencies, limits, errors and evaluations. The procedure may use resources/scripts. `SKILL.md` is one possible distribution format; a custom `contract.yaml` needs its own schema/validator. No host is presumed compatible with that validator.

Workflow: ID/version, trigger, input, steps, dependencies, conditions, policy, outputs and acceptance. Each step declares its type (deterministic, agent or human), capability/version, input bindings, required results, effects and recovery. Missing dependencies, dead-end paths or undefined acceptance make a workflow fail before starting.

## Execution records

- **Job:** identified request with instance, workflow/version, inputs/revisions, deduplication key, optional priority, budgets and overall state.
- **Run:** attempt to execute a job, with executor, state, revision, steps, evidence and interruption/completion cause. A retry may create another run while preserving logical effect identities.
- **Step:** state, pinned inputs, output/evidence, temporary owner, fencing token and checkpoint. Technical control must validate ownership when writing.
- **Action:** effect intent, stable key, destination, payload/hash, authorization, expected revision, state, attempts and remote references.
- **Handoff:** view generated from those records: objective, versions, sources, valid steps, artifacts, confirmed/uncertain effects, limits and next action.

C19 owns all these records. C21 operates on Action; C23 requests recovery transitions; C28 observes. A handoff summary is not another editable canonical execution record.

## Run states

| From | To | Condition |
|---|---|---|
| `queued` | `running` | An eligible executor acquires control atomically. |
| `running` | `waiting_input` | Essential missing data/approval is recorded. |
| `running` | `blocked` | A dependency, access issue or uncertain effect prevents the next step. |
| `running` | `paused` | Checkpoint persisted and ownership safely released. |
| `waiting_input`, `blocked`, `paused` | `queued` | Cause resolved; revalidate versions/access when reacquiring. |
| `running` | `succeeded` | All required outputs accepted and required effects confirmed. |
| Nonterminal | `failed` | Unrecoverable failure or exhausted retry policy. |
| Nonterminal | `cancel_requested` | Cancellation recorded; schedule no new steps. |
| `cancel_requested` | `cancelled` | In-flight operations handled; retain uncertain actions for reconciliation. |

This table combines M1-validated edges with conditions enforced by the M3.4 local coordinator; runtime controls are demonstrated only for the pinned M3.5 Codex profile. A conditional revision alone proves neither executor eligibility, lease acquisition nor semantic acceptance.

Terminal states do not reopen to hide attempts: a new attempt references its predecessor. The coordinator derives job state from runs and retry policy. Cancellation does not claim that an already-started effect was undone.

## Action states and effect protocol

`prepared → in_flight → confirmed | failed | unknown`. An action refused before invocation may end as `rejected`. An uncertain action becomes `confirmed` with target evidence, or a no-effect failure only when non-occurrence is proven. If retry is demonstrated safe, retain logical identity and attempt history.

1. Persist intent, payload/version, destination, stable key, authorization and revision.
2. Acquire write authority; check scope/preconditions at execution time.
3. Record the attempt and call the target using an idempotency key if supported.
4. Save the receipt and check the result; only then confirm.
5. After a lost response, reconcile by remote reference or key. If unresolved, block the dependency without repeating it.

M1 requires `reconciliation: no_effect_proven` and receipts to declare failure from `in_flight` or `unknown`. Only `failed → prepared` permits another attempt; entering `in_flight` increments the counter exactly once and checks the current grant. Resolving `unknown → confirmed` requires `effect_confirmed`. The backend validates receipt references/states; M3.4 mediates local operations and verifies its simulator ledger; M6 must establish the actual external target semantics.

There is no universal transaction between a local database and a remote service. Job deduplication, writer exclusion and target idempotency are distinct, complementary mechanisms.

## Concurrency, resumption and versions

Claiming needs compare-and-swap/a transaction or a technically enforced single writer. Expiring leases need fencing or an equivalent mechanism that prevents a former executor from writing. Lease expiry does not prove an external operation finished.

On resumption, check workflow version, source revisions, authorizations, ownership and open effects. Reuse steps whose outputs remain valid; invalidate only those dependent on changes, preserving earlier evidence. Updates may pin runs to older versions or migrate them explicitly, but must not silently reinterpret their state.

## Errors, budgets and observability

Define retry/wait limits, timeouts, total time and call/cost/context limits where observable. Repeating identical input does not fix input-validation errors. Access failures do not grant permission to switch to a broader mechanism. Exhaustion leaves a readable state and next action.

Record IDs, versions, transitions, timing, actor, errors and minimal evidence references. Do not indiscriminately dump content/secrets into logs. Semantic evaluators retain the model/configuration/rubric and reviewable examples; their results do not replace deterministic permission/identity checks.

## Cadence and improvement

Trigger: ID/version, workflow, event or schedule, timezone, dedup key, misfire policy, source and permissions. The scheduler generates jobs; it does not implement a second execution state machine. Verify cadence through real runs, disconnection and repeated events.

Audit: stable finding, criterion, coverage, evidence, state and revision. Possible states: new, open, resolved, reopened, not reviewed and not applicable. Closure requires new evidence. Test proposed changes before activation; knowledge learning and policy modification are not one automatic operation.

[Home](../README.md)
