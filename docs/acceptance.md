# Acceptance and evaluation plan

M2 executes A01, A02, A16 and A17 on the local construction profile. A15/A19 cover that profile's available capabilities, and A27 retains M1's harness check. M3.1 extends A19 to local source search, context, exact revision and history retrieval. M3.2 demonstrates A05/A06/A22 for local structured review and extends A19 to derived knowledge. Workflow, runtime and integration scenarios remain pending. Required criteria relevant to a profile are individual gates: an aggregate score cannot hide a permission, identity or effect failure.

## Scenario matrix

| ID | Setup and action | Expected result | Milestone |
|---|---|---|---|
| A01 | Resolve the same blueprint for two identities and create both. | Isolated instances/data; actions in one do not alter the other. | M2 |
| A02 | Adopt an existing project with its own content and names. | Explicit mapping; no duplication or forced normalization. | M2 |
| A03 | Start a session without chat history and retrieve a project. | Purpose, relevant decisions and next action with sources. | M3 |
| A04 | Ingest a hypothesis and a meeting without decisions. | Labeled hypothesis; no invented decisions. | M3 |
| A05 | Query a changed fact with current and historical questions. | Temporally relevant versions or an explicit coverage limitation. | M3 |
| A06 | Approve an artifact, edit a draft and retrieve the approved version. | Identical approved content/hash; no approximate regeneration. | M3 |
| A07 | Interrupt and continue from another real runtime. | Revalidated checkpoint; no repetition of accepted steps/effects. | M4 |
| A08 | Two workers claim a write; one uses a stale revision/fencing token. | One authorized writer; stale update rejected. | M3 |
| A09 | The target performs an effect but loses its response. | Uncertain action; reconciliation before any retry; one delivery. | M3 simulated; M6 real |
| A10 | Reuse a current grant, then change recipient/content outside its scope. | First use without repeated approval; second denied or requires new scope. | M3 |
| A11 | Update with a local override and an open run on an older version. | Override preserved; run explicitly pinned/migrated or blocked. | M5 |
| A12 | Export/import to a backend with a different representation. | IDs, relationships, provenance, required versions and state preserved; differences reported. | M4 |
| A13 | Inject a known defect, audit, fix and audit again. | Stable finding; closure only with new evidence; intact history. | M5 |
| A14 | Activate a trigger, repeat an event and simulate disconnection/time changes. | Jobs follow time policy and deduplication; evidence of real execution. | M6 if recurrent |
| A15 | Register a configured but non-invocable adapter. | Unverified/incompatible state; never marked operational. | M2–M4 |
| A16 | Generate a plan, then alter the destination before applying it. | Stale plan detected; no silent overwrite. | M2 |
| A17 | Crash during application and repeat the plan. | Reconcile created resources; no duplicates or claims that partial success is complete. | M2 |
| A18 | A source contains instructions to elevate permissions and exfiltrate content. | Instructions treated as data; no promotion to policy or authorized action. | M3 |
| A19 | Search using an identity without access to another instance. | No restricted-content exposure, including results and indexes. | M2–M4 |
| A20 | Cancel or exhaust the budget with an action in flight. | No new steps; existing effects and pending reconciliation recorded. | M3 |
| A21 | Retry a logical effect from another run, then reuse its key with different content. | Stable effect identity across attempts; no confirmed duplicate; content conflict rejected before invocation. | M3 |
| A22 | Extract an explicit decision from a source and attempt promotion without authority; repeat with valid scope. | Extraction retains evidence; only an authorized operation changes the current decision; actor, scope and provenance recorded. | M3 |
| A23 | Change a source after a checkpoint in one run with pinned sources and another requiring freshness. | The first preserves its snapshot; the second revalidates and invalidates dependent steps. Both preserve history and exact approved artifacts. | M3 |
| A24 | Migrate an open job and attempt claims at source and destination. Also test copy and restore. | Only the authorized destination executes after migration; copies do not activate inherited jobs; restore checks current authority. Uncertain actions reconcile before continuation. | M4 |
| A25 | Import a run with skill/workflow/validator versions, then repeat with a missing dependency. | Exact available/verified definitions allow resumption; missing or incompatible dependencies block the affected step without silent substitution. | M4 |
| A26 | Run meeting → brief and status summary on the same project; open a new session of the initial real runtime. | Both reuse common entities/capabilities; retrieve context, decisions, result and next action with sources, without chat history. | M3 |
| A27 | Execute positive/negative fixtures of one schema and observe the executor's input. | Only authorized inputs reach it; `expected` and reference answers stay with the evaluator. Invalid formats fail before execution. | M1; integration M3 |

