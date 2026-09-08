# Development handoff

Updated: 2026-09-08. Primary repository: [afmanu/manu-control-center](https://github.com/afmanu/manu-control-center). **M0–M2 and M3.1–M3.2 complete; next step: M3.3.**

## Current instruction

Manu requests a system he can use and has selected this repository as its destination. Verified work and GitHub delivery are authorized. Preserve the initial history and MIT license; earlier documentation folders are snapshots, without automatic synchronization with this repository or the source vault. Another discovery interview is unnecessary.

Manu authorized the next roadmap step after the English-repository update. M3.1 and the subsequently authorized M3.2 are delivered here. Keep repository content in English; runtime interaction and user content may remain Spanish (D24 and [language.md](language.md)).

M3 delivers first agent use; M4 demonstrates another representation and runtime; M5 adds maintenance. Essential M6 integrations may be brought forward from M3.

## Executable status

Private package `manu-control-center@0.1.0-dev.5`, TypeScript/Node 24, exact dependencies and a lockfile. M3.2 adds no dependencies or database migration. Claim validity is an optional draft-schema addition; prior records remain readable. The 22 M1 contracts, SQLite backend with access/revisions/history, and A27 harness remain in place.

M2 adds the `project-knowledge-foundation@0.1.0-draft` catalog, two modules, validated request, resolver and reproducible plan. The adapter checks the real backend in disposable databases, inspects destinations without writes, and applies operations with atomic checkpoints. Adoption reuses MCC SQLite projects with pinned revisions and ownership, preserving content/history.

Operational CLI: `resolve`, `plan`, `inspect`, `apply`, `verify`, `create`, `adopt`, `resume`, plus M0–M1 commands and M3.1 `capture`, `source`, `source-history`, `search`, `context`. Library exports add `./knowledge` and `./sqlite-knowledge` alongside `./builder` and `./local`. The [installation guide](installation.md) covers arguments, examples, recovery and limits; [development](development.md) covers packaging and schemas. Help and error summaries support `--lang en|es`; English is the default. Structured protocols and user data retain their original values.

Each instance stores configuration/catalog, knowledge, construction state and verification reports in separate `store.sqlite` tables. Resources and checkpoints share a transaction. Used construction authorizations are recorded. Reports are retrievable and hash-checked when read. `verified` is limited to `foundation`; `runtime.invoke` remains `not_run`.

New plans have English catalog descriptions. Original M2 plans remain supported without changing their hashes; replanning preserves an existing original catalog. Do not remove this compatibility path while those plans are in use.

M3.1 supplies owner-operated local text/UTF-8 capture (1 MiB maximum), one exact body segment, stable request-key replay and conditional source updates. Source/project/capture records and histories commit atomically. Search is a literal case-sensitive substring over current accessible sources, with bounded excerpts and exact provenance. Source history and revision reads require current project/source access. Context includes purpose/status/responsible/next action and sources, not decisions or generated summaries. See [knowledge guide](knowledge.md).

The capture commands use the trusted M1 knowledge boundary. They do not activate a runtime or expand the M2 construction grant/profile. Captured sources remain unverified; captures remain pending. No personal source import, model invocation or workflow execution occurred. Original catalogs, plan digests, schemas and manifest verification scope remain intact.

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

A01, A02, A16 and A17 pass for the supported local target. A15/A19 pass for the installation profile and need expansion with runtimes/other backends. A27 still passes as a harness API boundary. Other system workflows remain pending.

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

## Boundaries M3 must preserve

- The host authenticates and sets `AccessScope`, `can_authorize` and construction authority. These arguments never come from sources or LLM responses. The CLI is a trusted local host without remote authentication.
- M1 action receipts are structured references; M3 must mediate invocation and test the target result. The M2 constructor does not coordinate workflows.
- SQLite uses rollback journaling. Planning/inspection reject WAL or a pending journal before attempting recovery. Only authorized apply/resume recovers transactions on an identified MCC store. Incomplete database-format initialization requires explicit repair without replacing unknown files.
- There is no distributed fencing, scheduler, export or second backend/runtime. The M1 monotonicity guard is not an effective lease. The A27 harness is neither a sandbox nor a model semantic evaluation.
- M2 adoption is limited to projects already represented in MCC SQLite. It does not claim vault or arbitrary-folder import.
- Replanning does not change ownership or overwrite different managed configurations. M3 must explicitly define any foundation evolution needed to activate capabilities; M5 expands general maintenance.
- `node:sqlite` emits an experimental warning in Node 24.14.1. Other platforms' path rules do not prove compatibility: local evidence is macOS; CI records its own runs.

D20–D26 record these choices, initial deployment and language policy in [decisions.md](decisions.md).

## Next work: M3

1. M3.3: implement meeting → brief and project summary using shared capture/retrieval/review capabilities and the isolated evaluator. Start with synthetic cases and preserve proposal/decision authority.
2. M3.4: durable coordinator, checkpoints, cancellation, budgets and effect control; consume source preflight and persist invalidation rather than treating it as already implemented.
3. M3.5–M3.7: real runtime adapter, continuity from another session and first use of Manu's foundation instance.
4. Check M3 scenarios in the [roadmap](implementation-plan.md), extending A15/A19/A27 to the actually invoked target.

At session completion, record the phase, actual commands, results and limits; update handoff, decisions and evidence, and regenerate the documentation inventory. Keep user knowledge and instance state outside the distribution.

[Home](../README.md)
