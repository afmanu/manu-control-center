# Handoff de desarrollo

Actualizado: 2026-09-08. Repositorio principal: [afmanu/manu-control-center](https://github.com/afmanu/manu-control-center). **M0 y M1 completados; siguiente fase: M2.**

## Instrucción vigente y ubicación de trabajo

Manu pide construir el sistema para usarlo y ha indicado expresamente este repositorio de GitHub como destino. Se conserva el commit inicial `c41dd8a` y la licencia MIT; documentación y código viven en la raíz. La entrega verificada en GitHub está autorizada. Las carpetas documentales anteriores son snapshots.

El constructor sigue siendo reutilizable y Manu será su primer usuario. M3 entrega la primera instancia utilizable; M4 comprueba otra representación y otro runtime; M5 añade mantenimiento. Las integraciones necesarias de M6 pueden incorporarse desde M3. No se necesita otra entrevista de descubrimiento.

## Qué existe y qué se ha comprobado

- Paquete privado `manu-control-center@0.1.0-dev.1`, TypeScript/Node 24, dependencias exactas y lockfile. M1 no añade dependencias.
- CLI con ayuda, versión, `doctor`, `validate-record`, `contracts`, `validate` y `validate-bundle`.
- 22 contratos `0.1.0-draft`, tipos y esquemas generados: construcción, conocimiento, ejecución, autorización, traslado y fixtures. Validación de referencias declaradas, hashes, grafos, composición y transiciones.
- Backend SQLite de referencia: escrituras atómicas, revisiones opacas, historial, relaciones y consultas filtradas por instancia/actor antes de paginar. Una carrera entre dos conexiones en workers distintos permite una sola actualización sobre la misma revisión.
- Autorizaciones persistidas y verificadas al promover decisiones o preparar la invocación de un efecto; deduplicación de identidad de efectos y rechazo de payload/destino distinto. Artefactos aprobados conservan contenido y aceptación exactos.
- Cuatro fixtures normalizados a `fixture_version: 0.2.0-draft`; harness A27 entrega solo `input` al ejecutor y conserva `expected` en el evaluador. Rechaza formatos inválidos antes de ejecutar.
- 74 tests aprobados. Instalación desde fuentes limpias con `npm ci --offline`, compilación y repetición de tests; paquete instalado con caché de consumidor vacía y acceso al registro; CLI e imports públicos probados desde ese consumidor.
- Inventario documental, comprobación de esquemas generados y GitHub Actions para tests e instalación limpia.

La [evidencia M1](m1-verification.json) registra comandos, versiones, alcance y huellas de fuentes; [M0](m0-verification.json) conserva su evidencia histórica. Los resultados remotos quedan en [GitHub Actions](https://github.com/afmanu/manu-control-center/actions). El commit de la entrega vincula código y evidencia sin almacenar un hash circular dentro de sí mismo.

## Decisiones y fronteras

D13–D15 fijan repositorio, stack, ubicación de datos y candidatos de runtime. D16–D19 adoptan contratos, persistencia con alcance de acceso, separación del harness y diseño de traslado. Véanse [decisions.md](decisions.md) y [alcance M1](m1-implementation.md).

`AccessScope` y `can_authorize` proceden de un host confiable; no autentican usuarios y nunca deben derivarse de fuentes o salidas de un modelo. La revisión condicional y el guard de fencing no implementan leases distribuidos. Los recibos de efectos son referencias estructuradas; su comprobación contra un destino real corresponde al coordinador/conector.

La validación del bundle comprueba capacidades declaradas; M2 debe inspeccionar capacidades reales antes de construir. El contrato de traslado no exporta datos ni congela un host. El harness separa argumentos de API, sin aislar código hostil ni demostrar fidelidad semántica de un modelo. `node:sqlite` emite un aviso experimental en el Node fijado.

## Próximo trabajo concreto: M2

1. M2.1: catálogo mínimo, blueprint y resolución reproducible con versiones fijadas e inspección real del backend.
2. M2.2: inspección y plan sin escrituras, recursos con ownership y precondiciones de revisión o ausencia.
3. M2.3: aplicación con checkpoints, reconciliación y repetición sin duplicados; rechazar planes obsoletos.
4. M2.4–M2.6: verificación de capacidades, adopción conservadora y CLI del constructor según el roadmap.
5. Probar A01, A02, A16 y A17; ampliar A15/A19 sobre las capacidades implementadas.

Consultar [roadmap](implementation-plan.md), [contratos](contracts.md), [ejecución](execution.md) y [aceptación](acceptance.md). Usar la biblioteca instalada y el [bundle sintético](../examples/contracts/construction-bundle.json) como base de pruebas; no presentar sus capacidades declaradas como observaciones reales.

## Límites y estado de aceptación

M2–M6 están pendientes. A27 pasa en el harness de M1 y requiere integración real en M3. A01–A26 permanecen `not_run` como recorridos completos: las pruebas de mecanismos de M1 no acreditan los workflows, el coordinador, la mediación del runtime ni la portabilidad.

No se ha creado una instancia de usuario, invocado un modelo ni migrado datos propios. La configuración ilustrativa con `TO_BE_SELECTED` no es una especificación resuelta. Las rutas calculadas para otras plataformas no acreditan compatibilidad; la evidencia local registra macOS y el CI mantiene sus propias ejecuciones.

## Antecedentes y cierre de sesiones

El inventario raíz refleja los archivos actuales; los dos de `references/` conservan los inventarios del handoff y roadmap anteriores. La [procedencia](../references/README.md) explica sus límites. No existe sincronización automática con el vault original.

Registrar fase, comandos ejecutados, resultados, versiones y límites. Actualizar este handoff, las decisiones y la evidencia pertinente; regenerar el inventario documental. Mantener conocimiento de proyectos, estado de jobs y evolución del producto en sus autoridades correspondientes.

[Entrada](../README.md)
