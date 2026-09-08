# Component map and coverage

The thirty components are defined in [architecture.md](architecture.md), each with inputs/outputs, state/dependencies, boundaries/failures and a check. This map connects responsibilities to technical preparation and development. A row does not mean its responsibility is complete. M0–M2 provide contracts, persistence, a harness and a local constructor with CLI; [installation](installation.md) and [M1 scope](m1-implementation.md) identify their code and limitations.

| ID | Component | Plane | Supporting contract | Planned milestone |
|---|---|---|---|---|
| C01 | Diagnosis and onboarding | Construction | [contracts.md](contracts.md) | M2 |
| C02 | Blueprint, module and preset catalog | Construction | [contracts.md](contracts.md) | M2 |
| C03 | Instance specification and resolution | Construction | [contracts.md](contracts.md) | M2 |
| C04 | Deployment planner and compiler | Construction | [contracts.md](contracts.md) | M2 |
| C05 | Application, installation and adoption | Construction | [contracts.md](contracts.md) | M2 |
| C06 | Versions, manifest and evolution | Construction | [contracts.md](contracts.md) | Manifest M2; evolution M5 |
| C07 | Kernel and operating contract | Control | [execution.md](execution.md) | M1–M3 |
| C08 | Policies, authorizations and autonomy | Control | [execution.md](execution.md) | M1–M3 |
| C09 | Identity, isolation and secrets | Control | [execution.md](execution.md) | M1–M3 |
| C10 | Entity and relationship model | Knowledge | [contracts.md](contracts.md) | M1–M3 |
| C11 | Context, projects and responsibilities | Knowledge | [contracts.md](contracts.md) | M1–M3 |
| C12 | Capture, classification and promotion | Knowledge | [contracts.md](contracts.md) | M1–M3 |
| C13 | Knowledge and decisions | Knowledge | [contracts.md](contracts.md) | M1–M3 |
| C14 | Source registry, authority, provenance and currency | Knowledge | [contracts.md](contracts.md) | M1–M3 |
| C15 | Retrieval, search and indexes | Knowledge | [contracts.md](contracts.md) | M1–M3 |
| C16 | Artifacts and result preservation | Knowledge | [contracts.md](contracts.md) | M1–M3 |
| C17 | Capabilities, skills and contracts | Execution | [execution.md](execution.md) | M1–M3 |
| C18 | Workflow definitions | Execution | [execution.md](execution.md) | M1–M3 |
| C19 | Job and run coordinator | Execution | [execution.md](execution.md) | M1–M3 |
| C20 | Runtime adapters and executor selection | Execution | [execution.md](execution.md) | Contract M1; initial runtime M3; second M4 |
| C21 | Write and external effect control | Execution | [execution.md](execution.md) | M1–M3 |
| C22 | Triggers, scheduling and cadence | Execution | [execution.md](execution.md) | M6 |
| C23 | Errors, repair and work recovery | Execution | [execution.md](execution.md) | Recovery M3; repair M5 |
| C24 | Backend adapters and data portability | Integration | [contracts.md](contracts.md) | Contract/minimal store M1; instance M2; portability M4 |
| C25 | Connectors and tool contracts | Integration | [contracts.md](contracts.md) | Contract M1; local input/simulation M3; external connections M6 |
| C26 | Optional remote access gateway | Integration | [contracts.md](contracts.md) | M6 |
| C27 | Interfaces, views and human access | Integration | [contracts.md](contracts.md) | Constructor CLI M2; agent use M3; additional UI M6 |
| C28 | Observability and operational evidence | Verification | [execution.md](execution.md) | Construction M2; runs M3 |
| C29 | Structural/functional verification and evals | Verification | [acceptance.md](acceptance.md) | Validation M1; installation M2; evals M3; regression M4–M5 |
| C30 | Auditing, consolidation and improvement | Verification | [execution.md](execution.md) | M3–M5 |

Milestones identify incremental delivery of a responsibility, not its complete implementation at first appearance. The [roadmap](implementation-plan.md) details tasks and exit criteria: first usable instance in M3, portability in M4 and maintenance in M5. M6 extensions may be brought forward from M3 when actual use needs them.

## Mapping model terms

- **Kernel:** C07 and C08–C09 contracts; lives in product sources with per-instance configuration.
- **State:** C19 for jobs/runs/actions; C11 for project state; C03 for desired state; C06 for installed state. It is not one folder mixing all authorities.
- **Skills:** C17, versioned packages with procedures, contracts, resources and evals.
- **Workflows:** C18 for definitions and C19 for concrete executions.
- **Evals:** C29, structural and semantic acceptance; C28 supplies observations and C30 manages auditing/improvement.
- **Context and memory:** C10–C16, distinguishing captures, knowledge, decisions, authority and artifacts.
- **Routing:** C15 selects information; C20 selects an executor. These are distinct responsibilities.
- **Queue and recovery:** C19 coordinates; C23 selects recovery; C21 controls effects through the same state.
- **Cadence:** C22 plus a real scheduler/executor; optional by profile.
- **Adapters:** C20 runtimes, C24 backends, C25 connections, C26 optional gateway and C27 interfaces.
- **Builder and lifecycle:** C01–C06 create, adopt, update, verify and repair instances.

## Coverage of the shared design

The [conversation review](../references/shared-conversation-review.md) preserves the grouping of the original sixty sections and thirteen adjustments. They were reorganized by responsibility and the builder expanded; they are not sixty services to implement.

Architecture section 17 organizes future code folders. Core, adapter, CLI and eval folders already contain M0–M2 implementations; the remaining responsibilities will gain code as the roadmap advances.

[Home](../README.md)
