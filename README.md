# Manu Control Center

A builder for AI knowledge and work systems. It creates and maintains instances with context, sources, decisions, capabilities and durable state through storage and agent adapters.

**M0–M2 and M3.1–M3.3 are complete.** Capture and query sources, manage decision authority, and complete meeting briefs or project-status summaries with exact citations and explicit human review. Manu's foundation remains outside the repository. M3.4 adds the coordinator and effect control; real model execution follows in M3.5.

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
| M3 | In progress: M3.1–M3.3 complete | Local human-reviewed workflows available; coordinator and runtime next. |
| M4 | Pending | A real second backend and second runtime. |
| M5 | Pending | Updates, repair, auditing and maintainable distribution. |
| M6 | As needed, from M3 | Integrations, recurrence and additional interfaces. |

The [roadmap](docs/implementation-plan.md) defines tasks and completion criteria. M3.3 passes 176 tests and clean package installation, including both local workflows through the installed CLI. Classification and semantic review are human inputs; exact extraction, coverage and permissions are enforced. A01, A02, A16 and A17 pass for local construction; A19 also covers scoped source and derived-knowledge retrieval; A05/A06/A22 pass for the local review profile. A15 remains foundation-only and A27 covers the harness. Full agent workflows remain pending. See [acceptance](docs/acceptance.md), [M3.3 evidence](docs/m3.3-verification.json) and the [handoff](docs/handoff.md).

## Documentation

- [Capture text/files and query sources](docs/knowledge.md).
- [Review decisions, query time and preserve approved artifacts](docs/review.md).
- [Run and review local meeting briefs and project status](docs/workflows.md).
- [Handoff and next work](docs/handoff.md).
- [Scope and technology decisions](docs/decisions.md).
- [Architecture](docs/architecture.md) and [component map](docs/component-map.md).
- [Contracts](docs/contracts.md), [execution](docs/execution.md) and [first blueprint](docs/first-blueprint.md).
- [Install and use the constructor](docs/installation.md), [development](docs/development.md) and [M2 evidence](docs/m2-verification.json).
- [M1 contracts and mechanisms](docs/m1-implementation.md), with [historical evidence](docs/m1-verification.json).
- [Background references](references/README.md), as historical material; [M0 evidence](docs/m0-verification.json).

[AGENTS.md](AGENTS.md) guides repository development. [START-HERE.md](START-HERE.md) supports continuation in another session. The [documentation inventory](package-manifest.json) is checked by `npm run check:docs`; it is not an instance manifest.

## Status and distribution

`0.1.0-dev.6` is a development release with npm publication disabled. The `foundation` profile installs storage, configuration and a project; its `verified` state certifies that scope. Full agent use is pending. `node:sqlite` emits an experimental warning in the pinned Node version. Codex and Claude Code are candidates; product compatibility has not yet been demonstrated.

Private data and secrets stay outside Git and the package. Sources were integrated from the earlier documentation folder; subsequent decisions and implementation changes are maintained in this repository.
