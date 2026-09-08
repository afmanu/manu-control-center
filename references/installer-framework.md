> HISTORICAL BACKGROUND. This does not establish current status or scope. [Current decisions](../docs/decisions.md) and [architecture](../docs/architecture.md) prevail. Earlier recommendations are retained as context. English translation; original text is preserved in Git history.

# Agent-Guided Installer Framework architecture

## Objective

Enable an AI agent to install complete systems in a real environment with adaptation, security, consent, verification and handoff.

## Components

- System Blueprint (historical vault reference; not required for implementation)
- Runtime Adapter (historical vault reference; not required for implementation)
- [Universal Backend Model](backend-model.md)
- Backend Adapter (historical vault reference; not required for implementation)
- Security / Consent (historical vault reference; not required for implementation)
- Verification
- Installed System
- Audit Report
- Handoff

## Flow

```text
Detect install intent
↓
Detect runtime
↓
Detect capabilities
↓
Select system blueprint
↓
Select backend adapter
↓
Diagnose user context
↓
Generate installation plan
↓
Classify risk
↓
Request consent
↓
Execute approved operations
↓
Verify result
↓
Generate audit report
↓
Handoff installed system
↓
Suggest first safe action
```

## Inputs

- User goal.
- Runtime environment.
- Available tools.
- Backend target.
- System blueprint.
- User constraints.
- Consent level.

## Outputs

- Installed system.
- Installation report.
- Handoff.
- Verification status.
- Recovery/fallback notes.
- First safe action.

## Important rules

- Technical capability is not user consent.
- Do not end with done. End with an auditable handoff.
- Runtime adapters adapt execution behavior, not framework obligations.
- Design the backend model first, then map concrete backends into it.

## Related

- Agent-Guided Installer Framework (historical vault reference; not required for implementation)
- Installation Lifecycle (historical vault reference; not required for implementation)
- Trust Layer for Agent Installers (historical vault reference; not required for implementation)


[Back to the project](../README.md)