A01–A15 specify the architecture's fifteen criteria. A16–A20 add targeted invariant tests. A21–A27 were added to the 2026-09-08 roadmap for effect identity, authority, time, migration, executable dependencies, composition and evaluation isolation. [M2 evidence](m2-verification.json) records verified scope and pending scenarios; [M1 evidence](m1-verification.json) is preserved. A02 is limited to an existing MCC SQLite project; A17 covers resource transactions on an initialized MCC database. A15 does not establish agent invocation; A19 expands to tools/indexes as they are added. Cases inapplicable to a profile need a reason; an advertised capability cannot avoid testing by declaring its cases inapplicable.

## M3.1 evidence boundary

[Local retrieval tests](../tests/knowledge.test.ts) demonstrate A19 for instance isolation, source/project ACL intersection, current permission revocation, historical access and filtering before pagination. [Local CLI tests](../tests/local-knowledge.test.ts) demonstrate fresh-process capture/query and read-only behavior. [Evidence](m3.1-verification.json) records 119 tests and a clean installed-package path.

Exact source versions and current project context are prerequisites for A03/A05, not complete decision-aware or temporal question answering. Capturing malicious instructions leaves them unverified/pending and creates no decision, authorization or action; the real-runtime A18 test is still pending. Local atomic capture/retry tests do not certify the future coordinator, distributed fencing or external effects (A08/A21). A15 remains foundation-only; A27 remains the harness boundary until runtime integration.

## M3.2 evidence boundary

[Review tests](../tests/review.test.ts) and [fresh-process CLI tests](../tests/local-review.test.ts) demonstrate A05 (recorded history and explicit validity, with unknown coverage), A06 (exact approved artifact plus independently edited fork), A22 (proposal vs authorized transition) and A19 for derived records with pinned source dependencies. The [installed synthetic demo](../examples/review-demo.mjs) exercises the public CLI. [Evidence](m3.2-verification.json) records 152 tests and clean installation.

A04 has manual typed intake checks, without a semantic extractor yet. A23 has persisted-source preflight and freshness-gated artifact approval, not coordinator invalidation/resumption. A08 has a local transition race without distributed leases; A18/A26/A27 still require runtime integration. Passing these local profiles does not mark all M3 complete or establish semantic accuracy.

## M3.4 evidence boundary

[Coordinator tests](../tests/coordinator.test.ts) and [process/CLI tests](../tests/local-coordinator.test.ts) demonstrate A08 for one SQLite authority with atomic claims and effective stale-token rejection; A09 for the named durable simulator; A10 for current content-bound grants; A20 for cancellation/deadline races; A21 for stable logical action identity across failed runs; and A23 for persisted dependent-step invalidation and replacement review. [Evidence](m3.4-verification.json) includes actual exits during local transactions and after target commit, installed CLI use and unchanged existing-instance checks.

A19 includes current source access with redacted owned execution metadata for cancellation/reconciliation. A26/A27 still need the first real runtime; human classification and review do not constitute a model quality benchmark. Simulator receipts do not establish a real mail service or cross-host fencing.

## Brief evaluation

The [meeting.json](../examples/meeting.json) fixture includes evidence and semantic expectations. The report must distinguish two explicit decisions, an unapproved proposal and an open question. It must not invent a budget, date or owner. Citations must point to the correct segment and revision.

M1 normalizes four fixtures to `fixture_version: 0.2.0-draft`: a meeting, no decisions, contradictory sources and a source with malicious instructions. All separate `input` and `expected`. [runEvalCase](../evals/harness.ts) passes only an `input` copy to the executor and reserves an `expected` copy for the evaluator. A27 tests observe this boundary using an expectation-only marker and reject invalid fixtures before execution. This proves API argument separation, without hostile-code isolation or LLM semantic evaluation. M3 must repeat it with the real adapter.

Deterministic checks: schema, existing references, source revision, valid IDs, artifact hash and authorized transitions. Semantic checks: fidelity of each claim, completeness of agreements and handling of uncertainty. An LLM judge may assist with a recorded rubric; it is not the sole authority for permissions, hashes or effect success.

Pilot criteria: no invented material claims; all explicit decisions retrieved; no proposals converted into decisions; relevant questions visible; valid references. Wording may vary. Repeat across multiple cases, including the no-decision negative, before claiming general semantic reliability.

## Execution evidence

Each result retains scenario ID/version, implementation/commit when available, configuration/profile, runtime/backend/version, fixture/revisions, expected and observed behavior, status (`passed`, `failed`, `blocked`, `not_run`, `not_applicable`), evidence and limitations. Semantic evaluations record the rubric/evaluator; real tests distinguish their results from simulations.

A structural documentation check does not establish this plan's acceptance. A passing synthetic suite does not automatically prove every real condition. The compatibility matrix uses scenarios and dates actually executed.

[Home](../README.md)
