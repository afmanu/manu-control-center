# Scope decisions and implementation choices

## Current scope

| ID | Decision | Rationale and consequence |
|---|---|---|
| D01 | Separate builder product, specification and instance. | Create many systems without mixing distribution and private memory. |
| D02 | Keep the model independent of backend, interface and runtime. | Obsidian and specific ecosystems are adaptable targets, not core rules. |
| D03 | Give the kernel, knowledge, state, skills, workflows and evals explicit responsibilities. | Another session can understand and continue work without depending on chat. |
| D04 | One logical authority per responsibility, with revisions and provenance. | Avoid contradictory state maintained by different agents. |
| D05 | Planning, application and verification are distinct operations. | A generated package does not demonstrate a working installation. |
| D06 | Scoped permissions and effect control. | Tool availability does not grant unlimited use; preserve valid prior authorization. |
| D07 | Contracts backed by mechanisms and evidence. | Markdown instructions do not replace validators, transactions or evaluations. |
| D08 | Adoption and updates preserve data and customizations. | Evolution does not reinstall a template over the user's work. |
| D09 | Verify portability early with two representations and two runtimes. | Abstractions must withstand a second target before claiming generality. |
| D10 | Develop incrementally through useful end-to-end paths. | Thirty services, a gateway or multiple agents are not prerequisites. |
| D11 | Explain the construction as an independent project. | The main architecture is understandable without attributing every component to its predecessors. |

D01–D11 summarize the user's instructions and the reference design already developed. They do not establish approval of every field name or technology introduced in this handoff.

### D12 — Execution priority and first user

Status: **adopted by current user instruction**, 2026-09-08. Manu requests a repository he can use and a phased roadmap, without starting another discovery process.

Keep a reusable builder and use his instance as the first pilot. The planning session delivered the [implementation roadmap](implementation-plan.md); subsequent software status is recorded in the handoff. The plan puts first use in M3 and allows necessary integrations from that point. This sequence and the second project-summary workflow are technical planning decisions, not explicit user choices of technology or business priority.

## Technical proposals in this handoff

The detailed contracts in `contracts.md`, `execution.md` and the examples form an implementation baseline. The M0–M6 roadmap defines their order, deliverables and checks. Identifiers, enums and file layout may change through a technical decision that preserves meaning and updates tests. Initial `0.1.0-draft` versions avoid presenting them as a stable API.

The proposed first case is a synthetic project that turns a meeting into a supported brief and retains decisions and continuity. External delivery is simulated to test connector failures; a real send requires its integration and corresponding authorization.

## Technical choices and resolution

| Choice | Criterion | Resolution point |
|---|---|---|
| Language and packaging | TypeScript/Node, npm and native tests; pinned dependencies. | Adopted in M0, D14. |
| First backend | Local SQLite with instance/actor scope, conditional revisions, history and atomicity. | Engine in M0; reference implementation in M1, D17; instance in M2. |
| Second backend | The roadmap proposes documents versus records. Changing only the engine behind the same facade does not count. Separate knowledge and state storage if the adapter requires it. | Design the test in M1; implement in M4. |
| First runtime | Codex as candidate; executable observed, product adapter and invocation pending. | M0 candidate; demonstrate in M3. |
| Second runtime | Claude Code as candidate; a different host with real handoff tests. | M0 candidate; demonstrate in M4. |
| Schemas and versioning | JSON Schema draft-07 and Ajv, 22 `0.1.0-draft` contracts; `0.2.0-draft` eval fixtures. | M0 baseline; M1 models and invariants, D16 and D18. |
| License, name and remote | Preserve MIT and the operational repository name chosen by Manu: private `afmanu/manu-control-center`. npm publication disabled. | Repository resolved in M0, D13; future public distribution is separate. |
| Gateway, scheduler and additional UI | Only for a use case that needs them, with defined acceptance. | M6. |

Neutrality does not require implementing every provider. It requires honest boundaries, substitution through contracts and tests for declared targets.

## Implementation decisions — M0

### D13 — Primary repository

