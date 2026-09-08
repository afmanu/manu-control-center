# Development handoff

Updated: 2026-09-08. Primary repository: [afmanu/manu-control-center](https://github.com/afmanu/manu-control-center). **M0–M2 and M3.1–M3.5 local profiles complete; next step: M3.6.**

## Current instruction

Manu requests a system he can use and has selected this repository as its destination. Verified work and GitHub delivery are authorized. Preserve the initial history and MIT license; earlier documentation folders are snapshots, without automatic synchronization with this repository or the source vault. Another discovery interview is unnecessary.

Manu authorized the next roadmap step after the English-repository update. M3.1–M3.4 are delivered for the local human/coordinator profiles, including the explicitly authorized continuation into coordination and simulated effect control. Keep repository content in English; runtime interaction and user content may remain Spanish (D24 and [language.md](language.md)).

Manu explicitly authorized M3.5 with Codex as the first agent. The runtime integration is implemented and tested; M3.6 conversational continuity is next.

M3 delivers first agent use; M4 demonstrates another representation and runtime; M5 adds maintenance. Essential M6 integrations may be brought forward from M3.

## Executable status

Private package `manu-control-center@0.1.0-dev.8`, TypeScript/Node 24, exact dependencies and a lockfile. M3.2 adds no dependencies or database migration. Claim validity is an optional draft-schema addition; prior records remain readable. The 22 M1 contracts, SQLite backend with access/revisions/history, and A27 harness remain in place.

M2 adds the `project-knowledge-foundation@0.1.0-draft` catalog, two modules, validated request, resolver and reproducible plan. The adapter checks the real backend in disposable databases, inspects destinations without writes, and applies operations with atomic checkpoints. Adoption reuses MCC SQLite projects with pinned revisions and ownership, preserving content/history.

Operational CLI: `resolve`, `plan`, `inspect`, `apply`, `verify`, `create`, `adopt`, `resume`, plus M0–M1 commands and M3.1 `capture`, `source`, `source-history`, `search`, `context`. Library exports add `./knowledge` and `./sqlite-knowledge` alongside `./builder` and `./local`. The [installation guide](installation.md) covers arguments, examples, recovery and limits; [development](development.md) covers packaging and schemas. Help and error summaries support `--lang en|es`; English is the default. Structured protocols and user data retain their original values.

Each instance stores configuration/catalog, knowledge, construction state and verification reports in separate `store.sqlite` tables. Resources and checkpoints share a transaction. Used construction authorizations are recorded. Reports are retrievable and hash-checked when read. `verified` is limited to `foundation`; `runtime.invoke` remains `not_run`.

New plans have English catalog descriptions. Original M2 plans remain supported without changing their hashes; replanning preserves an existing original catalog. Do not remove this compatibility path while those plans are in use.

M3.1 supplies owner-operated local text/UTF-8 capture (1 MiB maximum), one exact body segment, stable request-key replay and conditional source updates. Source/project/capture records and histories commit atomically. Search is a literal case-sensitive substring over current accessible sources, with bounded excerpts and exact provenance. Source history and revision reads require current project/source access. Context includes purpose/status/responsible/next action and sources, not decisions or generated summaries. See [knowledge guide](knowledge.md).

The capture commands use the trusted M1 knowledge boundary. They do not activate a runtime or expand the M2 construction grant/profile. Captured sources remain unverified; standalone captures remain pending, while M3.3 can integrate them through reviewed workflows. No personal source import or model invocation occurred. Original catalogs, plan digests, schemas and manifest verification scope remain intact.

M3.2 adds `claim`, `decision-propose`, `decision-grant`, `decision-revoke-grant`, `decision-set`, `artifact-draft`, `artifact-approve`, `artifact-fork`, `sources-check`, `knowledge` and `knowledge-record`. Source queries accept `--as-of`/`--valid-at`; claim queries independently select recorded history and explicit validity. `context` remains source-only; review queries expose decisions and artifacts. [Review guide](review.md) defines JSON payloads and the runnable [synthetic demo](../examples/review-demo.mjs).

New library exports: `./review` and `./sqlite-review`. Intake records declared assertions, hypotheses or proposals with evidence; it cannot confirm/refute claims or activate decisions. Decision grants bind exact content and are checked at transition time. Artifact approval requires trusted owner scope and preserves exact bytes. Forks retain an exact `revision_of` relation. Source preflight returns pinned/current references and invalidation requirements; it does not update jobs or run checkpoints.

## Manu's foundation instance

Prepared outside the repository without replacing pre-existing files:

- Local identity and owner: `manu`; initial project: `manu-control-center`.
- Directory: `~/Library/Application Support/manu-control-center/instances/manu`.
- Request: `~/Library/Application Support/manu-control-center/configuration/manu.json`.
- Original plan: `~/Library/Application Support/manu-control-center/configuration/manu-installation-plan.json`.
- State: `verified` for configuration, catalog, project and storage; agent integration pending.

It contains only the initial purpose of building this system. No personal sources were imported or models invoked. M3 must complete this foundation while preserving its identity/data; do not reinstall over it or assume editing the request applies a change. The local identity is initial host configuration, not account authentication. Repository translation preserves private content, including Spanish text.

## Evidence

M2 passed 92 tests, including concurrent installers, stale plans, adoption, actual process exit inside a transaction and after a checkpoint, CLI recovery and isolation. Its clean test repeated the 92 tests, installed the package with an empty consumer cache, created/verified an instance from it and checked public exports.

A01, A02, A16 and A17 pass for the supported local target. A15/A19 pass for the installation profile and need expansion with runtimes/other backends. A27 still passes as a harness API boundary. At M2, system workflows remained pending; subsequent local workflow evidence is recorded below.

[M2 evidence](m2-verification.json), [historical M1](m1-verification.json), [historical M0](m0-verification.json) and [GitHub Actions](https://github.com/afmanu/manu-control-center/actions). Historical hashes belong to their original releases. Subsequent language verification is recorded separately; remote results identify the exact commit without a circular hash embedded in that commit.

## English-repository update verification

The language update passes 98 tests, generated-schema comparison and documentation checks. Clean installation repeats all 98 tests, installs the tarball with an empty consumer cache, checks English/Spanish help and creates/verifies an instance from the installed CLI. A read-only regression check confirms that Manu's request, original plan, database bytes and directory listing are unchanged; replanning retains the original catalog and specification. See [language-update evidence](language-verification.json).

One existing concurrent-install test encountered the documented initial database-format boundary: a competing process can observe a journal before the MCC header commits. The test now accepts that exact fail-closed response only alongside a successful installer and the final single-project/history checks. Production recovery behavior is unchanged.

## M3.1 verification

119 tests pass, including concurrent identical captures and stale updates, injected rollback, actual process exits leaving hot/cold SQLite journals, scoped retrieval/pagination and fresh CLI processes. `npm run check` checks generated schemas and documentation. Clean package installation repeats the suite and exercises create/verify, file capture, text update, replay, search, history, exact old-version reads and context through the installed CLI and public exports. See [M3.1 evidence](m3.1-verification.json).

Read-only library and Spanish CLI context agree on Manu's existing foundation. Request, original plan, database bytes, project content and directory listing are unchanged; the original plan/digest still match. It still has no captured sources, one verification report and `runtime.invoke: not_run`.

Verification exposed two details now fixed: reopening an initialized store rewrote its header unnecessarily; it now initializes only a new store. Removing that implicit write exposed cold leftover journals, so explicit recovery finalizes them through SQLite's native write/commit path after checking the recorded request. Logical knowledge and builder revisions remain unchanged by recovery. Tests cover both hot and cold journals and all prior M2 checks.

A19 is extended to the local retrieval API. Exact versions, source-only context and inert malicious text provide prerequisites for A03/A05/A18; those full runtime scenarios remain pending. Capture concurrency does not certify A08's future coordinator fencing or A21's external effects.

## M3.2 verification

152 tests, schema equality, documentation checks and clean tarball installation pass. The installed demonstration exercises proposal/grant/activation/revocation, recorded history, exact approved content, independent fork editing and source preflight. Tests cover revoked/expired/wrong-scope/content/wildcard/stale grants, atomic transition/fork rollback, competing transitions, explicit claim validity, same-millisecond ordering, current ACLs on historical sources and derived records, and fresh-process CLI use. [Evidence](m3.2-verification.json).

A05/A06/A22 pass for the local structured review profile; A19 expands to source dependencies of claims/decisions/artifacts. A23 preflight passes, while actual run invalidation/resumption remains M3.4–M3.5. There is no model extraction, semantic fact verification or complete M3 workflow result. A03/A18/A26/A27 runtime integration remains pending.

Review testing found an ACL inheritance issue before release: historical sources contain historical access metadata, so new derived records must intersect current ACLs instead. Creation, editing, forks and retrieval now use current project/source permissions; regression tests cover this. Existing M1 artifact approval testing was updated to call trusted owner scope and assert ordinary-owner denial. Draft artifacts cannot claim prior acceptance.

Read-only review, temporal source queries, source preflight and English/Spanish CLI reads preserve Manu's request, original plan, database bytes, project content and directory listing. No claims, decisions, artifacts or sources were added to his instance; the original plan/digest and foundation evidence are unchanged.

## M3.3 verification and implementation

176 tests and clean tarball installation pass. The installed CLI demo prepares, reads and completes meeting-to-brief and project-status workflows across fresh processes; no model is invoked. [Guide](workflows.md), [evidence](m3.3-verification.json).

New commands: `workflow-prepare`, `workflow-read`, `workflow-complete`. Public exports: `./workflows`, `./sqlite-workflows`, and neutral types/extraction/definitions from the core. Fixed contracts use `0.1.0-local-human`; the owner supplies transcript classification and a four-criterion semantic review with evidence notes. The extractor verifies full non-whitespace coverage, exact quote ranges and provenance. Held-out category/segment evaluations reuse the four existing fixtures without exposing expected answers to the executor. They do not certify semantic truth or automatic model quality.

Both workflows reuse bounded permission-scoped decisions/claims, project context and exact artifact review. Workflow artifacts and metadata stay owner-private; derived knowledge must be owned by the project owner. Context overflow or conflicting source revisions fails explicitly. Snapshot preserves pinned evidence; fresh checks source/project/knowledge revisions and newly added knowledge at acceptance. Source instructions remain quoted data. Meeting agreements never promote decisions or authorize delivery.

Preparation and completion use atomic transactions over the existing C19 Job/Run/capture/artifact records, with persisted next action and exact review attestation. No parallel state file, schema migration, new dependency or catalog activation. Request keys and exact completion payloads replay safely. Rejection records concrete failures and preserves the draft/pending capture. Tests cover forged/stale review, owner/source access, rollback at the final write, concurrent preparation/completion, context overflow and fresh-process recovery of a pending review. Nested read snapshots now join an existing SQLite transaction so shared APIs see coherent state.

Testing caught a freshness gap: checking only pinned revisions misses newly created claims. Acceptance now compares the complete bounded current knowledge membership as well as pinned versions. This has a dedicated regression test. Existing M0–M3.2 checks pass unchanged apart from the development-version assertion.

The general coordinator, step persistence/invalidations, effective fencing, cancellation, runtime budgets and effect mediation remain M3.4. Job/definition budgets are declarations, not enforced asynchronous timeouts. Real runtime invocation and agent continuity remain M3.5–M3.6. Workflow reads already work across local processes but do not complete A26/A27 runtime scenarios. Direct editing or separate approval of a generated artifact invalidates workflow acceptance; prepare corrected work under a new key.

Read-only regression with the new backend preserves Manu's request, original plan, database bytes and directory entries. Replanning retains the original catalog/spec, foundation verification remains, and the instance still contains no sources, claims, decisions, artifacts, jobs, runs or actions. English/Spanish context reads agree. Runtime integration remains not_run.

## M3.4 verification and implementation

208 tests and clean installed-package verification pass. [Guide](coordinator.md), [evidence](m3.4-verification.json), [installed CLI demonstration](../examples/coordinator-demo.mjs). New coordinated job/run version: `0.1.0-coordinated`; old M3.3 workflows remain readable and usable without migration. The existing artifact producer retains its local-human capability contract.

`coordinator-*` commands expose submit/read/claim/renew/pause/advance/review/revise/authorize/cancel/reconcile/retry. Public exports add `./coordinator`, `./sqlite-coordinator` and `./simulated-mailbox`. C19 owns all Job/Run/Step/Action state. Atomic claims pin an executor and epoch; every coordinator write checks the current lease, current job attempt and permissions in its transaction. Step records carry the actual executor and lease epoch. Leases last at most 60 seconds; expiry/release/cancellation fence previous workers. These are per-store guarantees, not cross-database migration or hostile-owner isolation.

Local preparation reuses the M3.3 helper without creating a second job. Five preparation steps form one coherent atomic batch, preceded by committed reservations and an in-flight Action. Exact approval is a separate transaction after persisted human review and its content-bound grant. Steps, attempts and the original wall-clock deadline remain consumed across retry/generation changes. Numeric model token/cost budgets fail closed because no metered runtime is invoked. Failed jobs close when retries are exhausted; blocked work retains a reason and can be cancelled.

Fresh checks now persist invalidated step references and replace only dependent records; unchanged input/extraction records remain for context-only changes. A changed transcript needs explicit current-reference reclassification. Old artifacts and grants stay in history, and unused old approval intents become rejected. Replacement artifacts require new exact review. Snapshot retains pinned versions with current permissions. The fixed helper rebuilds a coherent preparation snapshot, without offering suspension inside that local batch.

The separate simulated delivery job requires an approved artifact and an explicit current grant. The durable target ledger commits receipt evidence under a stable logical key and supports lost responses, no-effect and unavailable modes. Reconciliation verifies target evidence instead of accepting a caller's receipt assertion. Its no-effect proof atomically seals an absent attempt, preventing a late old invocation from delivering after absence was certified. Confirmed/rejected Action data is immutable; optional Action.result stores evidence without a database migration. No real message or external integration is invoked.

Cancellation fences new work immediately and keeps in-flight/unknown effects in cancel_requested until reconciliation. An already delivered effect remains confirmed after cancellation. Revoked context yields a redacted owned execution view, while cancellation/reconciliation remain possible. A narrow storage exception permits owner cancellation of a job without rereading its unchanged pinned inputs; the immutable-input guard still runs. Other access checks are unchanged.

Verification includes independent workers racing for one claim, stale tokens after takeover/renewal, wrong/expired/revoked/wildcard grants, current source permissions, context changes after review, final-write rollback, budgets, cancellation before and after actual simulated delivery, forged receipts, and new-run retry preserving logical action identity. Real process exits test hot and cold local journals and a target commit without a coordinator receipt. Recovery retains one source/capture or one target delivery as appropriate. Tests exposed and corrected receipt-history removal on retry, temporary human-transition executor metadata, terminal job budget derivation and cancellation with revoked input access.

Read-only regression preserves Manu's request, saved plan, database bytes, directory listing, original catalog/spec and foundation verification. There are still no personal sources, claims, decisions, artifacts, jobs, runs or actions in that instance; no simulator store was created there. Runtime invocation remains not_run. Next: M3.5 real runtime, then agent continuity and explicit first use.

## M3.5 verification and implementation

The `CodexRuntime` adapter invokes installed Codex CLI 0.146.0 with existing login, a fixed restricted process profile and closed output schema. The neutral RuntimeAdapter gains optional deadline/abort input and observed metadata output. Agent requests use a pinned runtime definition and existing captured source reference; model classification and cited narrative are attached to a draft only after host validation. No new dependency, database migration, personal source import or saved-plan change. [Guide](codex-runtime.md), [verification](m3.5-verification.json), [actual model results](m3.5-runtime-evaluation.json).

One inference Step belongs to the existing C19 job/run. An exact persisted runtime grant binds actor, job, target version, context hash and time. Current access, grant, lease, deadline and fresh context are rechecked; a heartbeat renews authority and aborts the child when it is lost. Snapshot preparation uses the same pinned versions supplied to inference. Agent snapshot invalidation replaces the runtime step and its entire downstream composition; the original human profile keeps its narrower invalidation graph. Completed validated inference is reused through approval; interrupted computation requires explicit retry and may incur another provider charge. Failed validation retains rejected output/evidence in the private failed-step checkpoint without creating an artifact.

The process uses an ephemeral temporary directory, read-only sandbox, ignored user configuration, a narrow inherited environment, and disabled shell/web/apps/plugins/hooks/agent/memory surfaces supported by this version. Only bounded context is passed to the model, without raw product APIs or test expectations. Unexpected tool events are rejected before accepting output, which is not an undo mechanism. Actual evidence records zero tool events in the final real runs. This is a pinned-profile boundary, not a general hostile-host sandbox or second-runtime guarantee.

239 deterministic tests pass, including output/citation/quote rejection, grants, permissions, snapshot/fresh races, cancellation/abort, stale workers, interrupted inference, budgets, subprocess limits, version mismatch and temporary-file cleanup. Clean installation checks public exports and the clearly marked mock agent demo. Credential-free CI does not claim to invoke Codex.

Seven final real invocations use gpt-5.6-sol: four known meeting fixtures, a project-status case with an active decision and an untested hypothesis, and both workflows through fresh CLI processes using a new transcript. Independent build-agent inspection compared exact output with source/project/knowledge and execution evidence, followed by synthetic test-owner approval. All seven completed without rerunning inference or changing approved bytes. These are synthetic approvals, not an assertion that Manu reviewed personal output.

The four known category fixtures passed after calibration. Earlier classifications and an invalid response failed; those observations are retained in the model-evaluation report. The known fixtures are not a blind benchmark. The separate new transcript preserves an explicit agreement, an unaccepted recommendation and an undecided date. No broad model-accuracy claim follows from these small checks. Initial subprocess failures were not enough evidence to establish a model incompatibility; later explicit-model invocations succeeded. The final report records requested model, CLI/adapter version and prompt/schema/policy hashes. A resolved provider model ID and cost are not inferred when unreported.

Token counts are observed after completed turns. Hard token/cost caps are unavailable and numeric limits remain rejected; interrupted usage can be unknown. Statement generation is English in this profile, preserving original source quotes; broader conversational localization and generated session handoff remain M3.6. Runtime evidence is distinct from M2 foundation verification, and Manu's original instance remains unchanged and unactivated for personal use until M3.7.

## Boundaries M3 must preserve

- The host authenticates and sets `AccessScope`, `can_authorize` and construction authority. These arguments never come from sources or LLM responses. The CLI is a trusted local host without remote authentication.
- M3.4 mediates fixed local effects and verifies the simulator target; M3.5 verifies the bounded Codex profile, while M6 must establish actual external results. The M2 constructor does not coordinate workflows.
- SQLite uses rollback journaling. Planning/inspection reject WAL or a pending journal before attempting recovery. Only authorized apply/resume recovers transactions on an identified MCC store. Incomplete database-format initialization requires explicit repair without replacing unknown files.
- M3.4 enforces leases/fencing through coordinator APIs on one SQLite authority. There is no cross-database fencing/migration, scheduler, export or second runtime. Raw trusted-host APIs are not worker confinement. The A27 harness is neither a sandbox nor a model semantic evaluation.
- M2 adoption is limited to projects already represented in MCC SQLite. It does not claim vault or arbitrary-folder import.
- Replanning does not change ownership or overwrite different managed configurations. M3 must explicitly define any foundation evolution needed to activate capabilities; M5 expands general maintenance.
- `node:sqlite` emits an experimental warning in Node 24.14.1. Other platforms' path rules do not prove compatibility: local evidence is macOS; CI records its own runs.

D20–D29 record these choices, initial deployment and language policy in [decisions.md](decisions.md).

## Next work: M3

1. M3.6: create the compatible-agent conversational entry point and generated handoff from persisted state; verify fresh-session project retrieval and resumption without conversation reconstruction.
2. M3.7: first use of Manu's foundation without replacing its saved plan or importing unrequested personal material.
3. Check M3 scenarios in the [roadmap](implementation-plan.md), extending A15/A19/A27 to the actually invoked target.

At session completion, record the phase, actual commands, results and limits; update handoff, decisions and evidence, and regenerate the documentation inventory. Keep user knowledge and instance state outside the distribution.

[Home](../README.md)
