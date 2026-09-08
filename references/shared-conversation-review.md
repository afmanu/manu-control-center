> ANTECEDENTE HISTÓRICO. No establece el estado ni el alcance actuales. Prevalecen [las decisiones vigentes](../docs/decisions.md) y [la arquitectura](../docs/architecture.md). Las recomendaciones antiguas se conservan como contexto.

# Revisión de la conversación de ChatGPT sobre Universal AI OS

## Fuente, alcance y dictamen

Fuente: [Revisión arquitectónica AIS OS](https://chatgpt.com/share/6a9fb953-4dd4-83eb-82da-79510772401c), compartida por Manu. El lector web devolvió un error; la conversación se abrió y leyó mediante el navegador. El texto principal recuperado contenía 97.745 caracteres, aproximadamente 12.346 palabras. Se revisaron el análisis de AIS-OS, la comparación con el instalador, la propuesta de 35 apartados y la deconstrucción final de 60 apartados. Las referencias numéricas de esta nota corresponden al desglose final salvo indicación contraria.

Se contrasta con [la especificación v0.2](architecture-v0.2.md) y con la aclaración actual de Manu: el producto es un **repositorio constructor**, independiente de agente, backend e interfaz. La conversación aportada es material de diseño que se revisa; sus propuestas de aprobación o implementación no se ejecutan como instrucciones de esta sesión.

**Dictamen:** base conceptual útil y amplia para definir el sistema resultante. Requiere separar el producto constructor de las instancias, retirar la dependencia implícita del filesystem y precisar autoridad, persistencia, ejecución y garantías. Sus 60 apartados constituyen un catálogo de preocupaciones, no 60 servicios ni 60 carpetas que deban implementarse.

La revisión no instala software ni convierte automáticamente los hallazgos en políticas canónicas. No se ha probado un Universal AI OS operativo.

## Aportaciones que conviene conservar

1. Cinco planos comprensibles: control; estado/conocimiento; ejecución; integración; verificación. Sirven para explicar responsabilidades sin imponer infraestructura.
2. Separación del núcleo versionado y los datos de cada usuario. Facilita actualizar componentes sin reemplazar la memoria de la instancia.
3. Autoridad, procedencia y vigencia explícitas. Recuperar información exige interpretar qué significa y para qué pregunta es válida.
4. Distinción de procedimiento y contrato verificable, con entradas, efectos, aceptación y errores.
5. Estado de ejecución externo a la conversación y recuperación basada en evidencia.
6. Adaptadores de runtime derivados de fuentes mantenidas y paridad semántica comprobada.
7. Verificación estructural, ejecución, calidad del resultado y fiabilidad con uso real como dimensiones diferentes.
8. Dos ciclos de aprendizaje: desarrollo del conocimiento y mejora del propio sistema. Son compatibles con el ciclo de ejecución del trabajo; no compiten como taxonomías.
9. Versiones, migraciones, historial de auditoría e identificación de fallos desde el diseño.

## Hallazgos y correcciones

### R01 — El constructor pierde protagonismo en la propuesta final

La comparación inicial identifica correctamente el patrón instalador que genera otro entorno. Sin embargo, el árbol de la propuesta de 35 apartados combina `kernel`, `workspace`, `audits`, `generated`, aplicaciones y scripts. El apartado 42 del desglose final reduce el instalador a bootstrap. Faltan fronteras precisas para blueprint, especificación de instancia, resolución de módulos, plan, recursos gestionados y reconciliación tras cambios.

**Corrección:** documentar dos arquitecturas relacionadas: el repositorio constructor y el sistema que produce. El constructor recibe una necesidad, compone un blueprint, comprueba destinos, genera un plan, lo aplica dentro del alcance autorizado y entrega una instancia con evidencia. Sigue disponible para adopción, actualización y reparación aunque no intervenga en el trabajo diario.

**Prueba:** dos usuarios generan instancias independientes desde la misma versión; actualizar una conserva sus datos y no altera la otra ni el repositorio de distribución.

### R02 — La independencia de Obsidian no alcanza la independencia del backend

Los apartados 6, 8 y el árbol previo conservan Markdown, frontmatter, wikilinks y filesystem como sustrato. Eso elimina dependencia del editor Obsidian, pero mantiene una representación física obligatoria. No cumple el alcance más amplio confirmado por Manu.

**Corrección:** definir entidades, relaciones, revisiones, consultas y estado antes de su representación. El adaptador materializa documentos, filas, objetos o archivos. Reutilizar [Universal Backend Model](backend-model.md). Obsidian queda en una combinación concreta de backend de archivos e interfaz.

**Prueba:** el mismo blueprint funciona sobre dos representaciones diferentes; el núcleo y los contratos de los workflows no necesitan rutas de carpetas. La exportación/importación conserva identificadores, relaciones, procedencia y estado aplicable.

### R03 — Autoridad, origen y vigencia aparecen mezclados

El apartado 12 enumera LIVE, CANONICAL, HISTORICAL, DERIVED, CACHE y REFERENCE como clases de fuente. Esas propiedades pueden coexistir: un informe derivado y aprobado puede ser autoridad sobre lo que se presentó en una fecha; una fuente consultada ahora puede contener un dato incorrecto o fuera del alcance de la pregunta.

**Corrección:** separar autoridad por entidad/campo y pregunta; procedencia; periodo de validez; fecha de observación; versión; criterio de verificación y política de caché. La autoridad especifica qué registro se usa para una función; no garantiza verdad absoluta. Ante una pregunta histórica debe consultarse la evidencia de ese momento.

**Prueba:** una consulta sobre el estado actual y otra sobre el estado usado para una decisión pasada obtienen respuestas distintas cuando corresponde, ambas con fuentes.

### R04 — Material derivado no equivale siempre a material descartable

Los apartados 11, 24, 45 y 57 agrupan generación y reconstrucción con reglas demasiado absolutas. Un adaptador compilado o un índice suele poder regenerarse; una propuesta enviada, un informe aprobado, un acta o un artefacto usado en una decisión deben conservar su versión exacta. Reejecutar un modelo no asegura reproducirlos.

**Corrección:** distinguir recursos generados del sistema, cachés/vistas reconstruibles y artefactos de trabajo versionados. Estos últimos pueden convertirse en registros autorizados mediante una transición explícita. Una interfaz puede escribir en el backend canónico; una aplicación puede aportar interfaz y backend sin violar la separación lógica.

**Prueba:** reconstruir un índice no modifica un informe aprobado; corregir un dato desde una UI actualiza el backend declarado sin crear una segunda autoridad.

### R05 — Las declaraciones necesitan un responsable de ejecución

Los apartados 16, 18–20 y 25–26 especifican contratos, estados y routing, pero falta determinar quién comprueba precondiciones, toma un trabajo, valida una transición y registra sus efectos. Un YAML con estados o `idempotent: true` no implementa esas propiedades.

**Corrección:** definir un coordinador mínimo de ejecuciones. Puede ser código común invocado por los agentes o un servicio si el despliegue lo necesita. El agente realiza interpretación y transformaciones; el coordinador gestiona identificación, estados, validaciones y registro de efectos. No obliga a construir otro loop general de LLM ni una plataforma distribuida desde el inicio.

**Prueba:** un estado completado exige evidencia verificable y la ejecución rechaza una transición inválida incluso cuando el agente intenta declararla.

### R06 — Cola, reintentos y continuidad necesitan control de concurrencia

Los apartados 19, 20, 26, 31 y 53 describen reanudación e idempotencia, pero no cubren dos trabajadores que toman el mismo trabajo o un efecto externo completado antes de que se pierda su respuesta.

**Corrección:** elegir un escritor por tarea inicialmente o implementar adquisición atómica con propietario y vencimiento. Comprobar revisiones del estado, registrar acciones antes de ejecutarlas, identificar cada efecto y reconciliar resultados inciertos. Una clave de idempotencia debe aplicarse en el límite que produce el efecto, cuando el destino la soporte. Los estados de cola son parte del ciclo de ejecución, con una autoridad definida.

**Prueba:** dos trabajadores no envían el mismo mensaje; tras un timeout se consulta el resultado antes de reintentar. Si no hay forma de saber qué ocurrió, la acción queda incierta y no se repite automáticamente.

### R07 — Los manifiestos de capacidades necesitan evidencia de sesión

Los apartados 22 y 25 usan booleanos como `mcp`, `browser` o `background`. No expresan alcance, disponibilidad temporal, versión, sesión autenticada o posibilidad de invocación programática. El ejemplo que exige filesystem y MCP para editar Obsidian tampoco representa las alternativas posibles.

**Corrección:** separar soporte declarado del adaptador, disponibilidad comprobada en la sesión y autorización por acción. Expresar alternativas de acceso. Para ejecución automática se necesita una vía de lanzamiento disponible y autorizada, con seguimiento de resultado; que una aplicación tenga una función no demuestra que un dispatcher externo pueda usarla.

**Prueba:** al revocarse una credencial o desaparecer un runtime, el router excluye la capacidad; un workflow puede usar escritura local o un servicio de escritura equivalente según su contrato.

### R08 — Agent Skills es un formato; el contrato adicional requiere implementación propia

Los apartados 15–18 proponen `SKILL.md` con `contract.yaml`. La especificación de Agent Skills permite archivos adicionales, pero no define el significado de ese contrato personalizado ni obliga a otros hosts a validarlo. El soporte de herramientas y lenguajes también depende del agente.

**Corrección:** adoptar el formato para distribuir procedimientos, declarar `contract.yaml` como extensión del proyecto y proporcionar su esquema y validador. Vincular cada criterio de aceptación con una prueba, rúbrica o revisión identificable. Comprobar consistencia entre contrato y procedimiento.

**Prueba:** un paquete válido en formato puede fallar el contrato funcional; un runtime que ignora el contrato no obtiene automáticamente la etiqueta de ejecución verificada. Fuente: [Agent Skills Specification](https://agentskills.io/specification).

### R09 — Skill, workflow y agente describen dimensiones distintas

El apartado 17 los presenta como una escalera que pasa por script, skill, workflow y agente. Una skill puede empaquetar un workflow completo; un workflow puede combinar código determinista con pasos interpretados por un agente. Su longitud no determina la necesidad de un agente.

**Corrección:** usar capability para el resultado reutilizable; skill para su paquete/procedimiento; workflow para la coordinación; agente para el ejecutor con decisiones dinámicas. Determinismo y autonomía son propiedades adicionales. Mantener el principio de mínima complejidad sin convertirlo en jerarquía rígida.

**Prueba:** el glosario clasifica un workflow con una transformación LLM sin duplicarlo como varios sistemas independientes.

### R10 — MCP y el gateway deben ser opciones de integración justificadas

La preferencia MCP → API → CLI → export → browser mezcla protocolos, transportes y mecanismos que pueden estar compuestos. El gateway propuesto permite acceso común desde varios clientes, pero `run_skill` introduce ejecución remota, identidad y gestión de trabajos, no solo lectura de memoria.

**Corrección:** elegir acceso por cobertura, control, fiabilidad y coste operativo. Mantener contratos neutrales. Añadir gateway cuando exista un cliente que lo necesite. Separar búsqueda/lectura, escritura controlada y ejecución de trabajos; esta última debe devolver identificación y estado, comprobar alcance y registrar efectos. No asumir que todos los clientes admiten ese gateway.

**Prueba:** un cliente autorizado para recuperar contexto no puede activar una acción externa. La [arquitectura MCP](https://modelcontextprotocol.io/specification/2026-07-28/architecture) mantiene responsabilidades propias en host, clientes y servidores; el protocolo no sustituye por sí mismo el control de workflows.

### R11 — Política y autonomía requieren alcance y mecanismos de cumplimiento

Los apartados 27–28, 54–55 aciertan al distinguir capacidad de permiso. Falta concretar dónde se hace cumplir cada restricción y cómo se vincula una autorización al actor, destino, acción y contenido aprobado. El ejemplo de veinte ejecuciones exitosas es ilustrativo, no un umbral de fiabilidad demostrado.

**Corrección:** aplicar las políticas compatibles del host, organización, usuario y workflow sin que el kernel pueda ampliar permisos del entorno. Preservar autorizaciones ya otorgadas dentro de su alcance. Distinguir control aplicado por herramientas de instrucciones de comportamiento. La transición de autonomía depende del riesgo, cobertura de pruebas y decisión autorizada, con posibilidad de revocación. Limitar contexto y secretos por instancia y tarea.

**Prueba:** cambiar destinatario o contenido fuera de lo autorizado invalida la autorización anterior; un agente no evade una restricción mediante otro conector. Un fallo relevante puede suspender la automatización sin borrar su historial.

### R12 — Versionado y migración necesitan límites de reproducibilidad

Los apartados 23–24 y 40–41 prometen reducir drift y migrar con rollback. Generar adaptadores desde una fuente evita mantenimiento divergente, pero puede replicar un error común. Fijar dependencias no garantiza respuestas idénticas del modelo. Algunas migraciones o acciones externas no tienen reversión simple.

**Corrección:** guardar blueprint resuelto, versiones, configuración efectiva y recursos gestionados; preservar overrides del usuario y comprobar drift antes de aplicar. Separar compilación reproducible de conducta evaluada. Cada migración declara precondiciones, restauración disponible, compensación o estrategia hacia adelante. Bloquear o revalidar ejecuciones incompatibles con el nuevo esquema.

**Prueba:** una personalización sobrevive a la actualización; una instrucción errónea común se detecta por pruebas semánticas aunque todas las copias coincidan.

### R13 — Evaluación, memoria y observabilidad necesitan criterios concretos

Los apartados 32–39 proponen buenas responsabilidades, pero aceptación como `decisions_extracted` puede premiar que exista una sección aunque invente decisiones. Un audit puede ejecutar probes controlados; debe diferenciar comprobar de modificar el sistema auditado. El registro exhaustivo de inputs también puede duplicar datos sensibles innecesariamente.

**Corrección:** combinar comprobaciones deterministas, fixtures con resultados esperados, evaluaciones semánticas y revisión humana cuando corresponda. Medir falsos positivos de memoria, recuperación de fuentes y continuidad. Guardar identificadores, versiones y evidencia mínima suficiente. Las mejoras de políticas/capacidades tienen su propia validación antes de activarse.

**Prueba:** una transcripción sin decisiones no produce decisiones inventadas; una revisión detecta una fuente obsoleta y una reparación posterior cierra el hallazgo con evidencia nueva.

## Cómo agrupar los 60 apartados

Conservar los cinco planos del sistema desplegado y describir por separado su construcción y ciclo de vida. La siguiente agrupación asigna un domicilio principal a todos los apartados del último mensaje; no exige un servicio por fila.

| Grupo | Apartados | Responsabilidad principal |
|---|---|---|
| Visión y principios | 1, 2, 3, 56, 57, 58, 59, 60 | Definición, arquitectura global, portabilidad e invariantes. |
| Control | 4, 5, 27, 28, 54, 55 | Kernel, contrato, autorización, autonomía y secretos. |
| Memoria y entidades | 6, 7, 8, 9, 10, 11, 48, 49 | Contexto, conocimiento, capturas, decisiones y proyectos. |
| Autoridad y recuperación | 12, 46, 47, 50, 51 | Procedencia, vigencia, búsqueda e índices. |
| Capacidades y procesos | 15, 16, 17, 18 | Paquetes, contratos y composición del trabajo. |
| Ejecución y recuperación | 19, 20, 25, 26, 29, 30, 31, 52, 53 | Estados, trabajos, efectos, triggers y errores. |
| Integraciones y acceso | 13, 14, 21, 22, 23, 24, 45 | Registro de fuentes, conectores, runtimes, paquetes e interfaces. |
| Verificación y aprendizaje | 32, 33, 34, 35, 36, 37, 38, 39 | Evidencia, evaluación, auditoría y ciclos de mejora. |
| Construcción y evolución | 40, 41, 42, 43, 44 | Versiones, migraciones, setup y onboarding; ampliar con blueprint y builder. |

Un principio, un formato, un algoritmo y un servicio no deben contarse como unidades equivalentes. Por ejemplo, error, recovery, idempotency y queue pueden ser responsabilidades de un único coordinador de ejecución.

## Arquitectura resultante propuesta

```text
REPOSITORIO CONSTRUCTOR
  modelo y contratos comunes
  + blueprints y módulos
  + procedimientos y evaluaciones
  + adaptadores y generador de planes
  + aplicación, actualización y reparación
                    ↓
ESPECIFICACIÓN DE INSTANCIA
  propósito + módulos + políticas + destinos + versiones
                    ↓
PLAN VERIFICABLE
  crear / reutilizar / modificar + precondiciones + pruebas
                    ↓
INSTANCIA DESPLEGADA
  control | conocimiento/estado | ejecución | integración | verificación
```

Dentro de una instancia, las políticas se consultan antes de acciones relevantes y la evidencia se recoge durante todo el recorrido. El diagrama del chat es útil para explicar, pero no debe interpretarse como una cadena donde permisos y verificación solo intervienen al final.

Documentos y código tienen papeles complementarios: Markdown explica principios/procedimientos; los esquemas expresan contratos; el código o servicio elegido aplica transiciones, revisiones y validaciones mecánicas; el agente interpreta información y produce resultados que requieren evaluación. El builder puede tener interacción guiada por agente y aplicación determinista de un plan validado.

## Versión inicial y pruebas decisivas

La versión inicial debe crear una instancia funcional y permitir usarla, no quedarse en un catálogo de componentes. Implementar:

- Un blueprint de conocimiento + trabajo sobre un proyecto.
- Modelo de entidades, autoridad, decisiones y ejecución.
- Captura/recuperación y un workflow que produzca un brief con fuentes.
- Construcción y adopción con manifiesto, más un caso de actualización que preserve personalización.
- Estado persistente, control de efectos, validación y evidencia.
- Dos backends de representación diferente y dos runtimes para probar que las abstracciones no filtran el primer destino.

Gateway, colas distribuidas, selección automática de modelos, múltiples schedulers, dashboards y multiagente entran cuando el caso piloto los requiera. La extensión queda prevista mediante contratos; no necesita estar desplegada desde la primera versión.

Casos que deben pasar antes de ampliar:

1. Capturar una hipótesis no la promociona como hecho confirmado.
2. Consultar estado actual e histórico respeta fecha, ámbito y procedencia.
3. Guardar un informe aprobado conserva el artefacto exacto aunque sea generado.
4. Otro runtime continúa el mismo trabajo sin duplicar efectos.
5. Dos trabajadores compitiendo no toman la misma acción de escritura.
6. Un timeout externo se reconcilia antes de reintentar.
7. Un destino sin capacidad requerida se rechaza o propone una alternativa explícita.
8. Actualizar preserva personalizaciones y detecta incompatibilidades de ejecuciones abiertas.
9. Un backend alternativo conserva significado, identidad y relaciones.
10. Una auditoría detecta un defecto conocido y exige evidencia nueva para cerrarlo.

## Comprobaciones de fuentes y límites

- La lectura directa de la conversación sustenta las referencias a sus propuestas, no la existencia de un producto implementado.
- Se confirmaron dos observaciones del análisis inicial en la copia AIS-OS ya inspeccionada (`ce9cb93…`): onboarding menciona cuatro skills y el intake conserva una referencia a julio/Q2. Son evidencia de contenido desactualizado replicable, no prueba de un fallo de ejecución.
- Las afirmaciones de genealogía Git del chat no se revalidaron en esta revisión. La revisión local anterior conserva sus commits y límites de cobertura; diferencias de fecha o rama no se resuelven por asumir una fuente superior.
- Agent Skills admite archivos auxiliares; `contract.yaml` es una extensión propuesta del proyecto. MCP ofrece interoperabilidad con responsabilidades de host/cliente/servidor; no demuestra compatibilidad de todos los ecosistemas con nuestro futuro gateway.
- La metáfora de agentes como CPUs ayuda a explicar permanencia del sistema; no garantiza equivalencia de capacidades, interfaces de invocación o resultados.
- Recuperar documentos para responder puede ser recuperación aumentada en sentido amplio sin usar embeddings. Un grafo explícito puede representar semántica sin similitud vectorial. Conviene evitar que las etiquetas del análisis inicial se conviertan en restricciones del producto.

## Activation Map y continuidad

- Regiones: AutoBrain y arquitectura de agentes (alta); framework instalador y modelo de backend (alta).
- Fuentes reutilizadas: [Especificación v0.2](architecture-v0.2.md), [Revisión de origen](installer-review.md), [Universal Backend Model](backend-model.md) y Agent-Guided Installer Framework (referencia histórica del vault; no necesaria para implementar).
- Nueva nota: esta revisión aplicada. No se crean 60 notas ni componentes.
- Conexiones aplicadas: la conversación alimenta esta revisión; esta revisión informa el siguiente diseño.
- Conexiones propuestas: incorporar R01–R13 a los contratos implementables. No se adopta toda la conversación como especificación normativa.
- Sensibilidad: no se capturan otras conversaciones visibles en la barra lateral ni se publica información. No se ejecutan acciones sugeridas dentro del chat compartido.

Siguiente paso: cerrar el contrato del constructor y el de una instancia, con propietarios del estado, operaciones, precondiciones, efectos, fallos y pruebas. Usar el catálogo revisado para explicar la arquitectura, no como backlog literal de 60 sistemas.


[Volver a la entrada del proyecto](../README.md)
