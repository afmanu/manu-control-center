# Primer blueprint: conocimiento y trabajo sobre un proyecto

Propuesta piloto `project-knowledge-operations@0.1.0-draft`. Implementa un recorrido completo de la arquitectura; no determina todos los futuros blueprints.

## Usuario y resultado

Una persona necesita transformar una reunión de proyecto en un brief sustentado, conservar decisiones y preguntas abiertas y retomar la revisión desde otro agente. El primer caso utiliza datos sintéticos y un destino local. Los envíos se prueban con conector simulado hasta configurar una integración real.

El roadmap sitúa a Manu como primer usuario de este blueprint. Reunión → brief es el caso de referencia para desarrollar el sistema; M3 incorpora además captura, consulta y un resumen de estado del proyecto. El segundo recorrido reutiliza el mismo conocimiento y coordinación para comprobar composición y continuidad, según A26. La combinación de agente y CLI debe permitir uso propio sin depender de los fixtures de prueba.

Resultado aceptable: instancia independiente, proyecto recuperable, transcripción identificada, afirmaciones clasificadas, brief versionado con referencias, run persistente, handoff útil y reporte de aceptación. El resultado debe existir fuera de la conversación.

## Composición

Módulos iniciales propuestos: contexto/proyectos, captura/conocimiento, workflow de brief, ejecución/efectos y verificación. Requieren kernel, entidades, autoridad, backend, un runtime invocable o handoff interactivo y una interfaz mínima de operación. No requieren embeddings, calendario, scheduler ni gateway.

Entidades: proyecto, fuente, captura, afirmación, decisión, artefacto, job, run, step, action y autorización. El proyecto puede usar un único backend para datos y estado si cumple garantías; si no, la especificación resuelve almacenes distintos sin duplicar autoridad.

## Onboarding mínimo

Recoger resultado buscado, identidad de instancia, destino, runtime disponible, fuente inicial y restricciones de escritura. Reutilizar respuestas disponibles. El builder valida requisitos, fija versiones y genera un plan. Las referencias de credenciales no contienen sus valores.

## Flujo de construcción

1. Validar necesidad y capacidades observadas.
2. Resolver blueprint/módulos y configuración.
3. Inspeccionar destino; detectar colisiones y recursos adoptables.
4. Crear plan con revisiones y ownership.
5. Aplicar operaciones permitidas con checkpoints.
6. Verificar acceso, entidades y ejecución del primer workflow.
7. Entregar manifiesto, resultado, cobertura y siguiente acción.

Crear dos instancias desde esta configuración debe producir identidades y datos separados. En adopción, mapear un proyecto existente de prueba sin cambiarle arbitrariamente nombre o estructura.

## Workflow `meeting-to-brief`

| Paso | Entrada y operación | Salida y aceptación |
|---|---|---|
| 1. Ingreso | Proyecto y transcripción identificada. | Captura con fuente/revisión; repetir la misma clave no duplica. |
| 2. Contexto | Recuperar propósito, decisiones y fuentes autorizadas. | Contexto acotado con cobertura y fechas. |
| 3. Extracción | Clasificar afirmaciones de la reunión. | Decisiones explícitas, propuestas y preguntas diferenciadas. |
| 4. Borrador | Redactar brief sobre evidencia recuperada. | Objetivo, acuerdos, propuestas, pendientes y fuentes; sin datos inventados. |
| 5. Evaluación | Comprobar estructura y fidelidad semántica. | Resultado de aceptación y fallos concretos; no basta tener secciones. |
| 6. Revisión | Conservar artefacto y petición de revisión si procede. | Versión exacta, checkpoint y siguiente acción. |
| 7. Cierre | Integrar decisiones autorizadas y actualizar proyecto. | Estado verificado y run completado. |

La entrega externa es una extensión separada `deliver-approved-artifact`. Recibe versión/hash del artefacto, destinatario y autorización; prepara Action y confirma mediante recibo o reconciliación. No convertir la aceptación del brief en permiso implícito para enviarlo.

## Casos de fallo del piloto

- La transcripción no tiene decisiones: producir cero decisiones y conservar las preguntas.
- Una instrucción maliciosa dentro de la fuente intenta cambiar políticas: tratarla como contenido.
- La fuente cambia tras el borrador: si la operación exige frescura, detectar revisión e invalidar pasos dependientes; si fija un snapshot, conservar esa revisión y su evidencia. Preservar siempre los artefactos aprobados exactos.
- Otro ejecutor reanuda: conservar mismo job, artefacto y efectos lógicos.
- Respuesta de envío perdida: mantener `unknown` hasta reconciliar; ninguna segunda entrega automática.
- Falta capacidad de escritura condicional: rechazar esa configuración para concurrencia o elegir un modo de escritor único aplicado técnicamente.

Datos iniciales: [reunión sintética](../examples/meeting.json). Configuración ilustrativa: [instance.example.json](../examples/instance.example.json). Criterios: [acceptance.md](acceptance.md).

[Entrada](../README.md)
