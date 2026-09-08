# Alcance ejecutable de M1

Versión del paquete: `0.1.0-dev.1`. Contratos: `0.1.0-draft`, revisables antes de una API estable. Este documento distingue el código disponible de los recorridos previstos en la arquitectura.

## Contratos y composición

[models.ts](../core/models.ts) define tipos y [schema-definitions.ts](../core/schema-definitions.ts) es la fuente de los [esquemas JSON](../schemas/contracts.schema.json). [validation.ts](../core/validation.ts) añade invariantes semánticos. El inventario de 22 contratos es:

| Grupo | Contratos |
|---|---|
| Construcción | `need`, `module`, `blueprint`, `instance_spec`, `plan`, `manifest` |
| Conocimiento | `project`, `source`, `capture`, `claim`, `decision`, `artifact`, `relation` |
| Ejecución y autorización | `authorization`, `job`, `run`, `step`, `action` |
| Definiciones | `skill`, `workflow` |
| Portabilidad y evaluación | `transfer_plan`, `eval_fixture` |

Los registros persistidos combinan metadatos `RecordEnvelope` con `kind`, `access` y `data`. `access` declara `owner_id`, `readers` y `writers`; los escritores también pueden leer. `NewRecord` omite revisión y fechas, que genera el backend. Un `Ref` fija ID y revisión; un `VersionRef` fija ID y versión de una definición. `InstanceSpec.revision` permite referenciar la especificación aplicada desde el manifiesto.

Los estados se materializan como enums ingleses: afirmación `declared/hypothesis/proposed/confirmed/refuted`; captura `pending/integrated/discarded`; decisión `proposed/active/superseded/revoked`; artefacto `draft/approved`. Los nombres españoles de la especificación describen su significado, no campos adicionales.

`assertConstructionBundle` comprueba identidades, versiones exactas, cierre de dependencias, configuración requerida, capacidades declaradas, alcance de efectos, hash de especificación y referencia del manifiesto. Rechaza operaciones de plan fuera de orden topológico y precondiciones inconsistentes. Un manifiesto declarado verificado requiere pruebas obligatorias aprobadas con referencias de evidencia. M2 deberá generar el plan, inspeccionar los adaptadores y producir esa evidencia; M1 no acredita que una declaración de disponibilidad sea cierta.

Los grafos de workflows rechazan ciclos, dependencias o outputs inexistentes, bindings a pasos no declarados como dependencia directa y pasos terminales sin output del workflow. Los esquemas embebidos de entrada/salida se comprueban sin cargar referencias remotas y sin compartir un registro mutable de IDs entre validaciones. La ejecución de esos workflows pertenece a M3.

## Persistencia y autoridad

[SqliteBackend](../adapters/backends/sqlite/store.ts) implementa `forScope`, `create`, `get`, `query`, `update`, `history` y `link`. Cada escritura utiliza una transacción `BEGIN IMMEDIATE`; actualizar exige la revisión esperada y guarda una revisión nueva junto con el historial y el acceso. Las referencias deben existir en la revisión indicada, tener el tipo correcto y ser legibles por el actor. Los fragmentos de evidencia deben existir en la fuente fijada.

La identidad de instancia forma parte de las claves de almacenamiento. Las consultas filtran instancia y actor en SQL antes de paginar. Las lecturas históricas utilizan el acceso actual: revocar lectura también impide leer las versiones anteriores. `NOT_FOUND` representa un registro ausente o no disponible en ese alcance para evitar revelar su existencia; un registro legible sin permiso de escritura devuelve `FORBIDDEN` al intentar modificarlo.

Solo el propietario puede cambiar el acceso; propietario, ID, tipo e instancia son inmutables. Solo un alcance con `can_authorize` puede emitir o modificar autorizaciones. **El host debe autenticar y fijar el alcance**: `forScope` no autentica una identidad recibida de una fuente o de un modelo. Tampoco protege frente a acceso directo al archivo SQLite. M3 debe mediar las herramientas desde ese host confiable.

