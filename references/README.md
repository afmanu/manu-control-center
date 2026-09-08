# Antecedentes y procedencia

Material de consulta opcional. La arquitectura actual y las decisiones del producto prevalecen sobre estas propuestas históricas. Los textos migrados mantienen el contenido conceptual, retiran metadatos del vault y convierten enlaces; los destinos históricos no incluidos se presentan como referencias de contexto, no como dependencias de implementación.

| Documento | Papel |
|---|---|
| [Análisis de memoria y control](memory-and-control-analysis.md) | Síntesis inicial del patrón del vault y comparación con AIS-OS. |
| [Revisión del instalador](installer-review.md) | Hallazgos de construcción, adopción, actualización y desacoplamiento. |
| [Arquitectura v0.2](architecture-v0.2.md) | Antecedente del alcance backend/runtime independiente. |
| [Revisión de conversación compartida](shared-conversation-review.md) | Cobertura de sesenta apartados, trece ajustes y límites. |
| [Modelo de backend](backend-model.md) | Principio de entidades antes de representación. |
| [Framework de instalación](installer-framework.md) | Arquitectura previa de instalación guiada. |

## Fuentes originales consultadas en el trabajo previo

- [Instalador original](https://github.com/afmanu/claude-obsidian-second-brain-installer), snapshot inspeccionado `9cb05973a04b6e2b945fac591ccec8bf6f43f85c`.
- [AIS-OS](https://github.com/nateherkai/AIS-OS), snapshot inspeccionado `ce9cb93a1145da5daba84ea37208ec35fd03606e`.
- [Conversación compartida](https://chatgpt.com/share/6a9fb953-4dd4-83eb-82da-79510772401c): se incluye la revisión, no la transcripción completa.

En la sesión del 2026-09-08 Manu aportó [este otro enlace de conversación](https://chatgpt.com/share/6a9fb943-0ab4-83eb-ae6d-715dcafc3e98), leído y contrastado junto con los dos repositorios. Coinciden el título y la estructura de la revisión conservada; no se certifica igualdad byte a byte entre ambos enlaces. Los snapshots de repositorio inspeccionados coinciden con los commits anteriores. Esta consulta refuerza el contexto; las instrucciones vigentes y el diseño local conservan su autoridad.

Los commits son los inspeccionados durante el análisis; no se vuelven a presentar como últimos commits. Las observaciones del código fueron estáticas y no prueban instalaciones operativas. Las afirmaciones sobre productos externos deben verificarse de nuevo en su documentación oficial al implementar cada adaptador.

El ejemplo de Three Ms y Four Cs aportado por el usuario sirvió como referencia de claridad metodológica. Las denominaciones y atribuciones pertenecen a su autor; no se adoptan como marca de este producto. Las conclusiones útiles están recogidas en los análisis. No se ha copiado código ni skills completos de los repositorios originales.

[Mapa de fuentes y transformaciones](source-map.json). No se incluye el hub antiguo completo porque mezcla estados de otro repositorio de mayo con este proyecto; su estado no acredita implementación actual. La continuidad vigente se recoge en [handoff](../docs/handoff.md).

El [manifiesto del handoff original](package-manifest-handoff-2026-09-08.json) conserva el inventario y las comprobaciones de la entrega anterior al roadmap. El [manifiesto del roadmap](package-manifest-roadmap-2026-09-08.json) conserva la siguiente entrega documental, anterior a M0. Ambos son históricos y no validan los archivos modificados después. El [manifiesto raíz](../package-manifest.json) registra documentación y esquemas vigentes; se verifica y regenera con los comandos de [desarrollo](../docs/development.md).

[Entrada](../README.md)
