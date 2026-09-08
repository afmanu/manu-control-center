# Manu Control Center

Constructor de sistemas de conocimiento y trabajo con IA. Crea y mantiene instancias con contexto, fuentes, decisiones, capacidades y estado durable, mediante adaptadores de almacenamiento y agentes.

**M0 y M1 completados.** La base incluye CLI, 22 contratos validados, persistencia SQLite con revisiones e historial, controles de acceso y un harness que separa las entradas del ejecutor de las expectativas del evaluador. La siguiente fase, M2, implementa el constructor de instancias; M3 entrega el primer uso con un runtime real.

Repositorio principal: [afmanu/manu-control-center](https://github.com/afmanu/manu-control-center). Conserva la licencia [MIT](LICENSE) del repositorio inicial.

## Empezar

Con Node.js 24.14.1 (versión en `.nvmrc`) y npm:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm start -- --help
npm start -- doctor
npm start -- contracts
npm start -- validate eval_fixture examples/meeting.json
npm start -- validate-bundle examples/contracts/construction-bundle.json
```

`doctor` prueba el almacenamiento en una base temporal. `validate` comprueba estructura e invariantes de un contrato; `validate-bundle` comprueba la coherencia declarada entre necesidad, módulos, configuración y plan. Estos comandos todavía no instalan una instancia. La [guía de desarrollo](docs/development.md) explica los comandos, la biblioteca, el empaquetado y sus límites.

## Qué vamos a entregar

Manu será el primer usuario de un constructor reutilizable. Una necesidad se convierte en una especificación de instancia, un plan y una instalación verificable. La instancia mantiene conocimiento y continuidad fuera de la conversación. Producto, configuración y datos privados conservan ubicaciones y responsabilidades distintas.

El núcleo se define mediante entidades y contratos. Obsidian, archivos, bases de datos, Codex, Claude Code y otros entornos pertenecen a adaptadores con capacidades que deben demostrarse. El punto de partida es local e interactivo.

| Fase | Estado | Entrega |
|---|---|---|
| M0 | Completado | Repositorio ejecutable, herramientas y decisiones técnicas. |
| M1 | Completado | Contratos, persistencia de referencia y separación del evaluador. |
| M2 | Pendiente | Crear, adoptar y verificar instancias. |
| M3 | Pendiente | Primera instancia utilizable: captura, consulta, workflows y continuidad. |
| M4 | Pendiente | Segundo backend y segundo runtime reales. |
| M5 | Pendiente | Actualización, reparación, auditoría y entrega mantenible. |
| M6 | Según necesidad, desde M3 | Integraciones, recurrencia e interfaces adicionales. |

El [roadmap](docs/implementation-plan.md) contiene tareas y criterios de cierre. Pasan 74 tests y la instalación limpia del paquete. A27 tiene su primera comprobación del harness; A01–A26 siguen pendientes como recorridos completos y A27 se ampliará con el runtime real. Véase [aceptación](docs/acceptance.md).

## Documentación

- [Handoff y siguiente trabajo](docs/handoff.md).
- [Decisiones de alcance y tecnología](docs/decisions.md).
- [Arquitectura](docs/architecture.md) y [mapa de componentes](docs/component-map.md).
- [Contratos](docs/contracts.md), [ejecución](docs/execution.md) y [primer blueprint](docs/first-blueprint.md).
- [Desarrollo y comandos](docs/development.md), [alcance implementado de M1](docs/m1-implementation.md) y [evidencia](docs/m1-verification.json).
- [Antecedentes](references/README.md), como material histórico; [evidencia de M0](docs/m0-verification.json).

[AGENTS.md](AGENTS.md) orienta el desarrollo del repositorio. [START-HERE.md](START-HERE.md) permite continuar en otra sesión. El [inventario documental](package-manifest.json) se comprueba con `npm run check:docs`; no es el manifiesto de una instancia.

## Estado y distribución

`0.1.0-dev.1` es una versión de desarrollo con publicación npm desactivada. El backend SQLite es una implementación local de referencia; la creación y operación de una instancia de usuario están pendientes. `node:sqlite` emite un aviso experimental en la versión de Node fijada. Codex y Claude Code son candidatos, sin compatibilidad de producto acreditada todavía.

Los datos privados y secretos quedan fuera de Git y del paquete. Las fuentes se han integrado desde la carpeta documental anterior; las próximas decisiones y cambios de implementación se mantienen en este repositorio.
