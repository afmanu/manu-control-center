# Manu Control Center

An agent-operated Second Brain kit combining guided setup, context and improvement practices from AIS-OS with Manu's capture, knowledge connections, synthesis and project continuity.

**Status: conversion prepared; the file-based kit is not yet implemented.** The active [conversion plan](docs/kit-conversion.md) defines the deliverables and practical checks. The complete former application is preserved on [`archive/application-m4.1`](https://github.com/afmanu/manu-control-center/tree/archive/application-m4.1). Main is dedicated to the kit and contains no application code, database adapters, npm package or application test suite.

## The intended experience

Open the kit with an existing agent, create or adopt a personal knowledge workspace, and start working with your information. Capture sources, connect ideas, synthesize useful knowledge and resume projects in a new session. Audit the workspace and verify useful improvements as it grows.

The repository will supply English instructions, skills, templates and small supporting tools. Interaction and personal content can use Spanish. A user's context and notes stay outside the public distribution; existing workspace conventions and customizations are preserved.

The normal kit experience will use readable files and the agent's existing tools. It will not require the previous npm application, a database or a custom runtime. Codex is the first verification target; support for other hosts will be based on practical checks.

## Conversion delivery

| Stage | User-visible result | Status |
|---|---|---|
| Preparation | Scope, source coverage, target layout, preservation rules and acceptance checks. | Complete; documentation only. |
| K1 | Set up or adopt a workspace, capture and retrieve a source, resume in a fresh Codex session. | Next. |
| K2 | Connect and synthesize knowledge; maintain projects and produce sourced briefs/status updates. | Pending. |
| K3 | Audit, make a verified improvement and preserve customizations during updates. | Pending. |
| K4 | Clean kit distribution, verified second agent and optional reference-derived knowledge explorer. | Pending. |

Read [START-HERE.md](START-HERE.md) to continue development. There is not yet an operational kit installer; do not use the legacy application setup as a substitute.

## Development and provenance

- [Product direction and original-objective review](docs/product-direction.md).
- [Active conversion plan and feature coverage](docs/kit-conversion.md).
- [Current handoff](docs/handoff.md) and [decisions](docs/decisions.md).
- [Repository development instructions](AGENTS.md) and [development checks](docs/development.md).
- [Reference sources and recorded attribution](references/README.md).
- [Quality-gap review: proposed additions from both source systems](docs/quality-gap-review.md).
- [Application branch: code, dependencies, tests and historical evidence](https://github.com/afmanu/manu-control-center/tree/archive/application-m4.1).

The original [MIT license](LICENSE) and Git history are preserved. Source adaptations will retain applicable licenses and attribution. No personal data is included. Run `python3 scripts/check_docs.py` to check the kit documentation. The gap review identifies proposed refinements; no kit capabilities are implemented yet.
