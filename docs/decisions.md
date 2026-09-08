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
