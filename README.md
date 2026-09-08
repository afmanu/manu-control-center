# Manu Control Center

A builder for AI knowledge and work systems. It creates and maintains instances with context, sources, decisions, capabilities and durable state through storage and agent adapters.

**M0–M2 are complete.** You can resolve a configuration, review a plan, and create, adopt or resume a verified SQLite instance. Manu's foundation instance is prepared outside the repository. M3 will add capture, queries, workflows and a real runtime.

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

`doctor` tests storage in a temporary database. `validate` checks a contract's structure and invariants; `validate-bundle` checks declared consistency between the need, modules, configuration and plan. To create or adopt an instance, follow the [constructor guide](docs/installation.md). The [development guide](docs/development.md) covers commands, the library, packaging and limitations.

The repository is maintained in English. For Spanish CLI help and error summaries, use `npm start -- --lang es --help` or set `MANU_CONTROL_CENTER_LANG=es`. User content can remain in Spanish; changing the interface language never translates stored data or protocol fields. See [language and compatibility](docs/language.md).

## What we are building

Manu is the first user of a reusable builder. A need becomes an instance specification, a plan and a verifiable installation. The instance preserves knowledge and continuity beyond the conversation. The product, configuration and private data retain distinct locations and responsibilities.

Entities and contracts define the core. Obsidian, files, databases, Codex, Claude Code and other environments belong in adapters whose capabilities must be demonstrated. The starting point is local and interactive.

| Phase | Status | Deliverable |
|---|---|---|
| M0 | Complete | Executable repository, tooling and technical decisions. |
| M1 | Complete | Contracts, reference persistence and evaluator separation. |
| M2 | Complete | Instance creation, adoption, verification and recovery. |
| M3 | Pending | First usable instance: capture, queries, workflows and continuity. |
| M4 | Pending | A real second backend and second runtime. |
| M5 | Pending | Updates, repair, auditing and maintainable distribution. |
| M6 | As needed, from M3 | Integrations, recurrence and additional interfaces. |

The [roadmap](docs/implementation-plan.md) defines tasks and completion criteria. M2 passed 92 tests and a clean package installation, including an instance created from the installed package. A01, A02, A16 and A17 pass for the local backend; A15/A19 cover the installation profile and A27 the harness. Agent workflows will be checked in M3. See [acceptance](docs/acceptance.md) and the [current handoff](docs/handoff.md) for subsequent verification.

## Documentation

- [Handoff and next work](docs/handoff.md).
- [Scope and technology decisions](docs/decisions.md).
- [Architecture](docs/architecture.md) and [component map](docs/component-map.md).
- [Contracts](docs/contracts.md), [execution](docs/execution.md) and [first blueprint](docs/first-blueprint.md).
- [Install and use the constructor](docs/installation.md), [development](docs/development.md) and [M2 evidence](docs/m2-verification.json).
- [M1 contracts and mechanisms](docs/m1-implementation.md), with [historical evidence](docs/m1-verification.json).
- [Background references](references/README.md), as historical material; [M0 evidence](docs/m0-verification.json).

[AGENTS.md](AGENTS.md) guides repository development. [START-HERE.md](START-HERE.md) supports continuation in another session. The [documentation inventory](package-manifest.json) is checked by `npm run check:docs`; it is not an instance manifest.

## Status and distribution

`0.1.0-dev.3` is a development release with npm publication disabled. The `foundation` profile installs storage, configuration and a project; its `verified` state certifies that scope. Full agent use is pending. `node:sqlite` emits an experimental warning in the pinned Node version. Codex and Claude Code are candidates; product compatibility has not yet been demonstrated.

Private data and secrets stay outside Git and the package. Sources were integrated from the earlier documentation folder; subsequent decisions and implementation changes are maintained in this repository.
