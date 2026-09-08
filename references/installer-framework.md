> ANTECEDENTE HISTÓRICO. No establece el estado ni el alcance actuales. Prevalecen [las decisiones vigentes](../docs/decisions.md) y [la arquitectura](../docs/architecture.md). Las recomendaciones antiguas se conservan como contexto.

# Arquitectura del Agent-Guided Installer Framework

## Objetivo

Permitir que un agente de IA instale sistemas completos en un entorno real con adaptación, seguridad, consentimiento, verificación y handoff.

## Componentes

- System Blueprint (referencia histórica del vault; no necesaria para implementar)
- Runtime Adapter (referencia histórica del vault; no necesaria para implementar)
- [Universal Backend Model](backend-model.md)
- Backend Adapter (referencia histórica del vault; no necesaria para implementar)
- Security / Consent (referencia histórica del vault; no necesaria para implementar)
- Verification
- Installed System
- Audit Report
- Handoff

## Flujo

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

## Reglas importantes

- Technical capability is not user consent.
- Do not end with done. End with an auditable handoff.
- Runtime adapters adapt execution behavior, not framework obligations.
- Design the backend model first, then map concrete backends into it.

## Relacionado

- Agent-Guided Installer Framework (referencia histórica del vault; no necesaria para implementar)
- Installation Lifecycle (referencia histórica del vault; no necesaria para implementar)
- Trust Layer for Agent Installers (referencia histórica del vault; no necesaria para implementar)


[Volver a la entrada del proyecto](../README.md)
