> ANTECEDENTE HISTÓRICO. No establece el estado ni el alcance actuales. Prevalecen [las decisiones vigentes](../docs/decisions.md) y [la arquitectura](../docs/architecture.md). Las recomendaciones antiguas se conservan como contexto.

# Revisión del instalador original y propuesta Second Brain / AI OS

## Alcance y conclusión

Manu identificó [claude-obsidian-second-brain-installer](https://github.com/afmanu/claude-obsidian-second-brain-installer) como instalador original del que evolucionó su vault. La revisión incorpora ese origen a la comparación anterior con AIS-OS. El objetivo es permitir uso desde Codex, Claude Code, Cowork y otros entornos mediante capacidades verificadas.

**Propuesta:** un sistema de conocimiento compartido, una capa operativa opcional y un instalador que gestione creación, adopción, actualización y reparación. La prioridad es consolidar contratos y probar comportamientos. Las recomendaciones no constituyen decisiones adoptadas ni cambios de configuración.

Versiones inspeccionadas:

- Instalador original: commit `9cb05973a04b6e2b945fac591ccec8bf6f43f85c`, 2026-05-05; 31 archivos versionados. Inspección estática de bootstrap, instalación, comandos, perfiles, contratos, recuperación, ejemplo y configuración MCP.
- AIS-OS: commit `ce9cb93a1145da5daba84ea37208ec35fd03606e`, 2026-09-06; manuales, seis skills, evaluación, historial, sincronización y paquete visual.
- Vault local: manifiestos, protocolos, skills locales y documentación relacionada. Revisión dirigida, sin auditoría exhaustiva de todas las notas.
- Documentación oficial actual de los entornos, consultada el 2026-09-08.

La copia del instalador es superficial; ampliar su historial falló por resolución DNS. Se acepta el origen indicado por Manu, pero no se reconstruyó la genealogía completa de commits. No se ejecutaron instaladores, servicios ni automatizaciones. Los transcripts de ejemplo no se consideran evidencia de ejecución.

## Qué aporta cada origen

| Origen | Aporte que conservar | Evolución propuesta |
|---|---|---|
| Instalador original | Entrada guiada, detección de intención, personalización, contratos de salida, recuperación y separación instalador/vault final. | Desacoplar runtime y transporte; añadir estado persistente, adopción y verificación ejecutable. |
| Vault evolucionado | Captura, proyectos, áreas, memoria temporal, conocimiento destilado, hubs de continuidad y relaciones significativas. | Convertir sus reglas estables en un contrato portable; dejar el inventario personal en el vault. |
| AIS-OS | Onboarding, entrevistas con guardado, rutas de recuperación, auditoría con evidencia e historial, mejora concreta por ciclo. | Adaptar métricas al propósito y hacer opcional la ejecución recurrente. |
| Agent-Guided Installer Framework existente | Blueprint, adaptadores de runtime/backend, capacidades, verificación y handoff. | Reutilizar sus contratos mínimos para este caso; validar su implementación antes de asumir que está disponible. |

Las Three Ms y Four Cs siguen siendo un marco útil de operación atribuido a Nate Herk. Para este sistema, Context se apoya en memoria y recuperación; Connections en fuentes y adaptadores; Capabilities en workflows; Cadence en ejecución recurrente comprobada. La cadencia se incorpora cuando el workflow manual ya funciona y el usuario necesita recurrencia.

## Hallazgos prioritarios

### 1. Los entornos reciben reglas diferentes en el vault actual

AGENTS.md (referencia histórica no incluida) declara actualización de agosto; CLAUDE.md (referencia histórica no incluida) conserva abril. Existen diferencias sustantivas: estado de apex-agent, excepciones de fechas en nombres y alcance del sistema. La captura en `.agents/skills/second-brain-capture/` incorpora Activation Map; la copia en `.claude/skills/second-brain-capture/` no. El inventario local contiene cuatro skills en `.agents/skills` y una en `.claude/skills`.

Esto demuestra divergencia documental; no prueba que una sesión concreta de Claude haya fallado. No se inspeccionaron instalaciones globales de skills.

**Cambio propuesto:** una fuente mantenida para las políticas y otra para cada skill, con entradas específicas por entorno generadas y comprobadas. Las diferencias intencionales de herramientas deben declararse. La igualdad de archivos no garantiza igualdad de comportamiento: también hacen falta pruebas por entorno.

### 2. El instalador acopla conocimiento, herramienta y producto

El [contrato de comandos](https://github.com/afmanu/claude-obsidian-second-brain-installer/blob/9cb05973a04b6e2b945fac591ccec8bf6f43f85c/specs/command-contracts.md) obliga a leer `.claude/vault-profile.md` y usar `obsidian-vault` MCP para notas. El perfil mezcla identidad, idioma, estructura y rutas bajo una carpeta específica de Claude.

**Cambio propuesto:** llevar la configuración compartida a `_system/`. Definir operaciones como buscar, leer, escribir y comprobar enlaces. Implementarlas inicialmente con archivos locales; habilitar MCP cuando aporte acceso o capacidades necesarios. Node y la configuración MCP serían dependencias del adaptador elegido, no requisitos universales del Second Brain.

Un runtime con escritura autorizada en Markdown puede operar sin MCP. Un chat sin acceso persistente solo puede preparar contenido o entregar un paquete a otro entorno. Ningún adaptador debe declarar instalación terminada por haber generado instrucciones.

### 3. El vault evolucionado necesita adopción

El [contrato de salida original](https://github.com/afmanu/claude-obsidian-second-brain-installer/blob/9cb05973a04b6e2b945fac591ccec8bf6f43f85c/specs/vault-output-contract.md) espera `Home.md`, `00_START_HERE.md`, `.claude/vault-profile.md` y otros archivos que este vault no utiliza. Aquí existen `_system`, hubs y convenciones propias. Su ausencia no demuestra una instalación rota.

El [esquema original](https://github.com/afmanu/claude-obsidian-second-brain-installer/blob/9cb05973a04b6e2b945fac591ccec8bf6f43f85c/specs/frontmatter-schema.md) usa `type/created`; el vault actual establece `tipo/creado`. También conviven notas heredadas. La adopción debe leer equivalencias, detectar conflictos y respetar el formato elegido para nuevas notas. Si ambos campos discrepan, debe señalar el conflicto.

**Cambio propuesto:** inventariar y mapear funciones antes de proponer archivos. No reinstalar la plantilla original sobre la evolución personal ni normalizar masivamente nombres y propiedades.

### 4. Los perfiles deben personalizar la presentación y el destino conservando el significado

La [captura original](https://github.com/afmanu/claude-obsidian-second-brain-installer/blob/9cb05973a04b6e2b945fac591ccec8bf6f43f85c/.claude/commands/second-brain-capture.md) transforma una decisión en proyecto/propuesta para consultoría, argumento para investigación o meta/aprendizaje para uso personal. Esa transformación dificulta recuperar decisiones como una categoría estable.

El [catálogo](https://github.com/afmanu/claude-obsidian-second-brain-installer/blob/9cb05973a04b6e2b945fac591ccec8bf6f43f85c/docs/skills-catalog.md) propone rutas fijas como `04_Daily` aunque algunos perfiles usan otras rutas. También equipara notas no modificadas con no visitadas, y sugiere inferir bloqueo de un proyecto desde su antigüedad. Son señales indirectas, no hechos sobre su uso o estado.

**Cambio propuesto:** tipos semánticos estables y rutas lógicas configurables, por ejemplo `routes.logs` o `routes.projects`. Los perfiles pueden combinarse mediante ejemplos, plantillas y módulos. La puntuación heurística de conexiones debe presentarse como ordenación, sin aparentar una probabilidad calibrada. Las revisiones temporales y las fuentes capturadas se destilan selectivamente antes de convertirse en conocimiento permanente.

### 5. Los contratos documentales necesitan evidencia ejecutable

La [máquina de estados](https://github.com/afmanu/claude-obsidian-second-brain-installer/blob/9cb05973a04b6e2b945fac591ccec8bf6f43f85c/specs/setup-state-machine.md) documenta 26 estados, pero el snapshot no contiene motor de instalación, suite de pruebas, CI ni archivo de estado persistente implementados. Sí contiene instrucciones que un asistente puede ejecutar. Verificar que MCP lista la raíz no demuestra escritura, clasificación correcta ni continuidad.

El contrato contempla reemplazar archivos generados sin cambios, pero no ofrece un manifiesto instalado con versión y huellas que permita distinguirlos de archivos personalizados de forma reproducible.

**Cambio propuesto:** registrar versión, pasos completados y comprobados, archivos gestionados y sus huellas; volver a validar dependencias al reanudar. Producir un plan de cambios y preservar personalizaciones. Una actualización repetida debe ser idempotente. La recuperación revierte los cambios propios sin deshacer ediciones posteriores del usuario. Comprobar la versión leída antes de escribir reduce sobrescrituras entre agentes.

### 6. La evaluación debe medir el propósito elegido

[AIS-OS audit](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/audit/SKILL.md) aporta pruebas de recuperación y evidencia operativa; su historial distingue hallazgos nuevos, abiertos, resueltos o no revisados. Esta disciplina es transferible.

Su [rúbrica](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/audit/rubric.md) limita la puntuación sin cadencia automática demostrada. Para un Second Brain manual, esa ausencia puede ser deliberada. Conviene evaluar por separado integridad/recuperación, continuidad y workflows; la recurrencia aplica solo a los módulos activados. Cada cierre de hallazgo exige evidencia nueva.

## Arquitectura propuesta

Desarrollo posterior: [Arquitectura base de Second Brain y AI OS](architecture-v0.2.md) detalla los principios y contratos de construcción solicitados por Manu. Esta revisión conserva los hallazgos que justifican la propuesta.

### Un núcleo, dos ciclos de uso

El núcleo conserva propósito, preferencias confirmadas, reglas, rutas, conocimiento reutilizable, decisiones y procedencia. Se distinguen el estado actual y el historial que lo explica, siguiendo Compiled Truth + Timeline (referencia histórica del vault; no necesaria para implementar).

**Second Brain:** capturar → contextualizar → aplicar → destilar → conectar → revisar. El flujo admite entradas directas cuando la clasificación está clara; no obliga a crear una nota en cada paso.

**AI OS:** recibir objetivo → recuperar contexto → ejecutar workflow → validar entregable → actualizar estado y aprendizaje → repetir si corresponde.

Ambos ciclos usan las mismas decisiones, proyectos y preferencias. Los resultados operativos pueden alimentar memoria, con promoción selectiva y evidencia; no todo output ni toda hipótesis se convierte automáticamente en regla permanente. La recurrencia requiere un scheduler real, acceso a sus fuentes y evidencia de ejecuciones.

### Distribución pública y sistema instalado

Estructura orientativa del repositorio de distribución:

```text
README.md             entrada: qué resuelve y primer resultado
core/                 contratos compartidos, esquema y rutas lógicas
skills/               fuentes canónicas de los workflows
modules/              definición de second-brain y ai-os, sin duplicar skills
presets/              preferencias iniciales y ejemplos combinables
adapters/             entradas y empaquetado por entorno
installer/            plan, aplicación, estado, adopción y actualización
tests/                fixtures y comprobaciones de comportamiento
docs/                 diseño, uso, compatibilidad y contribución
```

La estructura del vault instalado mantiene sus capas de conocimiento. En este caso se conservarían `00_Inbox` a `06_Archive`, `_system` y `_templates`. Los componentes del instalador no necesitan copiarse íntegros dentro del vault. El repositorio público distribuye contratos, ejemplos sintéticos y herramientas; los datos personales pertenecen a cada instalación.

Propuesta de fuentes comunes instaladas: `_system/system-contract.md` para reglas, `_system/vault-config.yaml` para rutas/módulos/esquema, y un manifiesto de instalación para archivos gestionados y versión. Estos nombres son una propuesta; al adoptar deben reutilizarse fuentes equivalentes y evitar otra copia de la misma verdad. Los manuales de entrada resumen lo necesario y remiten a dichas fuentes; inventarios cambiantes viven en sus hubs.

### Portabilidad por capacidades

| Capacidad comprobada | Comportamiento posible |
|---|---|
| Lectura y escritura autorizadas del vault | Captura, recuperación, enlaces y continuidad mediante archivos. |
| Lectura sin escritura | Análisis y propuesta de cambios. |
| Ejecución de comandos | Instalación de dependencias necesarias y validadores, según permisos. |
| Conector/MCP disponible en la sesión consumidora | Operación sobre la fuente que realmente expone. |
| Scheduler y fuentes disponibles durante la ejecución | Workflows recurrentes con trazas verificables. |
| Sin acceso persistente | Preparación de contenido y handoff explícito. |

Codex descubre skills mediante `.agents/skills`; Claude Code documenta `.claude/skills` y mantiene compatibilidad con `.claude/commands`. Cowork ofrece distribución mediante plugins. Por tanto, una fuente común puede necesitar distintos paquetes y puntos de entrada. Copiar carpetas no demuestra que el entorno las cargue.

La documentación actual de Cowork contempla sesiones entre web, escritorio y móvil, con condiciones específicas para acceder a archivos locales a través del escritorio. El instalador de mayo debe reemplazar su clasificación estática por detección de acceso real. La compatibilidad se declara por versión, superficie y capacidad probada; no como promesa genérica de equivalencia entre todos los productos.

Fuentes oficiales: [Skills de Codex](https://learn.chatgpt.com/docs/build-skills), [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Skills de Claude Code](https://code.claude.com/docs/en/skills), [Plugins de Cowork](https://claude.com/docs/cowork/guide/plugins), [Cowork entre superficies](https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile).

## Secuencia de implementación propuesta

1. **Consolidar el contrato actual.** Comparar los dos manuales, acordar qué reglas son actuales, separar políticas de inventarios y generar entradas equivalentes. Conservar el historial; no ejecutar aún una migración masiva.
2. **Empaquetar una versión mínima.** Markdown local, núcleo Second Brain, captura, recuperación y continuidad. Reutilizar el Agent-Guided Installer Framework (referencia histórica del vault; no necesaria para implementar); su diseño documentado debe contrastarse con el código antes de incorporarlo.
3. **Probar crear y adoptar.** Usar fixtures nuevos y una copia de prueba del vault con datos sintéticos o mínimos. Simular interrupción, reanudación, actualización y personalización.
4. **Validar dos runtimes locales.** Ejecutar los mismos casos en Codex y Claude Code; después empaquetar y probar Cowork con sus capacidades reales. Mantener los entornos no probados como pendientes.
5. **Añadir un workflow operativo útil.** Por ejemplo, retomar un proyecto y producir un brief con fuentes. Auditarlo, corregir un fallo y repetir. Añadir conexiones externas y cadencia cuando ese caso las requiera.

Esta secuencia coincide con la decisión ya documentada de parar expansión conceptual y pasar a packaging (referencia histórica del vault; no necesaria para implementar).

## Criterios de aceptación

- Una sesión nueva encuentra propósito, reglas y siguiente paso sin reconstrucción manual extensa.
- Capturar una decisión conserva su significado, origen y proyecto, independientemente del perfil.
- Resolver una referencia no duplica notas y deja un enlace válido cuando existe una relación útil.
- Una nota heredada sigue siendo recuperable sin renombrarla ni reescribirla masivamente.
- Adoptar este vault reconoce sus equivalencias y no impone archivos del contrato antiguo.
- Repetir instalación/actualización no duplica contenido ni pisa personalizaciones.
- Interrumpir y retomar comprueba requisitos y continúa desde evidencia persistida.
- Otro runtime recupera el mismo estado y respeta el mismo contrato; se documentan límites distintos de herramientas.
- Un workflow produce un artefacto comprobable y guarda solo el aprendizaje relevante.
- La auditoría puede detectar un defecto conocido, verificar su reparación y conservar el historial. La cadencia se prueba únicamente si está activada.

## Activation Map

- **Regiones activadas:** AutoBrain y Second Brain (alta); diseño de agentes e instaladores (alta); evaluación operativa (media). No se incorporan datos personales de otras áreas.
- **Notas reutilizadas:** Knowledge Flow (referencia histórica del vault; no necesaria para implementar), Project States (referencia histórica del vault; no necesaria para implementar), Neural Vault Protocol (referencia histórica del vault; no necesaria para implementar), Compiled Truth + Timeline y Agent-Guided Installer Framework.
- **Nueva nota:** esta investigación aplicada al proyecto existente. No se crea otro framework ni proyecto.
- **Conexiones aplicadas:** esta revisión actualiza el contexto de AutoBrain y alimenta [la síntesis arquitectónica anterior](memory-and-control-analysis.md).
- **Conexiones propuestas:** reutilizar contratos del framework instalador y evaluación de AIS-OS. No implica dependencia de código instalada ni adopción de todas sus políticas.
- **Riesgos de interpretación:** origen declarado frente a historia Git no reconstruida; diseño frente a implementación; paridad estática frente a comportamiento; actualización del sistema frente a normalización de contenido.


[Volver a la entrada del proyecto](../README.md)
