# Manu Control Center

An AI OS distributed as a repository, inspired by AIS-OS and enhanced with Manu's Second Brain systems. It brings together operating context, connections, skills, workflows, recurring work and improvement, supported by durable memory, meaningful knowledge relationships and continuity.

**Status: full reviewed scope adopted; kit implementation is pending.** The active [conversion plan](docs/kit-conversion.md) defines the deliverables and practical checks. The complete former application is preserved on [`archive/application-m4.1`](https://github.com/afmanu/manu-control-center/tree/archive/application-m4.1). Main is dedicated to the kit and contains no application code, database adapters, npm package or application test suite.

## The intended experience

Open the repository with an existing agent, personalize the OS around your work and priorities, and give it a task. It finds the relevant context, uses available sources and tools, executes a suitable workflow, produces a useful deliverable and retains what is needed to continue. Repeated work can use the host's scheduling facilities when enabled. Audits and improvement cycles help the OS become more useful.

Manu's Second Brain strengthens how the OS remembers, connects, corrects and consolidates knowledge. An Obsidian vault can supply that knowledge workspace; setting up a vault is only one part of the product.

The repository will supply English instructions, skills, templates and small supporting tools. Interaction and personal content can use Spanish. A user's context and notes stay outside the public distribution; existing workspace conventions and customizations are preserved.

The normal kit experience will use readable files and the agent's existing tools. It will not require the previous npm application, a database or a custom runtime. Codex is the first verification target; support for other hosts will be based on practical checks.

## Conversion delivery

| Stage | User-visible result | Status |
|---|---|---|
| Preparation | Scope, source coverage, target layout and checks, including all ten quality improvements and six additional capabilities. | Complete; documentation only. |
| K1 | Personalize the AI OS, map context/connections/capabilities, complete a first useful workflow and resume from its deliverable. | Next. |
| K2 | Expand workflows and reusable deliverables with corrected, connected memory, URL intake and scoped project knowledge. | Pending. |
| K3 | Consolidate, audit, build selected skills, review decisions/days/weeks, reuse SOPs and preserve customizations. | Pending. |
| K4 | Clean kit distribution, verified skill discovery and second agent, optional explorer and native-scheduling recipe. | Pending. |

Read [START-HERE.md](START-HERE.md) to continue development. There is not yet an operational kit installer; do not use the legacy application setup as a substitute.

## Development and provenance

- [Product direction and original-objective review](docs/product-direction.md).
- [Active conversion plan and feature coverage](docs/kit-conversion.md).
- [Current handoff](docs/handoff.md) and [decisions](docs/decisions.md).
- [Repository development instructions](AGENTS.md) and [development checks](docs/development.md).
- [Reference sources and recorded attribution](references/README.md).
- [Quality-gap review: source rationale for the adopted additions](docs/quality-gap-review.md).
- [Application branch: code, dependencies, tests and historical evidence](https://github.com/afmanu/manu-control-center/tree/archive/application-m4.1).

The original [MIT license](LICENSE) and Git history are preserved. Source adaptations will retain applicable licenses and attribution. No personal data is included. Run `python3 scripts/check_docs.py` to check the kit documentation. All reviewed improvements are included in the [delivery mapping](docs/kit-conversion.md#quality-coverage-and-delivery-mapping). Optional modes will be available without being activated by default. No kit capabilities are implemented yet.
