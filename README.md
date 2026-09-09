# Manu Control Center

An AI OS distributed as a repository, inspired by AIS-OS and enhanced with Manu's Second Brain systems. It brings together operating context, connections, skills, workflows, recurring work and improvement, supported by durable memory, meaningful knowledge relationships and continuity.

**Status: K1 and K2 implemented and verified with Codex. K3 is next.** The active [conversion plan](docs/kit-conversion.md) defines the deliverables and practical checks. The complete former application is preserved on [`archive/application-m4.1`](https://github.com/afmanu/manu-control-center/tree/archive/application-m4.1). Main is dedicated to the kit and contains no application code, database adapters, npm package or application test suite.

## The intended experience

Open the repository with an existing agent, personalize the OS around your work and priorities, and give it a task. It finds the relevant context, uses available sources and tools, executes a suitable workflow, produces a useful deliverable and retains what is needed to continue. Repeated work can use the host's scheduling facilities when enabled. Audits and improvement cycles help the OS become more useful.

Manu's Second Brain strengthens how the OS remembers, connects, corrects and consolidates knowledge. An Obsidian vault can supply that knowledge workspace; setting up a vault is only one part of the product.

The repository supplies English instructions, skills, templates and a small setup helper. Interaction and personal content can use Spanish. A user's context and notes stay outside the public distribution; existing workspace conventions and customizations are preserved.

The normal kit experience uses readable files and the agent's existing tools. It does not require the previous npm application, a database or a custom runtime. Codex is the first verification target; support for other hosts will be based on practical checks.

## Conversion delivery

| Stage | User-visible result | Status |
|---|---|---|
| Preparation | Scope, source coverage, target layout and checks, including all ten quality improvements and six additional capabilities. | Complete; documentation only. |
| K1 | Personalize the AI OS, map context/connections/capabilities, complete a first useful workflow and resume from its deliverable. | Complete; [practical evidence](docs/k1-verification.md). |
| K2 | Expand workflows and reusable deliverables with corrected, connected memory, URL intake and scoped project knowledge. | Complete; [practical evidence](docs/k2-verification.md). |
| K3 | Consolidate, audit, build selected skills, review decisions/days/weeks, reuse SOPs and preserve customizations. | Pending. |
| K4 | Clean kit distribution, verified skill discovery and second agent, optional explorer and native-scheduling recipe. | Pending. |

## Start using the AI OS

Open this repository with Codex and follow [START-HERE.md](START-HERE.md). Give the agent an absolute path for a separate personal workspace, or an existing folder to adopt, plus a source and first project task. It reuses known context and preserves existing conventions.

> Set up my AI OS in the personal folder I select, capture this project source, and prepare a sourced status and action brief. Use Spanish for our interaction and keep project facts scoped to the project.

The kit includes `mcc-setup`, `mcc-context`, `mcc-capture`, `mcc-project`, `mcc-link` and `mcc-synthesize`. K2 adds resumable interviews, traceable corrections, meaningful links, synthesis, URL intake, meeting briefs and scoped work areas. The [kit entry](kit/START-HERE.md) explains setup; the [synthetic example](kit/examples/README.md) needs no personal data. Python 3.9+ is needed for the copy helper; no third-party packages are required. Copying the kit does not connect external accounts or activate schedules.

## Development and provenance

- [Product direction and original-objective review](docs/product-direction.md).
- [Active conversion plan and feature coverage](docs/kit-conversion.md).
- [Current handoff](docs/handoff.md), [decisions](docs/decisions.md) and [K1 verification](docs/k1-verification.md) and [K2 verification](docs/k2-verification.md).
- [Repository development instructions](AGENTS.md) and [development checks](docs/development.md).
- [Reference sources and recorded attribution](references/README.md).
- [Quality-gap review: source rationale for the adopted additions](docs/quality-gap-review.md).
- [Application branch: code, dependencies, tests and historical evidence](https://github.com/afmanu/manu-control-center/tree/archive/application-m4.1).

The original [MIT license](LICENSE) and Git history are preserved. Source adaptations retain [licenses and attribution](kit/THIRD-PARTY-NOTICES.md). No personal data is included. Run `python3 scripts/check_docs.py` to check the kit documentation. All reviewed improvements are included in the [delivery mapping](docs/kit-conversion.md#quality-coverage-and-delivery-mapping). Optional modes will be available without being activated by default. K3–K4 remain pending; full reference parity is not yet established.