Promover una decisión exige un grant persistido, vigente y no revocado para actor, instancia, operación, recurso, destino y contenido. La promoción conserva la revisión del grant y recibe la fecha del backend. La procedencia histórica no se reinterpreta cuando el grant cambia; una escritura nueva debe usar su revisión actual. Los artefactos aprobados conservan todos sus datos y aceptación sin cambios.

Capacidades anunciadas: `conditional_writes`, `atomic_writes`, `history` y `scoped_queries`. `export_import` y `distributed_fencing` son `false`. Se prueban dos conexiones concurrentes y reapertura del archivo; no hay coordinador distribuido. El adaptador rechaza bases de otra aplicación antes de crear sus tablas.

## Efectos, tiempo y ejecución

`effectKey` es SHA-256 del JSON canónico de `['mcc-effect-v1', instance_id, job_id, step_id, effect_name]`. No incluye run, intento ni payload: reintentar un efecto lógico conserva la clave. Una repetición intencionada debe tener una identidad lógica de ocurrencia distinta. No se soportan varias ocurrencias indistinguibles dentro del mismo job/paso/nombre de efecto.

`hashJson` ordena claves de objetos, conserva el orden de arrays y rechaza valores no JSON; `hashText` conserva los bytes UTF-8 del contenido. El backend devuelve la acción existente ante la misma clave, contenido y destino; rechaza otra combinación de payload o destino. Esto evita duplicar intenciones locales, sin prometer idempotencia de un servicio remoto.

Las transiciones rechazan reaperturas terminales y mantienen definiciones/entradas de jobs fijadas. Antes de pasar una acción a `in_flight` se verifica la autorización y se incrementa el intento exactamente una vez. Un efecto `unknown` no puede reintentarse directamente; resolverlo requiere referencias de recibo y una clasificación de reconciliación. Un run no puede cerrarse con acciones referenciadas sin confirmar. Estas comprobaciones no invocan ni verifican un destino externo: esa responsabilidad llegará con M3/M6.

`assertBudget` impide iniciar otra operación con límites agotados; no cancela llamadas en vuelo ni mide el consumo. `resolveSourceVersions` conserva las revisiones en modo `snapshot` o selecciona las actuales y señala invalidación en modo `fresh`; requiere que las versiones elegidas estén disponibles. La aplicación de esa invalidación a pasos y checkpoints corresponde al coordinador. El token de fencing solo tiene un guard de monotonía; falta vincularlo a leases y propietarios reales.

## Traslado y evaluaciones

`transfer_plan` distingue `move`, `copy` y `restore`. La copia exige identidad nueva y jobs inactivos; una migración conserva la identidad. Activar trabajos exige origen declarado congelado. Se incluyen revisiones, referencias a secretos y definiciones exactas de skill/workflow/validador con hash, contenido o localizador y dependencias cerradas sin ciclos. La verificación de disponibilidad remota, la congelación efectiva, los backups y el traslado de datos se implementarán en M4.

[runEvalCase](../evals/harness.ts) valida y clona el fixture antes de llamar a `execute(input)`. Conserva `expected` en una copia para `evaluate(output, expected)`. Los cuatro ejemplos comparten esquema; formatos inválidos no llegan al ejecutor. Un test añade una marca exclusiva de expectativas para comprobar que no aparece en la entrada del ejecutor. El harness no es un sandbox contra código hostil ni un evaluador semántico ya integrado.

## Evidencia y siguientes garantías

74 tests comprueban contratos, composición, estados, autorización, historial, aislamiento, carrera real de escrituras, deduplicación, CLI y separación A27. La instalación limpia repite los tests y verifica CLI e imports públicos desde el paquete instalado. Los [resultados y huellas](m1-verification.json) delimitan la evidencia.

M2 debe construir y verificar instancias. M3 debe conectar identidad del host, coordinador, runtime y fidelidad del resultado; M4 debe demostrar otro backend y runtime. Las interfaces de [adaptadores](../core/adapters.ts) fijan esas fronteras sin declarar implementaciones inexistentes.

[Entrada](../README.md)
