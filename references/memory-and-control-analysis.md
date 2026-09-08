> ANTECEDENTE HISTÓRICO. No establece el estado ni el alcance actuales. Prevalecen [las decisiones vigentes](../docs/decisions.md) y [la arquitectura](../docs/architecture.md). Las recomendaciones antiguas se conservan como contexto.

# Arquitectura de sistemas con memoria y control

## Contexto y estado

Propuesta de base de creación derivada del análisis de la estructura, los protocolos y una muestra dirigida de notas del vault de Manu. El objetivo es hacer explícitas sus decisiones de diseño y convertirlas en una base aplicable a proyectos y agentes.

El nombre y la agrupación son una síntesis propuesta el 2026-09-08. No consta que este framework guiara desde el inicio la construcción del vault. Tampoco constituye una auditoría exhaustiva de enlaces, calidad del conocimiento o funcionamiento de repositorios externos.

## Definición

Diseñar sistemas que expliciten su propósito, recuperen el contexto necesario, ejecuten procedimientos delimitados, conserven continuidad y mejoren a partir de evidencia.

La arquitectura del vault combina organización por responsabilidad y ciclo de vida, memoria en varias capas, navegación mediante hubs y relaciones, procedimientos especializados y reglas de control humano.

## Cómo se construyó: evidencia histórica

| Momento | Evidencia documental | Principio transferible |
|---|---|---|
| Abril de 2026 | El historial de AGENTS (referencia histórica del vault; no necesaria para implementar) registra la base organizativa y la introducción de hubs. | Dar a cada información un lugar y una vía de recuperación. |
| 8 de mayo | La sesión de arquitectura (referencia histórica del vault; no necesaria para implementar) decide conservar la base PARA, añadir `_system`, separar logs y conocimiento y crear continuidad. | Evolucionar sobre una estructura útil; separar reglas, contenido e historia. |
| 21 de mayo | Agent Components Taxonomy (referencia histórica del vault; no necesaria para implementar) y Agents as Operational Systems (referencia histórica del vault; no necesaria para implementar) formalizan contratos, capacidades, memoria, estado, permisos y evaluación. | Describir el sistema operativo que rodea al modelo. |
| 22 de mayo | La sesión Neural Vault (referencia histórica del vault; no necesaria para implementar) añade activación y conexiones mediante protocolo y skills, manteniendo la estructura base. | Incorporar capacidades de forma incremental, con autonomía delimitada. |

Interpretación: el patrón observado es evolución incremental por capas, con especial atención a preservar contexto y continuidad. Las fechas describen lo registrado en el vault; no reconstruyen cada cambio físico del repositorio.

## Principios mentales

1. **Propósito antes que componentes.** Definir qué problema se resuelve y qué resultado útil permite cerrar el trabajo. Elegir después entre documentación, script, workflow, skill o agente.
2. **Separación de responsabilidades.** Distinguir reglas, fuentes, hipótesis, decisiones, resultados, memoria duradera y estado temporal. La carpeta materializa esa distinción, pero no la sustituye.
3. **Contexto antes que acción.** Buscar lo existente, localizar su autoridad y vigencia y cargar únicamente lo relevante para la tarea.
4. **Continuidad como requisito.** Dejar el sistema listo para ser retomado por otra sesión o persona: estado, decisiones, pendientes y siguiente paso explícitos.
5. **Evidencia antes que consolidación.** Diferenciar lo propuesto, implementado y verificado. Guardar aprendizajes selectivos con su procedencia y grado de certeza.

Estos principios son una síntesis de reglas documentadas. No describen rasgos psicológicos del propietario ni garantizan cumplimiento uniforme en todas las notas.

## Seis capas arquitectónicas

| Capa | Pregunta | Manifestación en el vault | Traducción a un agente | Prueba de presencia efectiva |
|---|---|---|---|---|
| Propósito y contrato | ¿Para qué existe y qué debe entregar? | Identidad del vault y objetivos de hubs. | Misión, entradas, salidas, alcance y criterios de éxito. | Se puede aceptar o rechazar un resultado por criterios definidos antes de ejecutarlo. |
| Contexto y acceso | ¿Qué necesita saber y dónde lo encuentra? | Mapa, hubs, wikilinks y resolver. | Recuperación selectiva, fuentes autorizadas y conectores cuando hagan falta. | Una sesión nueva localiza las fuentes pertinentes y distingue una fuente ausente de un dato confirmado. |
| Capacidades y proceso | ¿Cómo transforma entradas en resultados? | Skills de resolución, captura y revisión. | Procedimientos, herramientas y rutas de ejecución. | Un caso representativo produce un artefacto útil y verificable. |
| Memoria y estado | ¿Qué conserva y dónde quedó? | Knowledge, sesiones, decisiones y hubs de continuidad. | Memoria duradera separada del checkpoint de cada ejecución. | Tras interrumpir y reanudar, conserva decisiones vigentes y evita repetir acciones ya completadas. |
| Control y evaluación | ¿Qué puede hacer y cómo sabemos que lo hizo bien? | Reglas de edición, nivel de autonomía y criterios de integración. | Permisos efectivos, condiciones de parada, validadores y pruebas. | Un caso fuera de alcance se detiene; un resultado incorrecto falla la validación. |
| Mantenimiento y evolución | ¿Cómo conserva su utilidad? | Protocolo de síntesis y skill de consolidación. | Revisión de vigencia, fallos, costes y mejoras verificadas. | Se detecta un problema y queda evidencia de su corrección; si hay programación, existen registros reales de ejecución. |

