# Decisiones de alcance y elecciones de implementación

## Alcance vigente

| ID | Decisión | Motivo y consecuencia |
|---|---|---|
| D01 | Producto constructor, especificación e instancia separados. | Se crean muchos sistemas sin mezclar distribución y memoria privada. |
| D02 | Modelo independiente de backend, interfaz y runtime. | Obsidian y ecosistemas concretos son destinos adaptables; no reglas del núcleo. |
| D03 | Kernel, conocimiento, state, skills, workflows y evals conservan responsabilidades explícitas. | Otra sesión puede entender y continuar trabajo sin depender del chat. |
| D04 | Una autoridad lógica por responsabilidad, con revisiones y procedencia. | Se evitan estados contradictorios mantenidos por distintos agentes. |
| D05 | Planificar, aplicar y verificar son operaciones diferentes. | Un paquete generado no demuestra instalación funcional. |
| D06 | Permisos con alcance y control de efectos. | Una herramienta disponible no concede uso ilimitado; se conserva autorización previa válida. |
| D07 | Contratos con mecanismos y evidencia. | Instrucciones en Markdown no sustituyen validadores, transacciones ni evaluaciones. |
| D08 | Adopción y actualización preservan datos y personalizaciones. | La evolución no reinstala una plantilla encima del trabajo del usuario. |
| D09 | Portabilidad verificada temprano con dos representaciones y dos runtimes. | Las abstracciones deben resistir un segundo destino antes de publicitar generalidad. |
| D10 | Desarrollo incremental por recorrido útil. | No se necesitan treinta servicios, gateway ni multiagente para comenzar. |
| D11 | Construcción explicable como proyecto propio. | La arquitectura principal se comprende sin atribuir cada componente a antecedentes. |

D01–D11 condensan las instrucciones del usuario y el diseño de referencia ya trabajado. No acreditan aprobación de cada nombre de campo o tecnología añadida en este handoff.

### D12 — Prioridad de ejecución y primer usuario

Estado: **adoptada por instrucción vigente del usuario**, 2026-09-08. Manu pide construir el repositorio para poder usar el sistema y elaborar un roadmap por fases, sin iniciar otro proceso de descubrimiento.

Se mantiene el constructor reutilizable y se utiliza su instancia como primer piloto. La entrega de aquella sesión de planificación fue el [roadmap de implementación](implementation-plan.md); el estado de software posterior se registra en el handoff. El plan sitúa el primer uso en M3 y permite adelantar integraciones necesarias desde ese momento. Esta secuencia y el segundo recorrido de resumen de proyecto son decisiones de planificación técnica; no se atribuyen al usuario como elecciones expresas de tecnología o de prioridad de negocio.

## Propuestas técnicas de este handoff

Los contratos detallados de `contracts.md`, `execution.md` y los ejemplos son una base para implementar. El roadmap M0–M6 concreta su orden de ejecución, entregables y comprobaciones. Identificadores, enums y distribución de archivos pueden ajustarse mediante una decisión técnica que conserve el significado y actualice sus pruebas. Versionarlos inicialmente como `0.1.0-draft` evita presentarlos como API estable.

El primer caso propuesto es un proyecto sintético que transforma una reunión en un brief sustentado y conserva decisiones y continuidad. La entrega externa se simula para probar los fallos del conector; un envío real requiere su integración y autorización correspondiente.

## Elecciones técnicas y resolución

| Elección | Criterio | Punto de resolución |
|---|---|---|
| Lenguaje y empaquetado | TypeScript/Node, npm y pruebas nativas; dependencias fijadas. | Adoptado en M0, D14. |
| Primer backend | SQLite local, con prueba de persistencia y actualización condicional. Backend completo de instancia pendiente. | Motor seleccionado en M0; garantías completas M1; instancia M2. |
| Segundo backend | El roadmap propone documentos frente a registros. No cuenta cambiar solo el motor de una misma fachada. Separar almacenamiento de conocimiento y estado si el adaptador lo requiere. | Diseñar prueba en M1; implementar M4. |
| Primer runtime | Codex como candidato; ejecutable observado, adaptador e invocación del producto pendientes. | Candidato M0; demostración M3. |
| Segundo runtime | Claude Code como candidato; host distinto con pruebas reales de handoff. | Candidato M0; demostración M4. |
| Esquemas y versionado | JSON Schema draft-07 y Ajv, contrato mínimo `0.1.0-draft`; ampliar modelos y referencias. | Base adoptada M0; contratos completos M1. |
| Licencia, nombre y remoto | Se conserva MIT y el nombre operativo del repositorio indicado por Manu: `afmanu/manu-control-center`, privado. Publicación npm desactivada. | Resuelto para el repositorio en M0, D13; distribución pública futura separada. |
| Gateway, scheduler y UI adicional | Solo con un caso que los necesite y su aceptación definida. | M6. |

