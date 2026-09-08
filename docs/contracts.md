# Construction and information contracts

Version adopted in M1: `0.1.0-draft`. There are 22 [schemas](../schemas/contracts.schema.json), types, validators, composition checks and a reference SQLite backend. [M1 implementation](m1-implementation.md) details exact fields, mechanisms and limits. M2 implements local resolution, planning, application, verification and adoption for the [foundation](installation.md) profile; execution and export follow M3–M4. This complements [the architecture](architecture.md) without replacing it.

## Common conventions

Persistent records use `schema_version`, `id`, `instance_id` where applicable, `revision`, `created_at` and `updated_at`. Identity differs from revision: editing does not change the ID. Timestamps include zones and normalize to UTC for comparison. References bind ID and revision when a result depends on an exact version.

M1's `StoredRecord` adds `kind`, `access` and `data` to metadata; the backend generates revisions/timestamps. `InstanceSpec` has its own revision to pin applied configuration. Object hashes use canonical JSON; artifact hashes use exact UTF-8 content.

Writes take `expected_revision` or an absence precondition. Conflicts return the current revision without silent overwrite. IDs must not derive solely from a title or physical path. Revision representation may vary by adapter; the core compares it opaquely.

An operation returns success with data/evidence, or an error with `code`, `message`, `retryable`, `details`, `evidence_refs` and, after a write attempt, `effect_status`. M1 uses serializable `DomainError`; `effect_status` belongs to the coordinator's invocation result. Empty queries return empty pages. For individual records, `NOT_FOUND` covers absence and unreadability within scope to avoid revealing existence; an unauthorized write to a readable record returns `FORBIDDEN`.

Minimum errors: `INVALID_INPUT`, `NOT_FOUND`, `CONFLICT`, `FORBIDDEN`, `AUTH_REQUIRED`, `CAPABILITY_UNAVAILABLE`, `INCOMPATIBLE_VERSION`, `STALE_PLAN`, `VALIDATION_FAILED`, `RATE_LIMITED`, `TIMEOUT`, `EFFECT_UNKNOWN`, `BUDGET_EXCEEDED`, `CANCELLED`. `retryable` does not itself authorize repeating an effect.

## Blueprint and modules — C02

Blueprint: ID, version, purpose, entities, required/optional modules, required configuration, target capabilities and acceptance scenarios. Module: ID, version, dependencies, exported contracts, skills, workflows, migrations and checks. Preset: initial values for allowed fields, without redefining contracts.

`resolve(blueprint, choices, catalog, observed_capabilities)` → resolved specification or conflicts. Detect missing dependencies, cycles, incompatible versions and unavailable required capabilities. Resolution creates no resources. A weaker alternative must be explicit in the specification and its limitations.

## Instance specification — C03

Contains instance identity, purpose, pinned blueprint/modules, versioned kernel, backend/runtime/interface targets, policies, secret references, configuration and overrides. Desired state does not claim that targets are installed.

Separate user input containing ranges/preferences from resolution with exact versions. Save choices and assumptions. Paths/table names are adapter configuration, not mandatory fields in a universal model.

## Plan and application — C04–C05

Plan: ID, resolved-specification hash, destination observations/revisions, ordered operations, dependencies, preconditions, effects, required scope, tests and recovery strategy. Each operation identifies a logical resource, a physical target through its adapter and expected ownership.

Initial logical operations: inspect, create, reuse, update and verify. Resource removal must be explicitly modeled when implemented; absence from a new template does not imply removal.

`plan(spec, observed_state, manifest?)` does not modify the destination. Equal inputs/revisions must produce the same logical content; report IDs/timestamps may differ. `apply(plan, grant_refs)` revalidates permissions/preconditions before every change and persists checkpoints. A changed destination causes a conflict or a new plan; application does not continue using stale observations.

Adoption: inventory → proposed mappings → conflicts → binding/creation plan → verification. Matching names prove neither identity nor ownership. Record whether each resource is managed, shared or user-owned; update policy depends on it.

