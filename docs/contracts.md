# Contratos de construcción e información

Versión adoptada en M1: `0.1.0-draft`. Existen 22 [esquemas](../schemas/contracts.schema.json), tipos, validadores, comprobación de composición y backend SQLite de referencia. [M1 implementado](m1-implementation.md) detalla campos exactos, mecanismos y límites. M2 implementa resolución, planificación, aplicación, verificación y adopción local en el perfil [foundation](installation.md); ejecución y exportación siguen el roadmap M3–M4. Complementa [la arquitectura](architecture.md) sin sustituirla.

## Convenciones comunes

Los registros persistentes usan `schema_version`, `id`, `instance_id` cuando corresponda, `revision`, `created_at` y `updated_at`. Identidad y revisión son distintas: editar no cambia el ID. Los tiempos llevan zona y se normalizan a UTC para comparación. Las referencias vinculan ID y revisión cuando el resultado depende de una versión exacta.

En M1, `StoredRecord` añade `kind`, `access` y `data` a los metadatos; el backend genera revisión y fechas. `InstanceSpec` tiene revisión propia para fijar la configuración aplicada. Los hashes de objetos usan JSON canónico; los de artefactos se calculan sobre contenido UTF-8 exacto.

Las escrituras reciben `expected_revision` o una precondición de ausencia. Un conflicto devuelve la revisión actual y no sobrescribe silenciosamente. Los IDs no deben derivarse únicamente del título ni de una ruta física. La representación de revisiones puede variar por adaptador, con comparación opaca por el núcleo.

Una operación devuelve éxito con datos y evidencia, o error con `code`, `message`, `retryable`, `details`, `evidence_refs` y, si hubo un intento de escritura, `effect_status`. La API de M1 usa `DomainError` serializable; `effect_status` corresponderá al resultado de invocación del coordinador. Una consulta vacía devuelve una página vacía. Para un registro individual, `NOT_FOUND` agrupa ausencia y falta de lectura en ese alcance para no revelar existencia; una escritura sin permiso sobre un registro legible devuelve `FORBIDDEN`.

Errores mínimos: `INVALID_INPUT`, `NOT_FOUND`, `CONFLICT`, `FORBIDDEN`, `AUTH_REQUIRED`, `CAPABILITY_UNAVAILABLE`, `INCOMPATIBLE_VERSION`, `STALE_PLAN`, `VALIDATION_FAILED`, `RATE_LIMITED`, `TIMEOUT`, `EFFECT_UNKNOWN`, `BUDGET_EXCEEDED`, `CANCELLED`. `retryable` no autoriza por sí solo a repetir un efecto.

## Blueprint y módulos — C02

Blueprint: ID, versión, propósito, entidades, módulos requeridos/opcionales, configuración requerida, capacidades de destino y escenarios de aceptación. Módulo: ID, versión, dependencias, contratos exportados, skills, workflows, migraciones y verificaciones. Preset: valores iniciales sobre campos permitidos, sin redefinir contratos.

Operación `resolve(blueprint, choices, catalog, observed_capabilities)` → especificación resuelta o conflictos. Detectar dependencias ausentes, ciclos, versiones incompatibles y una capacidad obligatoria no disponible. La resolución no crea recursos. Una alternativa más débil requiere quedar explícita en la especificación y en sus límites.

## Especificación de instancia — C03

Contiene identidad de instancia, propósito, blueprint y módulos fijados, kernel versionado, destinos de backend/runtime/interfaz, políticas y referencias a secretos, configuración y overrides. El estado deseado no afirma que los destinos ya estén instalados.

Separar la entrada del usuario con rangos o preferencias del resultado resuelto con versiones exactas. Guardar las elecciones y sus supuestos. Las rutas o nombres de tablas son configuración del adaptador; no campos obligatorios del modelo universal.

## Plan y aplicación — C04–C05

Plan: ID, hash de especificación resuelta, observaciones/revisiones del destino, operaciones ordenadas, dependencias, precondiciones, efectos, alcance requerido, pruebas y estrategia de recuperación. Cada operación identifica recurso lógico, destino físico mediante adaptador y ownership esperado.

Operaciones lógicas iniciales: inspeccionar, crear, reutilizar, actualizar y verificar. Retirar recursos debe modelarse explícitamente cuando se implemente; no se deduce de su ausencia en una plantilla nueva.

`plan(spec, observed_state, manifest?)` no modifica el destino. A igualdad de entradas y revisiones debe dar el mismo contenido lógico; IDs de informe y timestamps pueden diferir. `apply(plan, grant_refs)` revalida permisos y precondiciones antes de cada cambio y persiste checkpoints. Un destino que cambió produce conflicto o plan nuevo; no continúa sobre observaciones obsoletas.

Adopción: inventario → correspondencias propuestas → conflictos → plan de vinculación/creación → verificación. Coincidir en nombre no demuestra identidad ni propiedad. Registrar si cada recurso es gestionado, compartido o propiedad del usuario; la política de actualización depende de ese dato.