Las capas son responsabilidades, no seis agentes ni seis carpetas obligatorias. Propósito y control se definen desde el comienzo; contexto, memoria y capacidades pueden crecer durante una primera ejecución completa. La autonomía recurrente se añade cuando esa ejecución es fiable.

## Secuencia de creación

```text
Problema concreto
  → Resultado y criterios de éxito
  → Fuentes, contexto y límites
  → Proceso mínimo y componentes necesarios
  → Primera ejecución completa
  → Validación del resultado y de los límites
  → Estado, evidencia y aprendizaje selectivo
  → Repetición y mantenimiento
```

Ante un fallo se vuelve al contrato, al contexto o al proceso afectado. El aprendizaje solo modifica reglas o memoria cuando su evidencia lo justifica.

| Paso | Artefacto mínimo |
|---|---|
| Formular el problema | Una frase con usuario, necesidad y resultado útil. |
| Definir el contrato | Entradas, salida, exclusiones, aceptación y parada. |
| Resolver contexto | Mapa breve de fuentes y autoridad; información faltante explícita. |
| Diseñar el proceso | Pasos y decisiones; responsabilidades y herramientas necesarias. |
| Ejecutar y validar | Un resultado real, evidencia y un caso de fallo relevante. |
| Preparar continuidad | Estado actual, decisiones, siguiente paso e historial de la ejecución. |
| Mantener | Disparador de revisión y señal observable que motive cambios. |

## Relación con el ejemplo aportado

El usuario proporcionó un extracto que atribuye a Nate Herk los marcos Three Ms y Four Cs. Se usa como ejemplo de cómo comunicar una metodología; no se inspeccionó el kit ni se verificó su funcionamiento.

- **Three Ms:** el ejemplo separa mentalidad, método y construcción. Esta propuesta separa principios, capas arquitectónicas y secuencia de creación.
- **Context:** corresponde a contexto y recuperación; en este vault también incluye continuidad y memoria.
- **Connections:** en el ejemplo son accesos vivos a herramientas y datos. Los wikilinks del vault aportan navegación semántica, pero no demuestran integración con servicios externos.
- **Capabilities:** corresponde a procedimientos y herramientas. Un archivo de skill acredita una definición disponible, no una ejecución correcta por sí mismo.
- **Cadence:** corresponde a operación recurrente. Una skill de revisión puede invocarse manualmente; su existencia no demuestra una automatización activa.

La aportación central de esta síntesis es hacer explícitas misión, memoria/estado y control/evaluación junto a las capacidades. Es una propuesta de diseño adaptada al material del vault, no una comparación de superioridad entre productos.

## Ejemplo: agente de seguimiento de proyectos

**Misión:** producir una lista priorizada de proyectos que requieren atención, con motivo, fuente y siguiente paso.

**Contexto:** hubs y decisiones relevantes, fecha de actualización y criterios de actividad. La ausencia de logs se trata como falta de información, no como prueba de inactividad.

**Proceso:** localizar proyectos dentro del alcance, recuperar continuidad, detectar bloqueos y preparar propuestas. Puede comenzar como un único workflow.

**Memoria:** conservar decisiones confirmadas y reglas estables. **Estado:** registrar qué proyectos se revisaron, qué quedó pendiente y qué resultado corresponde a esta ejecución.

**Control:** no declarar terminado un proyecto ni modificar su prioridad por inferencia. Cualquier cambio debe estar dentro de la autorización concreta de la tarea.

**Evaluación:** cada recomendación enlaza a su evidencia, distingue hechos e incertidumbres y propone un paso coherente con el hub. Probar un hub actualizado, uno contradictorio y uno sin siguiente paso.

**Mantenimiento:** revisar manualmente primero. Si se necesita recurrencia, configurar el disparador y comprobar registros de ejecuciones reales.

## Plantilla breve para un proyecto nuevo

