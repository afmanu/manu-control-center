> HISTORICAL BACKGROUND. This does not establish current status or scope. [Current decisions](../docs/decisions.md) and [architecture](../docs/architecture.md) prevail. Earlier recommendations are retained as context. English translation; original text is preserved in Git history.

# Universal Backend Model

A shared abstract model to keep an installable system independent of Obsidian, Notion, Postgres or any other specific tool.

## Components

- Object primitives.
- Schema and relations.
- Capability matrix.
- Query and view model.
- Permission and scope model.
- Verification model.
- Migration and fallbacks.

## Flow

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

## Rules

- Do not design for Obsidian first.
- Obsidian is not a strict database.
- Notion is not a strict relational database.
- Postgres alone is not a complete human interface.

## Related

- Backend Adapter (historical vault reference; not required for implementation)
- ADR — The framework must not be Obsidian-first (historical vault reference; not required for implementation)


[Back to the project](../README.md)
