# Kernel, skills, workflows y estado de ejecución

Contratos y transiciones `0.1.0-draft` adoptados en M1. Existen guards de estado, presupuestos, versiones y autorización, junto con persistencia de referencia. El coordinador, leases, medición de consumo e invocaciones se implementarán en M3. El [alcance M1](m1-implementation.md) delimita las garantías comprobadas. La separación de responsabilidades proviene de [la arquitectura](architecture.md).

## Kernel y política

El kernel conserva tipos, invariantes y reglas comunes de autoridad, escritura, contexto, continuidad y aceptación. Las preferencias concretas y fuentes de una persona pertenecen a su instancia. Entradas de runtime se generan o referencian desde el kernel, con comprobación de coherencia; copiar textos no demuestra equivalencia semántica.

La decisión de política vincula actor, instancia, operación, recurso, destino, versión/hash del contenido cuando aplique, alcance temporal y estado de revocación. Devuelve permitir, denegar o requisito pendiente. El punto que realiza el efecto vuelve a comprobar alcance, revisiones y fencing; no basta un permiso leído al principio de la conversación.

## Skill y workflow

Contrato de skill: ID/version, propósito, esquema de entrada/salida, fuentes y herramientas permitidas, efectos, dependencias, límites, errores y evaluaciones. El procedimiento puede usar recursos o scripts. `SKILL.md` es un posible formato de distribución; un `contract.yaml` personalizado requiere esquema y validador propios. Ningún host se presume compatible con ese validador.

Workflow: ID/version, trigger, entrada, pasos, dependencias, condiciones, política, outputs y aceptación. Cada paso declara tipo (determinista, agente o humano), capability/version, input bindings, resultados requeridos, efectos y recuperación. Un flujo inválido con dependencia ausente, ruta sin salida o aceptación indefinida falla antes de iniciar.

## Registros de ejecución

- **Job:** solicitud identificada con instancia, workflow/version, entradas/revisiones, clave de deduplicación, prioridad si se usa, presupuestos y estado general.
- **Run:** intento de ejecutar un job, con ejecutor, estado, revisión, pasos, evidencia y causa de interrupción o cierre. Un retry puede crear otro run conservando la misma identidad de efectos lógicos.
- **Step:** estado, inputs fijados, output/evidencia, propietario temporal, fencing token y checkpoint. El control técnico debe validar el propietario al escribir.
- **Action:** intención de efecto, clave estable, destino, payload/hash, autorización, revisión esperada, estado, intentos y referencias remotas.
- **Handoff:** vista generada a partir de los registros anteriores: objetivo, versiones, fuentes, pasos válidos, artefactos, efectos confirmados/inciertos, límites y siguiente acción.

Todos se mantienen bajo la autoridad de C19. C21 opera sobre Action; C23 solicita transiciones de recuperación; C28 observa. Un resumen de handoff no es otro registro canónico editable de la ejecución.

## Estados de run

| Desde | A | Condición |
|---|---|---|
| `queued` | `running` | Ejecutor elegible adquiere control mediante operación atómica. |
| `running` | `waiting_input` | Dato o aprobación imprescindible ausente y registrado. |
| `running` | `blocked` | Dependencia, acceso o efecto incierto impide el siguiente paso. |
| `running` | `paused` | Checkpoint persistido y propietario liberado de forma segura. |
| `waiting_input`, `blocked`, `paused` | `queued` | Causa resuelta; revalidar versiones y acceso al adquirir de nuevo. |
| `running` | `succeeded` | Todos los outputs obligatorios tienen aceptación y efectos requeridos confirmados. |
| No terminal | `failed` | Fallo irrecuperable o política de reintentos agotada. |
| No terminal | `cancel_requested` | Solicitud de cancelación registrada; no planificar pasos nuevos. |
| `cancel_requested` | `cancelled` | Finalizado control de operaciones en vuelo; conservar acciones inciertas para reconciliación. |

