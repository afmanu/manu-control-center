# Manu Control Center

A builder for AI knowledge and work systems. It creates and maintains instances with context, sources, decisions, capabilities and durable state through storage and agent adapters.

**M0–M2 and M3.1–M3.6 are complete for the local profiles.** Capture sources, manage authority and complete human-reviewed meeting briefs or project status through a durable coordinator. Leases, fencing, budgets, cancellation, source invalidation and effect receipts are enforced; external delivery is simulated. Codex now synthesizes cited drafts for both workflows; conversational entry points and persisted session handoff are available; an editable operational profile and dedicated operating folder are available.

Primary repository: [afmanu/manu-control-center](https://github.com/afmanu/manu-control-center). The original repository's [MIT license](LICENSE) is preserved.

## Getting started

With Node.js 24.14.1 (pinned in `.nvmrc`) and npm:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm start -- --help
npm start -- doctor
npm start -- contracts
npm start -- validate eval_fixture examples/meeting.json
npm start -- validate-bundle examples/contracts/construction-bundle.json
```

`doctor` tests storage in a temporary database. `validate` checks a contract's structure and invariants; `validate-bundle` checks declared consistency between the need, modules, configuration and plan. To create or adopt an instance, follow the [constructor guide](docs/installation.md). The [capture and query guide](docs/knowledge.md) provides a working example for the next step. The [development guide](docs/development.md) covers commands, the library, packaging and limitations.

The repository is maintained in English. For Spanish CLI help and error summaries, use `npm start -- --lang es --help` or set `MANU_CONTROL_CENTER_LANG=es`. User content can remain in Spanish; changing the interface language never translates stored data or protocol fields. See [language and compatibility](docs/language.md).

## What we are building

Manu is the first user of a reusable builder. A need becomes an instance specification, a plan and a verifiable installation. The instance preserves knowledge and continuity beyond the conversation. The product, configuration and private data retain distinct locations and responsibilities.

Entities and contracts define the core. Obsidian, files, databases, Codex, Claude Code and other environments belong in adapters whose capabilities must be demonstrated. The starting point is local and interactive.

| Phase | Status | Deliverable |
|---|---|---|
| M0 | Complete | Executable repository, tooling and technical decisions. |
| M1 | Complete | Contracts, reference persistence and evaluator separation. |
| M2 | Complete | Instance creation, adoption, verification and recovery. |
| M3 | In progress: M3.1–M3.6 complete | Codex synthesis, session handoff and continuation available; operational profiles available; first personal model use pending. |
| M4 | Pending | A real second backend and second runtime. |
| M5 | Pending | Updates, repair, auditing and maintainable distribution. |
| M6 | As needed, from M3 | Integrations, recurrence and additional interfaces. |

The [roadmap](docs/implementation-plan.md) defines tasks and completion criteria. M3.7 implementation passes 258 mechanism tests and clean package installation. Actual Codex CLI runs cover both workflows, four calibrated meeting fixtures and a separate new-transcript CLI path. Model drafts retain exact citations and require owner review; deterministic checks enforce coverage and permissions. Installation tests use a declared mock, separate from real model evidence. A01, A02, A16 and A17 pass for local construction; A19 also covers scoped source and derived-knowledge retrieval; A05/A06/A22 pass for the local review profile. A15 construction verification remains foundation-scoped; runtime invocation and A27 calibration evidence are recorded separately. Fresh-session Codex retrieval and resumption are verified for the documented local profile. Operational activation is verified; the first personal model invocation awaits explicit data-transfer authorization. See [acceptance](docs/acceptance.md), [M3.7 evidence](docs/m3.7-verification.json), [runtime evaluation](docs/m3.7-runtime-evaluation.json) and the [handoff](docs/handoff.md).

## Documentation

- [Connect an existing instance for first use](docs/first-use.md).
- [Open and resume an instance session](docs/sessions.md).
- [Capture text/files and query sources](docs/knowledge.md).
- [Review decisions, query time and preserve approved artifacts](docs/review.md).
- [Run and review local meeting briefs and project status](docs/workflows.md).
- [Use Codex to synthesize and review sourced drafts](docs/codex-runtime.md).
- [Coordinate runs, cancel work and reconcile simulated effects](docs/coordinator.md).
- [Handoff and next work](docs/handoff.md).
- [Scope and technology decisions](docs/decisions.md).
- [Architecture](docs/architecture.md) and [component map](docs/component-map.md).
- [Contracts](docs/contracts.md), [execution](docs/execution.md) and [first blueprint](docs/first-blueprint.md).
- [Install and use the constructor](docs/installation.md), [development](docs/development.md) and [M2 evidence](docs/m2-verification.json).
- [M1 contracts and mechanisms](docs/m1-implementation.md), with [historical evidence](docs/m1-verification.json).
- [Background references](references/README.md), as historical material; [M0 evidence](docs/m0-verification.json).

[AGENTS.md](AGENTS.md) guides repository development. [START-HERE.md](START-HERE.md) supports continuation in another session. The [documentation inventory](package-manifest.json) is checked by `npm run check:docs`; it is not an instance manifest.

## Status and distribution

`0.1.0-dev.10` is a development release with npm publication disabled. The `foundation` profile installs storage, configuration and a project; its `verified` state certifies that scope. Operational profiles can connect existing instances without replacing their construction plans. `node:sqlite` emits an experimental warning in the pinned Node version. Codex CLI 0.146.0 is tested for the documented synthesis profile; Claude Code remains the second-runtime candidate.

Private data and secrets stay outside Git and the package. Sources were integrated from the earlier documentation folder; subsequent decisions and implementation changes are maintained in this repository.
