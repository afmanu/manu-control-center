> ANTECEDENTE HISTÓRICO. No establece el estado ni el alcance actuales. Prevalecen [las decisiones vigentes](../docs/decisions.md) y [la arquitectura](../docs/architecture.md). Las recomendaciones antiguas se conservan como contexto.

# Universal Backend Model

Modelo abstracto común para que un sistema instalable no dependa de Obsidian, Notion, Postgres u otra herramienta concreta.

## Componentes

- Object primitives.
- Schema and relations.
- Capability matrix.
- Query and view model.
- Permission and scope model.
- Verification model.
- Migration and fallbacks.

## Flujo

```text
Define abstract backend model
↓
Define object and relation primitives
↓
Define capability requirements
↓
Map concrete backend behavior
↓
Create backend adapter
↓
Verify backend fit
```

## Reglas

- No diseñar para Obsidian primero.
- Obsidian no es una base de datos estricta.
- Notion no es una base relacional estricta.
- Postgres no es una interfaz humana completa por sí solo.

## Relacionado

- Backend Adapter (referencia histórica del vault; no necesaria para implementar)
- ADR — El framework no debe ser Obsidian-first (referencia histórica del vault; no necesaria para implementar)


[Volver a la entrada del proyecto](../README.md)
