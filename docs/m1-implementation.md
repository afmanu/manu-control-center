# M1 executable scope

Package version: `0.1.0-dev.1`. Contracts: `0.1.0-draft`, subject to revision before a stable API. This document preserves the scope delivered in M1. Subsequent construction is described in [M2 installation](installation.md).

## Contracts and composition

[models.ts](../core/models.ts) defines types; [schema-definitions.ts](../core/schema-definitions.ts) generates the [JSON schemas](../schemas/contracts.schema.json). [validation.ts](../core/validation.ts) adds semantic invariants. The 22 contracts are:

| Group | Contracts |
|---|---|
| Construction | `need`, `module`, `blueprint`, `instance_spec`, `plan`, `manifest` |
| Knowledge | `project`, `source`, `capture`, `claim`, `decision`, `artifact`, `relation` |
| Execution and authorization | `authorization`, `job`, `run`, `step`, `action` |
| Definitions | `skill`, `workflow` |
| Portability and evaluation | `transfer_plan`, `eval_fixture` |

Stored records combine `RecordEnvelope` metadata with `kind`, `access` and `data`. `access` declares `owner_id`, `readers` and `writers`; writers may also read. `NewRecord` omits backend-generated revisions/timestamps. `Ref` pins an ID/revision; `VersionRef` pins a definition's ID/version. `InstanceSpec.revision` lets the manifest reference the applied specification.

States use English enums: claim `declared/hypothesis/proposed/confirmed/refuted`; capture `pending/integrated/discarded`; decision `proposed/active/superseded/revoked`; artifact `draft/approved`. Descriptive state names explain these meanings without introducing extra fields.

`assertConstructionBundle` checks identities, exact versions, dependency closure, required configuration, declared capabilities, effect scope, specification hash and manifest reference. It rejects non-topological plan operations and inconsistent preconditions. A manifest declared verified requires passed mandatory checks with evidence references. M2 must generate plans, inspect adapters and produce that evidence; M1 does not prove availability declarations true.

Workflow graphs reject cycles, missing dependencies/outputs, bindings to steps not listed as direct dependencies, and terminal steps without a workflow output. Embedded input/output schemas are checked without remote-reference loading or a shared mutable ID registry between validations. Workflow execution belongs to M3.

## Persistence and authority

[SqliteBackend](../adapters/backends/sqlite/store.ts) implements `forScope`, `create`, `get`, `query`, `update`, `history` and `link`. Each write uses `BEGIN IMMEDIATE`; updates require an expected revision and save a new revision together with history/access. References must exist at the specified revision, have the correct type and be readable by the actor. Evidence segments must exist in the pinned source.

Instance identity is part of storage keys. Queries filter instance/actor in SQL before pagination. Historical reads use current access: revoking read permission also prevents reading earlier versions. `NOT_FOUND` covers absent or unavailable records within scope to avoid disclosing existence; modifying a readable record without write permission returns `FORBIDDEN`.

Only owners may change access; owner, ID, type and instance are immutable. Only a scope with `can_authorize` may issue/modify authorizations. **The host must authenticate and set the scope**: `forScope` does not authenticate identities received from a source/model. It does not protect against direct SQLite file access either. M3 must mediate tools through the trusted host.

Decision promotion requires a persisted, current, non-revoked grant for the actor, instance, operation, resource, destination and content. Promotion retains the grant revision and a backend timestamp. Historical provenance is not reinterpreted when grants change; new writes must use the current grant revision. Approved artifacts retain all data and acceptance unchanged.

Declared capabilities: `conditional_writes`, `atomic_writes`, `history` and `scoped_queries`. `export_import` and `distributed_fencing` are `false`. Tests cover two concurrent connections and file reopening; no distributed coordinator exists. The adapter rejects another application's database before creating tables.

## Effects, time and execution

`effectKey` is SHA-256 of canonical JSON for `['mcc-effect-v1', instance_id, job_id, step_id, effect_name]`. It excludes run, attempt and payload: retrying a logical effect preserves its key. Deliberate repetition needs a distinct logical occurrence identity. Multiple indistinguishable occurrences within the same job/step/effect name are unsupported.

`hashJson` sorts object keys, preserves array order and rejects non-JSON values; `hashText` preserves exact UTF-8 content bytes. The backend returns the existing action for the same key/content/destination and rejects different payload/destination combinations. This prevents duplicate local intents without promising remote-service idempotency.

Transitions reject reopening terminal states and keep job definitions/inputs pinned. Before an action enters `in_flight`, authorization is verified and the attempt incremented exactly once. An `unknown` effect cannot retry directly; resolution requires receipt references and a reconciliation classification. Runs cannot complete with unconfirmed referenced actions. These checks neither invoke nor verify external targets: that responsibility arrives in M3/M6.

`assertBudget` prevents starting another operation after limits are exhausted; it neither cancels in-flight calls nor measures usage. `resolveSourceVersions` preserves revisions in `snapshot` mode or selects current versions and signals invalidation in `fresh` mode; selected versions must be available. Applying invalidation to steps/checkpoints belongs to the coordinator. Fencing has only a monotonicity guard; linkage to actual leases/owners is pending.

## Transfer and evaluation

`transfer_plan` distinguishes `move`, `copy` and `restore`. Copies require a new identity and inactive jobs; migration preserves identity. Activating jobs requires a declared frozen source. Plans include revisions, secret references and exact skill/workflow/validator definitions with hashes, content or locators, and closed acyclic dependencies. Remote-availability verification, effective freezing, backups and data transfer arrive in M4.

[runEvalCase](../evals/harness.ts) validates/clones fixtures before `execute(input)`. It retains an `expected` copy for `evaluate(output, expected)`. All four examples share one schema; invalid formats never reach the executor. A test adds an expectation-only marker to verify it is absent from executor input. The harness is neither a hostile-code sandbox nor an integrated semantic evaluator.

## Evidence and next guarantees

74 tests cover contracts, composition, states, authorization, history, isolation, a real write race, deduplication, CLI and A27 separation. Clean installation repeats the tests and verifies CLI/public imports from the installed package. [Results and hashes](m1-verification.json) bound this evidence.

M2 must construct/verify instances. M3 must connect host identity, coordinator, runtime and result fidelity; M4 must demonstrate another backend/runtime. [Adapter interfaces](../core/adapters.ts) establish these boundaries without declaring nonexistent implementations.

[Home](../README.md)