Si el proceso cae tras crear un recurso pero antes de guardar su recibo, la operación necesita clave estable o mecanismo de descubrimiento para reconciliarlo. Sin ese mecanismo, se mantiene incierta: no se crea otra copia automáticamente.

## Manifiesto y evolución — C06

Manifiesto: instancia, revisión, especificación aplicada, versiones efectivas, recursos lógicos/físicos gestionados, ownership, revisión/hash de referencia, overrides, estado de aplicación y últimas verificaciones. Su estado distingue al menos parcial, instalado sin verificar y verificado con cobertura.

Actualización compara tres elementos: versión gestionada anterior, estado observado y nueva versión deseada. Conservar ediciones del usuario; señalar conflicto si ambas partes cambian el mismo contenido. Una migración declara versiones origen/destino, precondiciones, transformación, prueba, backup/restauración o compensación y tratamiento de ejecuciones abiertas. No prometer restauración de efectos externos irreversibles.

## Entidades y relaciones — C10–C16

| Entidad | Campos semánticos específicos mínimos |
|---|---|
| Proyecto | Propósito, estado, responsable, siguiente acción, decisiones y fuentes pertinentes. |
| Fuente | Referencia externa o local, propietario, alcance, fecha observada, versión y acceso. |
| Captura | Fuente/revisión, fragmentos pertinentes, clasificación, estado de procesamiento y clave de deduplicación cuando exista. |
| Afirmación | Contenido, estado epistemológico, evidencia, ámbito y vigencia. |
| Decisión | Elección, actor, contexto, alternativas pertinentes, evidencia, fecha y criterio de revisión. |
| Artefacto | Tipo, contenido o referencia inmutable, hash, versión, estado de aceptación y evidencia. |
| Relación | ID origen/destino, tipo, procedencia y revisión; no inferir identidad por similitud de nombres. |

Estados epistemológicos adoptados en M1 (enums ingleses en el esquema): declarado, hipótesis, propuesto, confirmado, refutado. Son distintos del procesamiento de una captura (pendiente, integrado, descartado con motivo) y del estado de una decisión (vigente, sustituida, revocada).

Una fuente de autoridad declara entidad/campo/pregunta a la que aplica, propietario, prioridad o regla de resolución, periodo válido, momento de observación y política de actualización. La consulta histórica distingue fecha de validez y fecha en que el sistema conoció el dato. Si el backend no conserva la historia requerida, devolver cobertura insuficiente.

La búsqueda devuelve resultados con referencias y revisión, cobertura y vigencia. Debe filtrar permisos antes de exponer contenido. La ausencia de coincidencias no demuestra inexistencia. La selección de contexto conserva por qué esas fuentes son pertinentes sin registrar razonamiento interno del modelo.

La promoción de conocimiento exige evidencia y autoridad pertinentes; una orden clara ya autorizada puede integrarse directamente. No convertir automáticamente propuestas de una transcripción en decisiones de la persona.

## Backend y exportación — C24

Interfaz implementada en M1: `capabilities`, `forScope`, `get`, `query`, `create`, `update(record, expectedRevision)`, `history`, `link` y `close`. La consulta filtra tipo e identidad con paginación por ID. `export`, `import` y la verificación funcional de instancias quedan para sus hitos posteriores; las capacidades no implementadas se anuncian como falsas. Extensiones específicas del backend se declaran, no se filtran como requisitos generales.

Matriz de capacidades: revisiones, escritura condicional, atomicidad, exclusión de escritor, historial, relaciones, búsqueda, exportación, límites y aislamiento. Si falta una garantía del coordinador, elegir un almacén de estado adecuado o modo de un único escritor comprobable; no simular transacciones mediante una instrucción al agente.

Exportar incluye identidades, relaciones, revisiones históricas requeridas, procedencia, artefactos exactos, trabajos abiertos, efectos y referencias de configuración. Las credenciales se reconfiguran en destino. Importar produce informe de correspondencias y pérdidas/no soportados; una importación incompleta no se declara portable. Un estado interno de infraestructura como un lease activo se invalida y reacquiere de forma segura, conservando el historial de autoridad.

## Adaptación y compatibilidad — C20, C25–C27

Runtime: identidad/versión, capacidades declaradas, disponibilidad observada por sesión, alcance autorizado, método de invocación y resultados de pruebas. `prepare_context` y `handoff` pueden existir sin despacho remoto; `invoke` solo cuando el host lo soporte realmente.

Conector: operación, esquema de argumentos, retorno, alcance, efectos, límites, idempotencia real y consulta de resultado. UI/gateway: utiliza las mismas operaciones lógicas y controles; distinguir leer, escribir y ejecutar. Los tests de conectores simulados prueban al coordinador, no a una integración comercial.

[Entrada](../README.md)
