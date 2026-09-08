# Handoff de desarrollo

Actualizado: 2026-09-08. Repositorio principal: [afmanu/manu-control-center](https://github.com/afmanu/manu-control-center). **M0 completado con pruebas locales; siguiente fase: M1.**

## Instrucción vigente y ubicación de trabajo

Manu pide construir el sistema para usarlo y ha indicado expresamente este repositorio de GitHub como destino. Se ha clonado conservando el commit inicial `c41dd8a` y la licencia MIT; la documentación y el roadmap se integran en la raíz. La selección de repositorio sustituye las antiguas menciones a un remoto y licencia pendientes.

El constructor sigue siendo reutilizable y Manu será su primer usuario. M3 entrega la primera instancia utilizable; M4 comprueba otra representación y otro runtime; M5 añade mantenimiento. Las integraciones necesarias de M6 pueden incorporarse desde M3. No se necesita otra entrevista de descubrimiento.

## Qué existe y qué se ha comprobado

- Paquete npm privado `manu-control-center@0.1.0-dev.0`, TypeScript, Node 24, dependencias fijadas y lockfile.
- CLI con ayuda, versión, `doctor` y `validate-record`. Solo se documentan esos comandos como operativos.
- Esquema y validador mínimo de metadatos `RecordEnvelope@0.1.0-draft`, con errores estructurados.
- Prueba SQLite desechable: persistencia al reabrir, actualización condicional, rechazo de escritor con revisión obsoleta y rollback. No constituye el backend de instancias.
- Resolución de la ubicación local de datos fuera del repositorio, sin crear aún una instancia.
- 18 tests aprobados. Instalación desde fuentes limpias con `npm ci --offline`, compilación y repetición de tests; instalación del paquete generado con una caché de consumidor vacía y comprobación de sus comandos. La prueba del paquete utiliza acceso al registro y no depende de metadatos precargados en el equipo de desarrollo.
- Verificador de documentación y manifiesto regenerable; configuración de GitHub Actions para tests, comprobación documental e instalación limpia.

La [evidencia local](m0-verification.json) identifica comandos, versiones, alcance y límites. Los resultados de ejecuciones remotas están en [GitHub Actions](https://github.com/afmanu/manu-control-center/actions). El commit de esta entrega vincula documentación, pruebas y código; la evidencia no almacena un hash de commit circular dentro de ese mismo commit.

## Decisiones tomadas

D13 fija GitHub como ubicación principal conservando el historial y MIT. D14 adopta aplicación local modular con TypeScript/Node, JSON Schema/Ajv, pruebas nativas de Node y SQLite para el piloto. D15 separa datos y distribución, selecciona candidatos de runtime y delimita qué queda por verificar. Motivos, alternativas y consecuencias: [decisions.md](decisions.md).

El módulo `node:sqlite` emite un aviso experimental con Node 24.14.1. Se mantiene aislado tras el adaptador y puede cambiarse si M1 detecta limitaciones. No se han instalado skills personales ni invocado agentes o servicios externos como integración del producto.

## Próximo trabajo concreto: M1

1. M1.1: completar contratos de necesidad, blueprint, especificación resuelta, plan y manifiesto con fixtures válidos e inválidos.
2. M1.2–M1.3: entidades y relaciones, contratos de ejecución y transiciones, reutilizando metadatos comunes sin confundirlos con entidades completas.
3. M1.4: convertir la prueba de almacenamiento en un backend de referencia con identidad de instancia, revisiones y aislamiento comprobados.
4. M1.5: identidad de efectos, promoción autorizada, política temporal y contrato de traslado con dependencias ejecutables.
5. M1.6: normalizar los fixtures de reunión y separar inputs de `expected` en el harness; implementar A27.

Consultar [roadmap](implementation-plan.md), [contratos](contracts.md), [ejecución](execution.md) y [aceptación](acceptance.md) conforme se necesiten. No desarrollar las treinta responsabilidades como servicios independientes.

## Límites y estado de aceptación

M1–M6 están pendientes. A01–A27 siguen siendo escenarios del sistema por implementar; aprobar tests de M0 no los acredita. Faltan constructor, backend de instancia, coordinador, workflows, integración real de runtime y datos propios del piloto. El paquete mínimo instalado no es todavía el sistema de uso diario.

Los ejemplos de reunión aún necesitan normalización. Los IDs `TO_BE_SELECTED` de la configuración ilustrativa no son destinos válidos. Las rutas calculadas para otras plataformas no acreditan compatibilidad real; ampliar pruebas cuando se declaren soportadas.

## Antecedentes preservados

Se incluyen arquitectura, contratos, roadmap, revisiones de fuentes y tres manifiestos documentales: el raíz refleja los archivos actuales; los dos de `references/` conservan los inventarios del handoff y del roadmap anteriores a la implementación. La [procedencia](../references/README.md) explica sus límites.

El análisis de origen ya está realizado. La carpeta documental anterior conserva su snapshot; no hay sincronización automática de decisiones con ella ni con el vault original. Los datos personales de ese vault no se han migrado.

## Cierre de futuras sesiones

Registrar fase y tareas realizadas, comandos realmente ejecutados, versiones, resultados y limitaciones. Actualizar este documento, las decisiones y la evidencia pertinente; regenerar el inventario documental. Mantener conocimiento de proyectos, estado de jobs y evolución del producto en sus autoridades correspondientes.

[Entrada](../README.md)
