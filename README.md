# Manu Control Center

Constructor de sistemas de conocimiento y trabajo con IA. Crea y mantiene instancias con contexto, fuentes, decisiones, capacidades y estado durable, mediante adaptadores de almacenamiento y agentes.

**M0–M2 completados.** Ya puedes resolver una configuración, revisar un plan y crear, adoptar o reanudar una instancia SQLite con verificación. La instancia base de Manu está preparada fuera del repositorio. M3 incorporará captura, consulta, workflows y un runtime real.

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

`doctor` prueba el almacenamiento en una base temporal. `validate` comprueba estructura e invariantes de un contrato; `validate-bundle` comprueba la coherencia declarada entre necesidad, módulos, configuración y plan. Para crear o adoptar una instancia, sigue la [guía del constructor](docs/installation.md). La [guía de desarrollo](docs/development.md) explica los comandos, la biblioteca, el empaquetado y sus límites.

## Qué vamos a entregar

Manu será el primer usuario de un constructor reutilizable. Una necesidad se convierte en una especificación de instancia, un plan y una instalación verificable. La instancia mantiene conocimiento y continuidad fuera de la conversación. Producto, configuración y datos privados conservan ubicaciones y responsabilidades distintas.

El núcleo se define mediante entidades y contratos. Obsidian, archivos, bases de datos, Codex, Claude Code y otros entornos pertenecen a adaptadores con capacidades que deben demostrarse. El punto de partida es local e interactivo.

| Fase | Estado | Entrega |
|---|---|---|
| M0 | Completado | Repositorio ejecutable, herramientas y decisiones técnicas. |
| M1 | Completado | Contratos, persistencia de referencia y separación del evaluador. |
| M2 | Completado | Crear, adoptar y verificar instancias con recuperación. |
| M3 | Pendiente | Primera instancia utilizable: captura, consulta, workflows y continuidad. |
| M4 | Pendiente | Segundo backend y segundo runtime reales. |
| M5 | Pendiente | Actualización, reparación, auditoría y entrega mantenible. |
| M6 | Según necesidad, desde M3 | Integraciones, recurrencia e interfaces adicionales. |

El [roadmap](docs/implementation-plan.md) contiene tareas y criterios de cierre. Pasan 92 tests y la instalación limpia del paquete, incluida una instancia creada desde él. A01, A02, A16 y A17 pasan para el backend local; A15/A19 cubren el perfil de instalación y A27 el harness. Los recorridos con agente se comprobarán en M3. Véase [aceptación](docs/acceptance.md).

## Documentación

- [Handoff y siguiente trabajo](docs/handoff.md).
- [Decisiones de alcance y tecnología](docs/decisions.md).
- [Arquitectura](docs/architecture.md) y [mapa de componentes](docs/component-map.md).
- [Contratos](docs/contracts.md), [ejecución](docs/execution.md) y [primer blueprint](docs/first-blueprint.md).
- [Instalar y usar el constructor](docs/installation.md), [desarrollo](docs/development.md) y [evidencia M2](docs/m2-verification.json).
- [Contratos y mecanismos de M1](docs/m1-implementation.md), con su [evidencia histórica](docs/m1-verification.json).
- [Antecedentes](references/README.md), como material histórico; [evidencia de M0](docs/m0-verification.json).

[AGENTS.md](AGENTS.md) orienta el desarrollo del repositorio. [START-HERE.md](START-HERE.md) permite continuar en otra sesión. El [inventario documental](package-manifest.json) se comprueba con `npm run check:docs`; no es el manifiesto de una instancia.

## Estado y distribución

`0.1.0-dev.2` es una versión de desarrollo con publicación npm desactivada. El perfil `foundation` instala almacenamiento, configuración y proyecto; su estado `verified` acredita ese alcance. El uso completo con agente está pendiente. `node:sqlite` emite un aviso experimental en la versión de Node fijada. Codex y Claude Code son candidatos, sin compatibilidad de producto acreditada todavía.

Los datos privados y secretos quedan fuera de Git y del paquete. Las fuentes se han integrado desde la carpeta documental anterior; las próximas decisiones y cambios de implementación se mantienen en este repositorio.