```text
Propósito: qué problema y para quién.
Resultado: qué entregable demuestra utilidad.
Contrato: entradas, alcance, exclusiones y aceptación.
Contexto: fuentes, autoridad, vigencia e información faltante.
Proceso: pasos, decisiones y componente mínimo suficiente.
Capacidades: herramientas y procedimientos requeridos.
Memoria: qué merece persistir y bajo qué criterio.
Estado: qué guardar para retomar esta ejecución.
Control: permisos, límites y condiciones de parada.
Evidencia: cómo verificar resultado y restricciones.
Mantenimiento: qué señal exige revisión y quién la ejecuta.
```

Para agentes, desarrollar esta ficha mediante la Agent Design Spec (referencia histórica del vault; no necesaria para implementar) existente. No hace falta duplicar la plantilla técnica.

## Límites y siguiente validación

- El vault demuestra una arquitectura documental; este análisis no verifica todos sus mecanismos en ejecución.
- Los hubs consultados de SPPF-G y Nano contienen validaciones o integraciones pendientes. Documentación de diseño y disponibilidad operativa deben mantenerse separadas.
- Una nota con `validado: true` no sustituye la revisión de su evidencia.
- La recurrencia de consolidación y la calidad global de recuperación no se auditaron.
- El principal riesgo de aplicación es convertir cada proyecto en una arquitectura demasiado grande. Cada responsabilidad puede resolverse inicialmente con pocas líneas si basta para el caso.

**Siguiente validación propuesta:** aplicar la ficha a un proyecto pequeño y comprobar tres comportamientos: produce el entregable, se retoma sin reconstruir contexto y detecta un fallo relevante. Medir utilidad antes de convertir esta propuesta en estándar general.

## Activation Map

**Regiones activadas:** Second Brain y sistema del vault (alta); AI Agents y diseño operativo (alta); SPPF-G y Nano como contraste documental (media).

**Neuronas reutilizadas:** Knowledge Flow, Project States, Neural Vault Protocol, Agent Components Taxonomy, Agent Anatomy, Compiled Truth + Timeline y Agent Design Spec.

**Neuronas nuevas:** este framework en borrador y el registro temporal del análisis.

**Conexiones aplicadas:** las notas anteriores alimentan esta síntesis; la ficha remite a Agent Design Spec para su desarrollo técnico.

**Conexiones propuestas:** reutilizar esta base en nuevos proyectos y evaluar su ajuste a SPPF-G. No se cambian sus contratos ni se adopta como estándar por defecto.

**Riesgos:** confundir inferencia con historia, documentación con operación o metáfora neural con implementación literal. La nota permanece en el vault privado y no incorpora contenido operativo privado de los proyectos consultados.

## Contraste posterior con AIS-OS — 2026-09-08

