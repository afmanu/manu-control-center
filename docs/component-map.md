# Mapa de componentes y cobertura

Los treinta componentes están definidos en [architecture.md](architecture.md), cada uno con entradas/salidas, estado/dependencias, límite/fallo y comprobación. Este mapa conecta las responsabilidades con la preparación técnica y el desarrollo. La presencia de una fila no significa que la responsabilidad esté completada. M0–M2 aportan contratos, persistencia, harness y constructor local con CLI; [instalación](installation.md) y [alcance M1](m1-implementation.md) identifican el código y los límites de esas entregas.

| ID | Componente | Plano | Contrato complementario | Hito previsto |
|---|---|---|---|---|
| C01 | Diagnóstico y onboarding | Construcción | [contracts.md](contracts.md) | M2 |
| C02 | Catálogo de blueprints, módulos y presets | Construcción | [contracts.md](contracts.md) | M2 |
| C03 | Especificación y resolución de instancia | Construcción | [contracts.md](contracts.md) | M2 |
| C04 | Planificador y compilador de despliegue | Construcción | [contracts.md](contracts.md) | M2 |
| C05 | Aplicador, instalación y adopción | Construcción | [contracts.md](contracts.md) | M2 |
| C06 | Versiones, manifiesto y evolución | Construcción | [contracts.md](contracts.md) | Manifiesto M2; evolución M5 |
| C07 | Núcleo y contrato operativo | Control | [execution.md](execution.md) | M1–M3 |
| C08 | Políticas, autorizaciones y autonomía | Control | [execution.md](execution.md) | M1–M3 |
| C09 | Identidad, aislamiento y secretos | Control | [execution.md](execution.md) | M1–M3 |
| C10 | Modelo de entidades y relaciones | Conocimiento | [contracts.md](contracts.md) | M1–M3 |
| C11 | Contexto, proyectos y responsabilidades | Conocimiento | [contracts.md](contracts.md) | M1–M3 |
| C12 | Captura, clasificación y promoción | Conocimiento | [contracts.md](contracts.md) | M1–M3 |
| C13 | Conocimiento y decisiones | Conocimiento | [contracts.md](contracts.md) | M1–M3 |
| C14 | Registro de fuentes, autoridad, procedencia y vigencia | Conocimiento | [contracts.md](contracts.md) | M1–M3 |
| C15 | Recuperación, búsqueda e índices | Conocimiento | [contracts.md](contracts.md) | M1–M3 |
| C16 | Artefactos y preservación de resultados | Conocimiento | [contracts.md](contracts.md) | M1–M3 |
| C17 | Capacidades, skills y contratos | Ejecución | [execution.md](execution.md) | M1–M3 |
| C18 | Definición de workflows | Ejecución | [execution.md](execution.md) | M1–M3 |
| C19 | Coordinador de trabajos y ejecuciones | Ejecución | [execution.md](execution.md) | M1–M3 |
| C20 | Adaptadores de runtime y selección de ejecutor | Ejecución | [execution.md](execution.md) | Contrato M1; runtime inicial M3; segundo M4 |
| C21 | Control de escrituras y efectos externos | Ejecución | [execution.md](execution.md) | M1–M3 |
| C22 | Disparadores, programación y cadencia | Ejecución | [execution.md](execution.md) | M6 |
| C23 | Errores, reparación y recuperación de trabajo | Ejecución | [execution.md](execution.md) | Recuperación M3; reparación M5 |
| C24 | Adaptadores de backend y portabilidad de datos | Integración | [contracts.md](contracts.md) | Contrato/almacén mínimo M1; instancia M2; portabilidad M4 |
| C25 | Conectores y contratos de herramientas | Integración | [contracts.md](contracts.md) | Contrato M1; entrada local/simulación M3; conexiones externas M6 |
| C26 | Gateway de acceso remoto opcional | Integración | [contracts.md](contracts.md) | M6 |
| C27 | Interfaces, vistas y acceso humano | Integración | [contracts.md](contracts.md) | CLI constructor M2; uso con agente M3; UI adicional M6 |
| C28 | Observabilidad y evidencia operativa | Verificación | [execution.md](execution.md) | Construcción M2; ejecuciones M3 |
| C29 | Verificación estructural, funcional y evals | Verificación | [acceptance.md](acceptance.md) | Validación M1; instalación M2; evals M3; regresión M4–M5 |
| C30 | Auditoría, consolidación y mejora | Verificación | [execution.md](execution.md) | M3–M5 |

Los hitos indican entregas incrementales de una responsabilidad, no su cierre completo en la primera aparición. El [roadmap](implementation-plan.md) detalla tareas y puertas de salida: primera instancia utilizable en M3, portabilidad en M4 y mantenimiento en M5. Las extensiones de M6 pueden incorporarse desde M3 cuando el uso las necesite.

## Correspondencia de los términos del modelo

- **Kernel:** C07 y contratos de C08–C09; vive en fuentes del producto, con configuración por instancia.
- **State:** C19 para jobs/runs/acciones; C11 para estado del proyecto; C03 para deseado; C06 para instalado. No es una única carpeta que mezcle todas las autoridades.
- **Skills:** C17, paquetes versionados con procedimiento, contrato, recursos y evals.
- **Workflows:** C18 para definición y C19 para sus ejecuciones concretas.
- **Evals:** C29, aceptación estructural y semántica; C28 aporta observación y C30 gestiona auditoría/mejora.
- **Contexto y memoria:** C10–C16, con distinción entre capturas, conocimiento, decisiones, autoridad y artefactos.
- **Routing:** C15 elige información; C20 elige ejecutor. Son responsabilidades distintas.
- **Queue y recovery:** C19 coordina; C23 decide recuperación; C21 controla efectos sobre el mismo estado.
- **Cadence:** C22 más scheduler/ejecutor real; opcional según el perfil.
- **Adapters:** C20 runtimes, C24 backends, C25 conexiones, C26 gateway opcional y C27 interfaces.
- **Builder y lifecycle:** C01–C06 crean, adoptan, actualizan, verifican y reparan las instancias.

## Cobertura del diseño compartido

La [revisión de la conversación](../references/shared-conversation-review.md) conserva el agrupamiento de los sesenta apartados originales y trece ajustes. El conjunto se reorganizó por responsabilidades y se amplió el constructor; no son sesenta servicios que haya que implementar.

La sección 17 de la arquitectura organiza carpetas del futuro código. Las carpetas de núcleo, adaptadores, CLI y evals ya contienen la implementación M0–M2; las responsabilidades restantes incorporarán código conforme avance el roadmap.

[Entrada](../README.md)