La tabla combina aristas validadas en M1 con condiciones que debe ejecutar el coordinador de M3. Una revisión condicional no acredita por sí sola elegibilidad del ejecutor, adquisición de lease ni aceptación semántica.

Estados terminales no se reabren para ocultar intentos: un nuevo intento referencia el anterior. El estado del job deriva de runs y política de reintentos mediante el coordinador. Una cancelación no afirma que un efecto ya iniciado haya sido deshecho.

## Estados de acción y protocolo de efecto

`prepared → in_flight → confirmed | failed | unknown`. Una acción rechazada antes de invocar puede terminar `rejected`. Una acción incierta pasa a `confirmed` con evidencia del destino o a fallo sin efecto únicamente si se prueba que no ocurrió. Si se demuestra seguro reintentar, se conserva la identidad lógica y el historial de intentos.

1. Persistir intención, payload/version, destino, clave estable, autorización y revisión.
2. Adquirir autoridad de escritura; comprobar alcance y precondiciones en el punto de ejecución.
3. Registrar intento y llamar al destino usando idempotency key si la implementa.
4. Guardar recibo y comprobar resultado; solo entonces confirmar.
5. Ante respuesta perdida, reconciliar por referencia remota o clave. Si no es resoluble, bloquear esa dependencia sin repetirla.

M1 exige `reconciliation: no_effect_proven` y recibos para declarar fallo desde `in_flight` o `unknown`. Solo `failed → prepared` permite volver a intentar; al entrar en `in_flight` incrementa el contador exactamente una vez y comprueba el grant actual. Resolver `unknown → confirmed` exige `effect_confirmed`. El backend valida referencias de recibo y estados; M3/M6 deben comprobar la evidencia del destino y mediar la llamada.

No hay transacción universal entre base local y servicio remoto. La deduplicación de jobs, exclusión del escritor e idempotencia del destino son mecanismos diferentes y complementarios.

## Concurrencia, reanudación y versiones

El claim necesita compare-and-swap/transacción o un único escritor técnicamente impuesto. Un lease con vencimiento necesita fencing o mecanismo equivalente que impida escrituras de un ejecutor anterior. La expiración del lease no demuestra que una operación externa terminó.

Al reanudar, comprobar versión del workflow, revisiones de fuentes, autorizaciones, ownership y efectos abiertos. Reutilizar pasos cuyo output siga válido; invalidar solo los dependientes de cambios, conservando evidencias anteriores. Una actualización puede fijar runs a versiones antiguas o migrarlos expresamente, pero no reinterpretar silenciosamente su estado.

## Errores, presupuestos y observabilidad

Definir por operación límites de reintentos y espera, timeout, tiempo total y llamadas/coste/contexto donde sean observables. Un error de validación de entrada no mejora repitiendo la misma llamada. Un error de acceso no concede permiso para cambiar a otro mecanismo más amplio. El agotamiento deja un estado y siguiente acción legibles.

Registrar IDs, versiones, transiciones, tiempos, actor, errores y referencias mínimas a evidencia. Los contenidos y secretos no se vuelcan indiscriminadamente en logs. Un evaluador semántico conserva modelo/configuración/rúbrica usados y ejemplos revisables; su resultado no sustituye las comprobaciones deterministas de permiso o identidad.

## Cadencia y mejora

Trigger: ID/version, workflow, evento u horario, timezone, dedup key, política de misfire, fuente y permisos. El scheduler genera jobs; no implementa otra máquina de ejecución. La cadencia se verifica con ejecuciones reales, desconexión y eventos repetidos.

Auditoría: hallazgo estable, criterio, cobertura, evidencia, estado y revisión. Estados posibles: nuevo, abierto, resuelto, reabierto, no revisado y no aplicable. Cerrar exige evidencia nueva. El cambio propuesto se prueba antes de activar; el aprendizaje de conocimiento y la modificación de políticas no se fusionan en un único paso automático.

[Entrada](../README.md)