La neutralidad no obliga a implementar todos los proveedores. Requiere límites honestos, sustitución a través de contratos y pruebas de los destinos declarados.

## Decisiones de implementación — M0

### D13 — Repositorio principal

Estado: **adoptada**, 2026-09-08. Contexto: Manu indica crear el proyecto directamente en [afmanu/manu-control-center](https://github.com/afmanu/manu-control-center). El repositorio contiene un commit inicial y una licencia MIT.

Elección: trabajar en un clon de ese repositorio, integrar documentación y código en su raíz, conservar licencia e historial, y subir la entrega verificada. Se utiliza `manu-control-center` como nombre operativo. Alternativa descartada: iniciar otro remoto o mantener dos repositorios activos. Consecuencia: las carpetas documentales anteriores quedan como snapshots, sin sincronización automática. La instrucción actual autoriza esta entrega en GitHub; no implica publicar un paquete en npm ni contenido en aplicaciones externas. Comprobaciones: remoto/visibilidad/permisos, diff, ausencia de datos de instancia y verificación del commit remoto.

### D14 — Stack mínimo y contratos

Estado: **adoptada**, 2026-09-08. Elección: TypeScript 7.0.2, Node 24 con 24.14.1 fijado para desarrollo, npm, JSON Schema draft-07 con Ajv 8.20.0/ajv-formats 3.0.1 y runner nativo `node:test`. Tipos Node 24.13.3. Dependencias directas exactas y lockfile. Aplicación modular con biblioteca y CLI.

Motivo: mismo lenguaje para núcleo, CLI y futuros adaptadores, instalación sencilla y pruebas sin un framework adicional. Alternativas: Python con SQLite y una CLI, o varios servicios desde el inicio. Python sigue siendo válido conceptualmente; se elige una sola cadena de herramientas para empezar. No se necesita un servicio distribuido para M0.

SQLite queda seleccionado como motor local. M0 utiliza `node:sqlite` para una prueba desechable; comprueba reapertura, actualización condicional entre conexiones y rollback. El módulo es experimental en el Node fijado y queda encapsulado; M1 puede sustituir su API si la evaluación del backend lo justifica. Estas pruebas no demuestran todavía autorización, aislamiento de instancias, historial ni coordinación de workers.

Contrato adoptado: `RecordEnvelope@0.1.0-draft` contiene solo metadatos; IDs y revisiones son strings opacos, fechas UTC normalizadas y orden temporal válido. Los modelos de entidad se definirán en M1. La validación de metadatos no acredita semántica ni permisos. Comprobaciones: 18 tests, instalación limpia desde lockfile e invocación del paquete instalado.

Referencias técnicas consultadas: [configuración de TypeScript](https://www.typescriptlang.org/tsconfig/), [JSON Schema en Ajv](https://ajv.js.org/json-schema.html) y [SQLite de Node 24](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html). Las versiones y capacidades locales se acreditan mediante ejecución, no por asumir equivalencia con la documentación de una versión posterior.

### D15 — Instancia local y candidatos de runtime

Estado: **adoptada para el piloto; integraciones pendientes**, 2026-09-08. Los datos de instancia se ubicarán en el directorio local de datos de la aplicación, con override absoluto mediante `MANU_CONTROL_CENTER_DATA_DIR`. M0 resuelve la ruta pero no crea la instancia. La sincronización de una carpeta no equivale a una transferencia de autoridad ni a una exclusión de escritores.

Codex será el primer candidato y Claude Code el segundo: se observaron sus ejecutables y versiones. M3 debe implementar y probar el primer adaptador; M4 el segundo. No se presupone autenticación, acceso a modelos, permisos de herramientas ni compatibilidad por tener un ejecutable. Segundo backend propuesto: documentos con identidades explícitas, resolviendo almacenamiento operativo aparte si lo requiere. Alternativas: imponer un vault o ejecutar trabajos desde varias copias sincronizadas; se conserva la separación del núcleo y se parte de un host responsable.

Comprobaciones actuales: resolución de ruta, rechazo de overrides relativos y diagnóstico sin creación de datos privados. Verificaciones pendientes: acceso real del runtime, contexto/salidas, mediación de efectos y portabilidad con los escenarios de M3/M4.

## Cómo registrar nuevas decisiones

Usar ID, estado (`propuesta`, `adoptada`, `sustituida`), contexto, elección, alternativas, consecuencias, contratos/pruebas afectados y fecha. Las elecciones locales reversibles pueden tomarse durante el trabajo autorizado. Los cambios de objetivo y compromisos de publicación corresponden al usuario.

[Entrada](../README.md)
