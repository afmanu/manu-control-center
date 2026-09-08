# Manu Control Center

Constructor de sistemas de conocimiento y trabajo con IA. Crea y mantiene instancias con contexto, fuentes, decisiones, capacidades y estado durable, mediante adaptadores de almacenamiento y agentes.

**M0 completado: base ejecutable de desarrollo.** Ya existen CLI, contrato mínimo validado, pruebas, diagnóstico de SQLite y empaquetado comprobado en una instalación limpia. La creación de instancias y los workflows se implementarán en M1–M3.

Repositorio principal: [afmanu/manu-control-center](https://github.com/afmanu/manu-control-center). Conserva la licencia [MIT](LICENSE) del repositorio inicial.

## Empezar

Con Node.js 24.14.1 (versión en `.nvmrc`) y npm:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm start -- --help
npm start -- doctor
npm start -- validate-record examples/record-envelope.json
```

`doctor` prueba persistencia, escrituras condicionales y rollback en una base temporal. `validate-record` valida metadatos mínimos de un registro. Ninguno instala todavía una instancia. La [guía de desarrollo](docs/development.md) explica instalación limpia, empaquetado, ubicación de datos, errores y límites.

## Qué vamos a entregar

Manu será el primer usuario de un constructor reutilizable. Una necesidad se convierte en una especificación de instancia, un plan y una instalación verificable. La instancia mantiene conocimiento y continuidad fuera de la conversación. Producto, configuración y datos privados conservan ubicaciones y responsabilidades distintas.

El núcleo se define mediante entidades y contratos. Obsidian, archivos, bases de datos, Codex, Claude Code y otros entornos pertenecen a adaptadores con capacidades que deben demostrarse. El punto de partida es local e interactivo.

| Fase | Estado | Entrega |
|---|---|---|
| M0 | Completado con pruebas locales | Repositorio ejecutable, herramientas y decisiones técnicas. |
| M1 | Pendiente | Contratos completos y persistencia de referencia. |
| M2 | Pendiente | Crear, adoptar y verificar instancias. |
| M3 | Pendiente | Primera instancia utilizable: captura, consulta, workflows y continuidad. |
| M4 | Pendiente | Segundo backend y segundo runtime reales. |
| M5 | Pendiente | Actualización, reparación, auditoría y entrega mantenible. |
| M6 | Según necesidad, desde M3 | Integraciones, recurrencia e interfaces adicionales. |

El [roadmap](docs/implementation-plan.md) contiene tareas y criterios de cierre. Los 27 [escenarios de aceptación](docs/acceptance.md) del sistema completo siguen pendientes; los 18 tests de M0 comprueban únicamente la base implementada.

## Documentación

- [Handoff y siguiente trabajo](docs/handoff.md).
- [Decisiones de alcance y tecnología](docs/decisions.md).
- [Arquitectura](docs/architecture.md) y [mapa de componentes](docs/component-map.md).
- [Contratos](docs/contracts.md), [ejecución](docs/execution.md) y [primer blueprint](docs/first-blueprint.md).
- [Desarrollo y comandos](docs/development.md) y [evidencia de M0](docs/m0-verification.json).
- [Antecedentes](references/README.md), como material histórico.

[AGENTS.md](AGENTS.md) orienta el desarrollo del repositorio. [START-HERE.md](START-HERE.md) permite continuar en otra sesión. El [inventario documental](package-manifest.json) se comprueba con `npm run check:docs`; no es el manifiesto de una instancia.

## Estado y distribución

`0.1.0-dev.0` es una base de desarrollo, con paquete local probado y publicación npm desactivada. SQLite está seleccionado para el piloto, pero su backend completo aún está pendiente. El diagnóstico usa `node:sqlite`, que emite un aviso experimental en la versión de Node fijada. Codex y Claude Code son candidatos observados, sin compatibilidad de producto acreditada todavía.

Los datos privados y secretos quedan fuera de Git y del paquete. Las fuentes se han integrado desde la carpeta documental anterior; las próximas decisiones y cambios de implementación se mantienen en este repositorio.