If a process crashes after resource creation but before saving its receipt, the operation needs a stable key or discovery mechanism for reconciliation. Without one, the outcome remains uncertain: another copy is not created automatically.

## Manifest and evolution — C06

Manifest: instance, revision, applied specification, effective versions, managed logical/physical resources, ownership, baseline revision/hash, overrides, application state and latest checks. It distinguishes at least partial, installed-but-unverified and verified with coverage.

Updates compare three inputs: previous managed version, observed state and new desired version. Preserve user edits; report conflicts if both sides change the same content. A migration declares source/destination versions, preconditions, transformation, tests, backup/restore or compensation, and treatment of open runs. Do not promise to restore irreversible external effects.

## Entities and relationships — C10–C16

| Entity | Minimum type-specific semantic fields |
|---|---|
| Project | Purpose, status, owner/responsible person, next action, relevant decisions and sources. |
| Source | External/local reference, owner, scope, observation date, version and access. |
| Capture | Source/revision, relevant segments, classification, processing state and deduplication key when available. |
| Claim | Content, epistemic state, evidence, scope and validity period. |
| Decision | Choice, actor, context, relevant alternatives, evidence, date and review criterion. |
| Artifact | Type, content or immutable reference, hash, version, acceptance state and evidence. |
| Relation | Source/target ID, type, provenance and revision; do not infer identity from similar names. |

M1 epistemic states: declared, hypothesis, proposed, confirmed, refuted. These differ from capture processing (pending, integrated, discarded with a reason) and decision state (active, superseded, revoked).

M3.2 adds optional `claim.data.validity` (`valid_from`, nullable `valid_to`) without rewriting older claims; omission means unknown. Structured queries select the recorded version before an optional explicit validity filter. Review intake cannot set confirmed/refuted states. Artifact approval requires trusted owner scope; a draft cannot carry acceptance time. [Implemented authority/time profile](review.md).

An authoritative source declares the entity/field/question it governs, owner, priority or resolution rule, validity period, observation time and update policy. Historical queries distinguish valid time from when the system learned the fact. If the backend lacks required history, return insufficient coverage.

Search returns results with references/revisions, coverage and currency. Filter permissions before exposing content. No matches do not prove nonexistence. Context selection preserves why sources are relevant without recording the model's internal reasoning.

Knowledge promotion requires relevant evidence and authority; a clear, already-authorized instruction may be integrated directly. Do not automatically turn transcript proposals into the person's decisions.

## Backend and export — C24

M1 interface: `capabilities`, `forScope`, `get`, `query`, `create`, `update(record, expectedRevision)`, `history`, `link` and `close`. Queries filter type/identity with ID-based pagination. `export`, `import` and functional instance verification arrive in later milestones; unimplemented capabilities are declared false. Backend-specific extensions are declared, not leaked into general requirements.

Capability matrix: revisions, conditional writes, atomicity, writer exclusion, history, relationships, search, export, limits and isolation. If a coordinator guarantee is missing, choose suitable state storage or a verifiable single-writer mode; do not simulate transactions through instructions to an agent.

Export includes identities, relationships, required historical revisions, provenance, exact artifacts, open jobs, effects and configuration references. Credentials are reconfigured at the destination. Import reports mappings and losses/unsupported features; incomplete imports are not declared portable. Internal infrastructure state such as an active lease is invalidated and safely reacquired, preserving authority history.

## Adaptation and compatibility — C20, C25–C27

Runtime: identity/version, declared capabilities, per-session observed availability, authorized scope, invocation method and test results. `prepare_context` and `handoff` may exist without remote dispatch; `invoke` exists only when genuinely supported by the host.

Connector: operation, argument schema, return value, scope, effects, limits, actual idempotency and outcome lookup. UI/gateway: use the same logical operations and controls; distinguish reading, writing and execution. Simulated connector tests exercise the coordinator, not a commercial integration.

[Home](../README.md)