Status: **adopted**, 2026-09-08. Context: Manu requests direct development in [afmanu/manu-control-center](https://github.com/afmanu/manu-control-center). The repository contains an initial commit and an MIT license.

Choice: work in a clone, integrate documentation and code at its root, preserve the license/history, and push the verified delivery. Use `manu-control-center` as the operational name. Rejected alternative: another remote or two active repositories. Consequence: earlier documentation folders become snapshots without automatic synchronization. The current instruction authorizes GitHub delivery, not an npm publication or content in external applications. Checks: remote/visibility/permissions, diff, absence of instance data and verification of the remote commit.

### D14 — Minimal stack and contracts

Status: **adopted**, 2026-09-08. Choice: TypeScript 7.0.2, Node 24 with 24.14.1 pinned for development, npm, JSON Schema draft-07 with Ajv 8.20.0/ajv-formats 3.0.1, and native `node:test`. Node types 24.13.3. Exact direct dependencies and a lockfile. Modular application with a library and CLI.

Rationale: one language for the core, CLI and future adapters, simple installation and tests without an additional framework. Alternatives: Python with SQLite and a CLI, or multiple services from the start. Python remains conceptually valid; one toolchain is selected to begin. M0 does not need a distributed service.

SQLite is the selected local engine. M0 uses `node:sqlite` for a disposable probe checking reopening, conditional updates between connections and rollback. The module is experimental in the pinned Node version and remains encapsulated; M1 may replace its API if backend evaluation warrants it. These tests do not yet demonstrate authorization, instance isolation, history or worker coordination.

Adopted contract: `RecordEnvelope@0.1.0-draft` contains metadata only; IDs and revisions are opaque strings, with normalized UTC timestamps and valid temporal ordering. Entity models arrive in M1. Metadata validation does not establish semantics or permissions. Checks: 18 tests, clean installation from the lockfile and invocation of the installed package.

Technical references consulted: [TypeScript configuration](https://www.typescriptlang.org/tsconfig/), [JSON Schema in Ajv](https://ajv.js.org/json-schema.html) and [Node 24 SQLite](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html). Local versions and capabilities are evidenced by execution, not presumed equivalent to later-version documentation.

### D15 — Local instance and runtime candidates

Status: **adopted for the pilot; integrations pending**, 2026-09-08. Instance data will use the local application data directory, with an absolute override through `MANU_CONTROL_CENTER_DATA_DIR`. M0 resolves the path without creating an instance. Folder synchronization is not authority transfer or writer exclusion.

Codex is the first candidate and Claude Code the second: their executables and versions were observed. M3 must implement/test the first adapter; M4 the second. An executable does not establish authentication, model access, tool permissions or compatibility. Proposed second backend: documents with explicit identities, resolving operational storage separately if necessary. Alternatives: impose a vault or execute jobs from multiple synced copies; preserve the kernel boundary and start with one responsible host.

Current checks: path resolution, rejection of relative overrides and diagnosis without private-data creation. Pending: real runtime access, context/outputs, effect mediation and portability through M3/M4 scenarios.

## Implementation decisions — M1

### D16 — Executable contracts, references and hashes

Status: **adopted**, 2026-09-08. Context: M2 needs to compose configurations and plans over identifiable entities. Choice: TypeScript types, 22 closed draft-07 schemas generated from one code source, semantic validation and joint construction checking. The package becomes `0.1.0-dev.1`; contracts remain `0.1.0-draft`, without a stable API promise. `InstanceSpec` adds a revision to pin manifests to an exact version. Records separate metadata, access and type-specific data.

JSON hashing sorts keys and rejects non-JSON values; artifacts retain exact UTF-8 hashes. Effect identity depends on instance/job/step/name, excluding run, attempt and content; reusing it for another payload or destination is a conflict. Deliberate repeated occurrences need distinct logical identities. Rejected alternatives: titles/paths as identities, attempt numbers in effect keys or duplicate manually editable schemas. Consequence: the CLI validates declarations, but M2 must inspect real capabilities. Tests: valid/negative contracts, graphs, composition, hashes and generated-schema consistency.

### D17 — SQLite backend with trusted scope and conditional writes

Status: **adopted**, 2026-09-08. Choice: encapsulated `node:sqlite` in a local backend with transactions, immutable revision history, instance/actor SQL filters before pagination and owner/ACL write control. Historical access follows current permissions. Only a host with `can_authorize` issues grants; promotion and effect start verify the persisted grant and its current revision.

Rejected alternatives: filtering after retrieval, rewriting documents without expected revisions or deriving authority from source text. Consequences: the host authenticates scope; the backend is neither a sandbox nor a barrier against direct file access. It declares `export_import: false` and `distributed_fencing: false`. Token monotonicity does not replace M3 coordination/leases. Tests: isolation, permissions/revocation, history, references, grants, deduplication, reopening and a race between two connections in separate workers.

### D18 — Normalized fixtures and harness separation

Status: **adopted**, 2026-09-08. Choice: `0.2.0-draft` fixtures with uniform `input` and evaluator-only `expected`. `runEvalCase` validates and clones before invocation; the executor receives only `input`. Contradictory sources and malicious instructions join examples with/without decisions. Rejected alternative: pass the complete fixture to the executor. Consequence: A27 passes as an API boundary; hostile-code isolation and model semantic quality are unproven. Tests: expectation-only marker, copy mutation and invalid formats that never reach the executor. M3 must integrate the runtime and semantic evaluation.

### D19 — Transfer design with authority and exact definitions

Status: **adopted as a contract; transfer pending**, 2026-09-08. Choice: `transfer_plan` distinguishes migration, copy and restore; it includes declared authority, revisions, secret references and executable definitions with versions/hashes, content or locators, and dependency closure. Copies require a new identity and inactive jobs; activation requires a declared frozen source. Rejected alternative: copy only records and assume the destination has equivalent capabilities.

Consequence: validators detect plan contradictions but do not freeze a host or prove remote availability. M4 will implement export/import, effective authority transfer and blocking for missing dependencies. Current tests: modes, identities, activation, content integrity and dependency graphs.

## Implementation decisions — M2

### D20 — Installable profile before the runtime

Status: **adopted**, 2026-09-08. Choice: `project-knowledge-foundation@0.1.0-draft`, with `project-context` and `installation-verification` modules, as the initial construction profile. It resolves identities, versions and policies; installs configuration, catalog and a project. Selecting codex/claude-code/unconfigured records intent and the integration contract version, without claiming an executable version or invoked capabilities. Rejected alternative: declare the workflow blueprint operational before M3. Consequence: `verified` has `foundation` scope; runtime is an optional `not_run` check in this milestone. Tests: reproducible resolution, rejection of missing required capabilities, two-instance installation and installed-package use.

### D21 — Conservative plans and construction transactions

Status: **adopted**, 2026-09-08. Choice: neutral planner in `builder/`; filesystem and SQLite in adapters. Pin canonical destinations, revisions and resource ownership. Validation reconstructs the plan from the supported catalog with a content digest; it does not execute arbitrary file instructions. Inspection reads without initializing tables. A resource and its checkpoint share a transaction with the knowledge backend in tables with distinct responsibilities.

Rejected alternatives: write the resource first and checkpoint in another database, infer adoption from titles or retry creation without checking receipts. Consequences: resumption preserves the same plan; observed changes yield `STALE_PLAN`; a different request cannot replace a partial plan. Adoption preserves the exact record and pins `shared`/`user_owned`; it neither imports other representations nor promotes ownership during replanning. Tests: A01/A02/A16/A17, two concurrent processes, rollback and actual interruption inside/after a transaction.

### D22 — Authority, evidence and local recovery

Status: **adopted**, 2026-09-08. Choice: explicit CLI invocation supplies host authority bound to actor, instance, digest, destination, effect and expiry. The library requires this object and validates it before writing and on every operation; used grants are recorded in construction state. This is neither remote authentication nor a cryptographic plan signature. The host must mediate identity and future runtime input.

Verification retains reports with Node/SQLite versions, observed revisions, outcomes, timestamps and hashes. `inspect` retrieves evidence and checks integrity. Configuration and catalog are checked against resolution; later authorized knowledge changes are not rewritten to restore initial text.

M2 supports rollback journaling. WAL is detected through its [documented header](https://www.sqlite.org/fileformat.html#the_database_header) before inspection opens and is rejected without conversion. If interruption leaves a journal, planning/inspection reports a conflict without repair; host-authorized apply/resume allows native SQLite recovery before checking recorded scope. This technical recovery invokes no external tools. Initialization without a valid MCC identity is left for explicit repair, preserving files. Rejected alternative: delete journals or describe write-producing recovery as pure inspection. Tests: byte/directory comparisons around inspection, WAL rejection, transaction recovery and CLI commands in fresh processes.

### D23 — Manu's local foundation

Status: **adopted as initial configuration**, 2026-09-08. Context: Manu authorizes continued construction and preparation of his instance. Reversible choice: local identity/owner `manu`, project `manu-control-center` with the purpose of building this system, and a destination in the application data directory, separate from the repository. Original request and plan are saved with local configuration and applied without replacing existing files.

Consequence: installation is verified as `foundation`; it contains no personal sources or invoked agent. M3 completes first use while preserving this foundation. Initial identities are deployment choices, not authentication or business decisions attributed to the user. Evidence: plan application, five required checks passed and `runtime.invoke: not_run`.

### D24 — English repository and independent runtime language

Status: **adopted by explicit user instruction**, 2026-09-08. Context: before continuing to M3, Manu requires the GitHub repository to be in English while allowing Spanish during use. Choice: translate maintained documentation, background reviews, examples and development metadata; maintain English in future changes. The CLI defaults to English and offers Spanish help/error summaries through `--lang es` or `MANU_CONTROL_CENTER_LANG=es`.

Keep machine protocols, canonical diagnostics, user content and stored identity/hash values unchanged. Localization resources, exact historical source locators and immutable compatibility labels retain their necessary original language. Old M2 catalog descriptions participate in plan digests, so the builder accepts the exact original catalog as well as the English metadata variant and preserves it when replanning an existing instance. It still reconstructs and validates the whole plan against trusted definitions. No version migration, private-data translation or M3 runtime capability is implied.

Rejected alternatives: invalidate saved plans, rewrite private instances, translate protocol keys or rewrite Git history. Consequences: package `0.1.0-dev.3`; executable contracts remain unchanged. Historical inventories/evidence retain their original source hashes, with translation provenance in [language.md](language.md). Checks: locale selection and invalid-input rejection, unchanged plans across languages, legacy plan application/resumption/replanning, rejection of forged catalogs, read-only inspection of Manu's existing instance, 98 tests and clean package installation. The concurrent-install test now recognizes the documented initialization-in-progress rejection while still requiring successful convergence; production recovery logic is unchanged. See [verification evidence](language-verification.json).

## Recording new decisions

Include ID, status (`proposed`, `adopted`, `superseded`), context, choice, alternatives, consequences, affected contracts/tests and date. Reversible local choices may be made during authorized work. Changes of objective and publication commitments belong to the user.

[Home](../README.md)


## Implementation decisions — M3

### D25 — Atomic local capture and permission-scoped source retrieval

Status: **adopted**, 2026-09-08. Context: Manu authorized the next roadmap step on the existing foundation. M3.1 needs a usable capture/query path before extraction, temporal authority and runtime orchestration. Choice: synchronous neutral knowledge request/result types, SQLite composition and a trusted-owner local CLI. Package `0.1.0-dev.4`; no new dependency, schema migration, catalog activation or plan rewrite.

Explicit text or one regular UTF-8 file (up to 1 MiB) becomes one exact `body` segment in an unverified local source plus a pending capture. Snapshot availability/observation times do not assert the validity of its claims. A canonical file URL or text locator records origin; identities are explicit. The source update, project reference, capture and histories share `BEGIN IMMEDIATE`. Expected revisions prevent stale replacement. A request key is scoped to instance/actor and replay checks exact source/project/locator/content against the pinned source; changed intent conflicts. New keys may record unchanged content without duplicating source revisions. Existing source order is preserved.

Queries enforce current project and source ACLs before content matching and pagination; exact historical reads still require current access. Search is literal and case-sensitive, current-only, with bounded excerpts, stable per-record references and explicit coverage. Context returns current purpose/status/responsible/next action and sources, omitting raw restricted reference lists. There is no ranking, decision-aware answer, automatic ingestion or implicit promotion. Each read call uses a read-only snapshot; pagination across calls can observe new writes.

The CLI is an explicit local owner action on the trusted M1 data API. M2 `instance.install` grants and foundation verification stay construction-scoped. This entry point does not claim runtime capability, authentication or effect-layer mediation: M3.4–M3.5 must provide those boundaries for agent invocation. The kernel does not depend on files or SQLite; platform capture and transaction ownership remain adapter responsibilities. The adapter-only composition helper is not a root public export.

Rejected alternatives: import the entire vault, infer identities from paths, split/normalize text and lose exact bytes, expose source IDs through unfiltered project reference lists, silently overwrite stale sources, or mark a runtime operational from local CRUD tests. Consequences: owner-only local commands, current literal search and exact revision retrieval are usable now; semantic/temporal decisions and real-runtime defenses remain later M3 work. Existing Manu data and its saved construction plan remain unchanged.

Verification found that initialized SQLite connections need no repeated DDL/header write. Initialization now runs only for a new database. Explicit authorized recovery still finalizes hot and cold interrupted journals through native SQLite recovery/commit, without deleting journals or changing logical revisions. Checks: 119 tests, including real process exits, concurrent captures/updates, rollback at the last write, UTF-8 fidelity and limits, revoked permissions, CLI options and fresh-process retrieval; clean tarball consumer exercises the same public path. Read-only regression preserves Manu's request, plan, database and directory listing. [Guide](knowledge.md), [evidence](m3.1-verification.json).


### D26 — Explicit authority, recorded time and exact artifact review

Status: **adopted**, 2026-09-08. Context: Manu authorizes M3.2 after local capture/query delivery. Choice: a typed review API over existing entities, synchronous SQLite transactions and explicit trusted-owner CLI commands. Package `0.1.0-dev.5`; no new dependency, database migration, catalog replacement or original-plan rewrite.

Intake supports declared assertions, hypotheses and proposals with exact evidence. It cannot confer confirmation or decision authority. Optional claim validity adds a half-open declared interval to the draft schema; old claims remain valid with unknown applicability. One identity represents an assertion/interval, and revisions correct it. Temporal reads select the latest recorded version at/before an explicit UTC millisecond cutoff, using append order to resolve equal timestamps, then apply requested validity/text filters. Current ACLs apply before matching and pagination, including every pinned source of derived content. Unknown validity is excluded from validity-filtered results with explicit coverage; observation dates and semantic truth are not inferred. A record's superseded revision is never a fallback for a validity mismatch.

Decision grants bind actor, instance, resource, destination, operation, exact content and expiry. The review entry point rejects wildcard content grants even though the lower-level M1 model still represents them. Grant creation/revocation requires trusted issuer scope; applying a decision uses the current persisted grant and expected decision revision. The transition and active project reference commit atomically. Promotion preserves pinned evidence; source freshness can be checked before authorization. A status-change grant permits revocation or supersession but no edit to the choice. Revoking a grant blocks future use without rewriting an already accepted decision.

Artifact approval is explicit trusted-owner authority, enforced in the SQLite backend as well as the local profile. The backend stamps acceptance and preserves content/hash; draft acceptance timestamps are rejected. Approved data remains immutable. An exact approved reference can create an independent draft plus a `revision_of` relation in one transaction. Source preflight reads real pinned/current versions: snapshot retains history, fresh returns changed refs and invalidation. Fresh artifact approval blocks stale evidence without silently updating the reviewed content. Real job/step invalidation and invocation remain M3.4–M3.5.

Derived records inherit current project/source ACL intersections, not ACLs copied from historical snapshots; edits/forks cannot widen narrowed access. This distinction was caught by a negative test and corrected before delivery. Existing M1 artifact approval tests now explicitly exercise trusted owner scope and ordinary-owner denial. Other prior construction/capture checks remain in the full suite.

Rejected alternatives: infer authority from transcript wording, replace an approved document in place, fabricate missing validity, claim semantic fact verification from filtering, change installed catalog hashes, or treat a preflight response as a completed coordinator/runtime. Consequences: local review is usable, while semantic extraction, contradiction resolution, workflow coordination and real-runtime confinement remain distinct later work. Low-level host APIs still require a trusted caller and are not a sandbox.

Checks: 152 tests; valid/negative grant cases, byte-exact artifacts and forks, injected transaction failures, competing transitions, source policy changes, explicit validity and recorded history, current access on historical/derived content, CLI localization/strict inputs, clean tarball consumer and read-only existing-instance regression. [Review guide](review.md), [evidence](m3.2-verification.json).

### D27 — Two composable local workflows with explicit human semantic review

Status: **adopted**, 2026-09-08. Context: Manu authorizes M3.3 on the existing repository; the roadmap assigns real runtime invocation to M3.5. Choice: deliver `meeting-to-brief` and `project-status` as fixed local human-reviewed compositions now, with neutral contracts and shared retrieval/extraction/draft/review capabilities. Package `0.1.0-dev.6`; no dependency, database migration, catalog activation or original-plan rewrite.

The owner supplies complete transcript classifications as exact segment ranges. Extraction validates non-overlapping non-whitespace coverage and copies literal text with source/segment/revision references. Categories retain agreements, proposals, questions, conflicts and context. No heuristic or canned fixture answer is presented as semantic understanding. Project status copies persisted project fields and knowledge with authority/uncertainty labels. Both use the same bounded current-access retrieval, canonical JSON artifact and explicit human review. Owner notes attest classification, uncertainty, unsupported assertions and inert source instructions against the exact artifact revision/hash. The backend validates this attestation's binding/structure, not the truth of the human judgment. Classifier and reviewer may be the same owner.

The SQLite adapter atomically prepares inline capture, artifact, Job and Run with a waiting-input checkpoint; completion atomically approves unchanged bytes, integrates the relevant capture and closes the run/job, or records a concrete rejection without acceptance. Stable request keys bind exact input; identical completions replay. Current permissions are rechecked even for snapshots. Fresh additionally checks project/source/knowledge revisions and new knowledge membership; the latter was added after testing exposed the omission. The existing read snapshot helper joins an active transaction, permitting composition without inconsistent reads or nested BEGIN errors. C19 retains the sole state authority; these synchronous commands are not a general scheduler/coordinator.

Workflow metadata/artifacts remain owner-private. Derived decisions/claims must be project-owner-held: generic artifact dependencies currently track sources, so copying revocable records owned by others would need a richer dependency contract. More than 50 decisions or claims, 100 source identities, conflicting revisions for one source, 200 selections or 1 MiB content fails explicitly. Definition/job budgets remain declarations until M3.4 enforces coordination/usage. Source text grants no permission; artifact acceptance neither promotes decisions nor invokes delivery.

Rejected alternatives: implement model invocation ahead of its roadmap step, classify prose with brittle approval keywords, drop contradictory text, approve based on a structural check, persist a second workflow state file, silently refresh an already reviewed artifact, or claim a local human review as a model benchmark. Consequences: useful workflows are callable now; dynamic interpretation, durable steps, fencing, cancellation, invalidation/recomputation and effect mediation remain M3.4. M3.5 must demonstrate and evaluate the actual runtime using these contracts. The foundation profile remains unchanged.

Checks: 176 tests, four fixture category/segment evaluations with held-out expected material, exact citations and review binding, negative authority/freshness/access/coverage cases, final-write rollback, concurrent identical requests/completions, fresh-process CLI use, clean tarball consumer and read-only original-instance regression. Semantic meanings and forbidden assertions require the human rubric; the evaluator is not a sandbox. [Guide](workflows.md), [evidence](m3.3-verification.json).

### D28 — One coordinated state authority, fenced local work and verified simulated effects

Status: **adopted**, 2026-09-08. Context: Manu authorizes M3.4 after delivery of the two local human workflows. Choice: add a fixed-profile coordinator over existing C19 Job/Run/Step/Action records in SQLite, with owner-bound CLI operations, atomic claims, renewable short leases, monotonic epochs, current-attempt guards and enforced reservation/retry/deadline limits. Package `0.1.0-dev.7`; no new dependency, database migration, foundation activation or saved-plan rewrite. Old M3.3 commands/runs remain compatible; new coordinated runs use `0.1.0-coordinated`.

Factor the existing workflow adapter into shared artifact preparation and approval helpers without a nested second job. Commit reservations and the effect intent before work. The five local preparation stages and their confirmation form one atomic transaction; explicit semantic review precedes the separately authorized approval transaction. A local crash therefore leaves either a confirmed result or an uncommitted effect that can be proven rolled back after fencing the old executor. Durable steps identify their actual executor and lease epoch. The synchronous preparation batch is intentionally not interruptible between its inner operations.

C21 dispatches only fixed registered operations. Grants bind exact actor/resource/operation/destination/content/time and are checked immediately before invocation or mutation. Sources cannot issue grants. Simulator delivery is a separate job from artifact acceptance. The logical effect key excludes worker/run attempts; retries preserve intent, counters and all receipt references. Confirmed/rejected Action data is immutable; an optional result object stores observed evidence, preserving compatibility with prior records. A target response alone is insufficient: the registered simulator verifies receipts against its durable ledger.

The simulator atomically seals an absent attempt before proving no effect. A late old invocation cannot deliver that sealed attempt; a new bounded attempt retains the same logical identity. Lost or unverifiable responses remain unknown. Cancellation invalidates ownership and stops new steps while retaining uncertainty until reconciliation. A target may finish an already dispatched operation after lease expiry, revocation or cancellation; old workers cannot confirm new C19 writes, and no undo is implied. Real M6 targets must demonstrate their own equivalent evidence/idempotency semantics.

Fresh context invalidates the transitive dependent-step set, retaining old step references, reasons, source history and artifacts. Supporting-context changes retain valid input/extraction records; transcript changes require explicit human reclassification against the current revision. Old unused acceptance intents are rejected, and replacement content needs new review. The shared helper recomputes a coherent local snapshot for replacement output. Snapshot jobs keep pinned revisions with current permission checks. This is not arbitrary workflow interpretation or automatic semantic contradiction resolution.

Budget reservations survive failures and retries; the original wall-clock deadline includes human review. Model token/cost budgets fail closed when numeric because this profile has no metered runtime. Reconciliation remains possible after budget exhaustion. A failed job closes when retry budget is exhausted; otherwise a new run explicitly references the prior attempt. Coordinator-owned execution metadata can be read in redacted form after context revocation so the owner can cancel/reconcile without regaining source access. The storage cancellation exception skips rereading only unchanged job inputs after the existing immutable-input guard; it does not grant new source access or permit new references.

Rejected alternatives: copy workflow state into a second JSON ledger, trust only instruction text for fencing, make a lease token a substitute for host identity, reset budgets when retrying, accept fabricated receipt assertions, infer no effect from a timeout/empty lookup, reuse an approval for fresh replacement content, or claim the simulator as a real mail integration. Consequences: local coordinator mechanisms and simulator scenarios are usable now; M3.5 must provide actual runtime invocation, metering and tool mediation, and M4/M6 must establish additional host/backend/target semantics.

Checks: 208 tests, installed CLI examples for both workflows and response-loss reconciliation, independent competing workers, exact source/review/grant guards, cancellation/deadline races, current-access redaction, failed local transaction recovery and stable-key retries. Actual process exits exercise hot/cold journals and a committed target effect with no local receipt. Read-only checks retain Manu's original instance and plans. [Guide](coordinator.md), [evidence](m3.4-verification.json). A08/A10/A20/A21/A23 apply to this local authority and A09 to the named simulator; A26/A27 real-runtime evidence is still pending.

### D29 — Codex as a bounded synthesis runtime with owner-reviewed output

Status: **adopted**, 2026-09-08. Context: Manu explicitly requests M3.5 using Codex, integrating and verifying the two existing workflows while maintaining English repository content. Choice: implement the neutral RuntimeAdapter contract through installed Codex CLI 0.146.0 (`codex@0.146.0-mcc.1`). Reuse the user's Codex authentication. Package `0.1.0-dev.8`; no new dependency, database migration, saved-plan replacement or personal source ingestion.

The trusted host builds one bounded authorized snapshot, pins an exact runtime grant, reserves an inference Step in C19 and invokes Codex without giving it direct product tools. The fixed CLI profile uses a disposable working directory, read-only sandbox, closed response schema, ignored user configuration, ephemeral execution and disabled auxiliary tool surfaces. It inherits a small explicit environment allowlist. Actual tested invocations, rather than instructions alone, establish the stated profile boundary. Unexpected tool events prevent output acceptance; that postcondition does not undo a tool effect. No guarantee against arbitrary future runtimes, hostile host code or all possible operating-system access is implied.

Codex performs classification and narrative synthesis. The kernel validates ordered exact quotes, full transcript coverage, closed fields and known citation IDs. Valid citation identity is not proof of semantic support. Exact owner review remains mandatory before existing C21 artifact-approval effects; model output cannot grant authority, promote a decision or deliver externally. Repository narratives/examples remain English; source quotes are never translated to satisfy a locale. Conversational entry points and broader localization remain M3.6.

Agent run definitions use `0.1.0-coordinated-agent`, with the separate `0.1.0-agent` producer contract and a declared inference step. Runtime output/checkpoints, budgets and history live in C19. No second editable execution ledger is introduced. Snapshot output uses the exact same versions supplied to Codex. Fresh context checks include current revisions and bounded knowledge membership before dispatch, after inference and before artifact creation. Existing invalidation replaces dependent output and requires renewed grants/review. Runtime responses record prompt/schema/policy hashes, runtime version, requested model/default selection, output/event hashes, elapsed time and reported token usage.

Inference is a computation with an explicit content-bound authorization, not a domain mutation or an idempotent delivery Action. An interrupted call may consume provider usage. An old worker cannot commit after cancellation, takeover or revocation. A heartbeat aborts the live child when current authority is lost; a later takeover fails an unfinished inference rather than silently repeating it. Explicit retries preserve budgets and may incur another charge. Completed validated inference is reused; a semantic correction to its already prepared request requires new work, not a claim that retrying unchanged input fixes it. Invalid responses remain failed-step evidence without becoming artifacts.

Hard token/cost caps remain unavailable in this CLI profile, so numeric limits are rejected. Reported token counts are post-turn observations; unknown usage and cost stay unknown. Step/attempt/deadline limits remain enforced. Construction verification remains foundation-scoped; this adapter's invocation evidence does not rewrite Manu's original plan or activate his personal instance.

Rejected alternatives: an API key owned by the product as a prerequisite, a new scheduler/runtime service, model-selected host tools or grants, hiding failed evaluations, labeling mock installation checks as real invocation, inferring monetary idempotency from a missing artifact, or treating the four calibration fixtures as an independent semantic benchmark. Verification separates deterministic tests, actual Codex execution, fixture classification diagnostics and independent review of exact synthetic artifacts. The [runtime guide](codex-runtime.md) and M3.5 evidence record the tested combination and observed limits.

### D30 — Regenerable session handoff and a trusted-host Codex operating skill

Status: **adopted**, 2026-09-09. Manu authorized continuing from M3.5 to M3.6. Package `0.1.0-dev.9` adds `session`, `session-continue`, the neutral session query/action types, SQLite projection and a packaged `.agents/skills/manu-control-center` entry point. No new product dependency, schema migration, global skill installation, personal activation or modification of the original construction plan.

The handoff is generated in one read-only snapshot from current accessible project/knowledge and C19 records. It preserves exact references, authority distinctions, pending captures and the latest attempt per coordinator job. Current dependency access gates derived content; revoked context exposes only owned execution metadata. Independent keyset cursors and explicit byte/omission limits keep partial coverage visible. The view is neither an editable execution ledger nor a grant. Older human-only runs retain their original read API.

Continuation accepts an exact run revision and executor identity, claims atomically through the coordinator, then advances one existing knowledge step. It does not issue grants, accept a draft, retry failures or deliver. Persisted exact owner review can be completed in a fresh session without new inference. Current source/authority/budget/fencing checks remain with the coordinator; advisory handoff status is not preauthorization.

The skill routes natural-language requests to capture, query, draft, review and continuation commands using a trusted host binding. It answers in the user's language while preserving protocol keys, original source content and approved bytes. Repository skill discovery follows official Codex documentation; an explicit-path invocation is also supported. The helper is relocatable and included in clean package verification. It does not search private folders, install itself globally or infer an instance binding from source content.

This conversational runtime is shell-capable and trusted, unlike the tool-disabled M3.5 synthesis subprocess. Skill rules are operating guidance, not confinement. CLI owner identity remains host configuration rather than remote authentication. Actual fresh Codex sessions must demonstrate retrieval and resumption without chat history; read-only and mutation effects are inspected separately. Synthetic independent review is not personal approval by Manu, and one successful malicious-note case does not establish universal injection resistance.

Rejected alternatives: copying C19 into a mutable handoff file, automatically approving or retrying on a broad continuation request, silently translating stored artifacts, hiding pagination, or claiming a shell-capable agent is confined by its skill. Tests cover read-only bytes, revisions, lease/deadline advice, latest attempts, scopes, redaction, pagination, bounded artifacts and fresh-process continuation. [Guide](sessions.md), [verification](m3.6-verification.json), [actual evaluation](m3.6-runtime-evaluation.json). M3.7 remains the next step for personal activation.