Tras la propuesta inicial, Manu pidió comparar esta arquitectura con [nateherkai/AIS-OS](https://github.com/nateherkai/AIS-OS). Se inspeccionó una copia del commit `ce9cb93a1145da5daba84ea37208ec35fd03606e`: manuales, registro de conexiones, expansión, seis skills, rúbrica e historial de auditoría, sincronización y definición del paquete visual. No se ejecutaron entrevistas, automatizaciones ni el explorador.

### Corrección del alcance de la comparación inicial

La sección anterior se basaba solo en el extracto aportado y queda como registro de aquella lectura. El repositorio completo sí especifica memoria, continuidad, autoridad de fuentes, límites de actuación y evaluación. Por tanto, que estas responsabilidades aparezcan como capas explícitas en nuestra síntesis no demuestra que sean exclusivas ni ausentes en AIS-OS.

Además, esta propuesta es una abstracción derivada de un vault personal existente; AIS-OS es un kit de inicio que debe personalizarse. Comparar cantidad de notas o amplitud temática entre ambos no mediría calidad arquitectónica.

### Conclusiones del contraste

| Dimensión | Vault y propuesta derivada | AIS-OS inspeccionado | Conclusión |
|---|---|---|---|
| Foco | Conservar conocimiento, conectar aprendizajes y retomar líneas de trabajo. | Personalizar un asistente para prioridades operativas y desarrollar capacidades útiles. | Diferentes centros de diseño, con bastante arquitectura compartida. |
| Organización | Capas explícitas de captura, aplicación, conocimiento, historia y recursos; hubs y relaciones tipadas. | Base pequeña de contexto, referencias, decisiones y conexiones, ampliada cuando hay necesidad. | Conservar las distinciones semánticas sin obligar a replicar toda la jerarquía en cada proyecto. |
| Captura | Procesamiento selectivo mediante el workflow y skills del vault. | Onboarding y entrevistas con guardado por respuesta, correcciones trazables y promoción de hechos confirmados. | Incorporar una entrada guiada reduciría la dependencia del conocimiento previo de Manu. |
| Navegación | Activation Map y conexiones que expresan significado. | `/link` registra cuándo usar una fuente y verifica la ruta desde el manual. | Distinguir relación conceptual de ruta de recuperación; ambas tienen valor. |
| Evaluación | Las skills locales revisadas se centran en conexiones, duplicados, hubs y continuidad. | `/audit` define pruebas de recuperación, criterios puntuables, evidencia y límites de cobertura. | La auditoría operativa de AIS-OS está más especificada que estas skills concretas del vault. |
| Evolución | Síntesis y propuestas de mantenimiento. | Auditoría → mejora seleccionada → verificación posterior, con historial de hallazgos. | Añadir un ciclo cerrado de mejora sin crear capacidades innecesarias. |
| Portabilidad | El manifiesto sirve de entrada al contexto del vault; no se auditó su portabilidad completa. | Dos manuales y paquetes de skills con origen y transformación declarados. | Definir una fuente canónica y comprobar copias generadas cuando se soporten varios entornos. |

### Evidencia concreta y límites

- [La skill de auditoría](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/audit/SKILL.md) exige cinco pruebas de recuperación y separa defectos, falta de verificación y oportunidades. Las reglas de [historial](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/audit/history.md) mantienen identificadores y requieren evidencia fresca para cerrar hallazgos.
- [Grill Me](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/grill-me/SKILL.md) distingue captura, hechos confirmados, propuestas e información canónica. Confirma una coincidencia importante con la separación de capas del vault.
- [El registro de conexiones](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/connections.md) contiene espacios por personalizar. El kit descargado no demuestra acceso real a sistemas del usuario ni ejecución recurrente.
- Se compararon los 40 archivos de las seis skills canónicas con su copia, aplicando en memoria la sustitución de rutas declarada por [el script de sincronización](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/scripts/sync-codex-skills.sh). Coincidieron todos y no hubo archivos adicionales. Los dos manuales raíz también coincidieron. Es una comprobación estática, no una prueba de comportamiento entre runtimes.
- Las skills contienen reglas de control expresadas en texto. No basta una etiqueta de fase en frontmatter para demostrar un bloqueo técnico de autonomía. Los permisos y controles reales dependen también del entorno de ejecución.

### Qué adoptar y qué adaptar

**Adoptar como principios de la futura implementación:** entrada guiada, rutas de recuperación comprobables, pruebas concretas, registro persistente de hallazgos y una mejora verificada por ciclo. Estas son propuestas; no se instalaron las skills ni se modificó el comportamiento operativo del vault.

**Adaptar el criterio de éxito:** la [rúbrica](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/audit/rubric.md) limita Cadence a 10/25 en un sistema exclusivamente manual y el total a 69/100 sin la evidencia automática exigida. Es coherente con su objetivo de operación recurrente, pero no sería una medida universal de calidad para investigación o conocimiento personal.

**Adaptar el criterio de utilidad:** [Level Up](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/level-up/SKILL.md) pide categoría de impacto empresarial y métrica. Para este vault, también pueden servir recuperar evidencia, resolver una pregunta, reducir errores o mejorar la continuidad, sin traducir todo a ingresos.

**Adaptar la estructura:** [Expansions](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/EXPANSIONS.md) evita una inbox y las carpetas anticipadas. El vault tiene un propósito legítimo de captura sin procesar; el criterio trasladable es controlar su acumulación y procesamiento, no eliminarla por adoptar otra convención.

### Base resultante para proyectos y agentes

Conservar las seis responsabilidades de este framework y añadir una interfaz de uso y pruebas: puesta en marcha guiada, caso mínimo útil, recuperación y reentrada comprobadas, límites verificados y una mejora concreta por ciclo. La profundidad del sistema debe crecer según la necesidad del proyecto.

Estado: propuesta pendiente de aplicación práctica. Este contraste no demuestra superioridad operativa global de ninguno de los dos sistemas.

## Referencias principales

**Revisión de origen — 2026-09-08:** [Revisión del instalador original y propuesta Second Brain / AI OS](installer-review.md) incorpora el repositorio identificado por Manu. La propuesta se concreta en un núcleo compartido, dos ciclos de uso y modos de crear/adoptar/actualizar/reparar. Prioridad: resolver la divergencia de manuales y skills, reutilizar el framework instalador existente y validar comportamientos antes de ampliar estructura. Continúa siendo una propuesta, sin migración operativa.

- Flujo de información (referencia histórica del vault; no necesaria para implementar)
- Estados y hubs de continuidad (referencia histórica del vault; no necesaria para implementar)
- Neural Vault Protocol (referencia histórica del vault; no necesaria para implementar)
- Agent Components Taxonomy (referencia histórica del vault; no necesaria para implementar)
- Agent Anatomy (referencia histórica del vault; no necesaria para implementar)
- Compiled Truth + Timeline (referencia histórica del vault; no necesaria para implementar)
- Second Brain (referencia histórica del vault; no necesaria para implementar)


[Volver a la entrada del proyecto](../README.md)
