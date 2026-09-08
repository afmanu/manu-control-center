# Handoff de desarrollo

Actualizado: 2026-09-08. Repositorio principal: [afmanu/manu-control-center](https://github.com/afmanu/manu-control-center). **M0–M2 completados; siguiente fase: M3.**

## Instrucción vigente

Manu pide construir el sistema para usarlo y ha elegido este repositorio como destino. El trabajo verificado y su entrega en GitHub están autorizados. Se conservan el historial inicial y MIT; las carpetas documentales anteriores son snapshots, sin sincronización automática con este repositorio ni con el vault original. No se necesita otra entrevista de descubrimiento.

M3 entrega el primer uso con agente; M4 demuestra otra representación y otro runtime; M5 añade mantenimiento. Las integraciones imprescindibles de M6 pueden incorporarse desde M3.

## Estado ejecutable

Paquete privado `manu-control-center@0.1.0-dev.2`, TypeScript/Node 24, dependencias exactas y lockfile. M2 no añade dependencias. Se mantienen los 22 contratos M1, backend SQLite con acceso/revisiones/historial y harness A27.

M2 añade catálogo `project-knowledge-foundation@0.1.0-draft`, dos módulos, solicitud validada, resolver y plan reproducible. El adaptador comprueba el backend real en bases desechables, inspecciona el destino sin escribir y aplica operaciones con checkpoints atómicos. La adopción reutiliza proyectos de MCC SQLite fijando revisión y ownership, preservando su contenido e historial.

CLI operativa: `resolve`, `plan`, `inspect`, `apply`, `verify`, `create`, `adopt`, `resume`, además de los comandos M0–M1. Biblioteca: exports `./builder` y `./local`. La [guía de instalación](installation.md) contiene argumentos, ejemplo, recuperación y límites; [desarrollo](development.md) describe empaquetado y esquemas.

Cada instancia guarda configuración y catálogo, conocimiento, estado de construcción e informes de verificación en tablas separadas de `store.sqlite`. Un recurso y su checkpoint comparten transacción. Se registran las autorizaciones de construcción utilizadas. Los informes son recuperables y se comprueba su hash al leerlos. `verified` se limita al perfil `foundation`; `runtime.invoke` sigue `not_run`.

## Instancia base de Manu

Se ha preparado fuera del repositorio, sin sustituir archivos preexistentes:

- Identidad y propietario local: `manu`; proyecto inicial: `manu-control-center`.
- Directorio: `~/Library/Application Support/manu-control-center/instances/manu`.
- Solicitud: `~/Library/Application Support/manu-control-center/configuration/manu.json`.
- Plan original: `~/Library/Application Support/manu-control-center/configuration/manu-installation-plan.json`.
- Estado: `verified` para configuración, catálogo, proyecto y almacenamiento; integración de agente pendiente.

Solo incluye el propósito inicial de construir este sistema. No se han importado fuentes personales ni invocado modelos. M3 debe completar esta base conservando su identidad y datos; no reinstalar encima ni asumir que editar la solicitud aplica un cambio. La identidad local es una configuración inicial del host, no autenticación de una cuenta.

## Evidencia

92 tests aprobados, incluidos dos instaladores concurrentes, planes obsoletos, adopción, salida real del proceso dentro de una transacción y después de un checkpoint, recuperación por CLI y aislamiento. La prueba limpia repite los 92 tests e instala el paquete con caché de consumidor vacía; crea y verifica una instancia desde el paquete instalado y comprueba sus exports.

A01, A02, A16 y A17 pasan para el destino local soportado. A15/A19 pasan para el perfil de instalación; requieren ampliación al integrar runtimes y otros backends. A27 sigue pasando como frontera de API del harness. Los demás recorridos del sistema permanecen pendientes.

[Evidencia M2](m2-verification.json), [M1 histórica](m1-verification.json), [M0 histórica](m0-verification.json) y [GitHub Actions](https://github.com/afmanu/manu-control-center/actions). Las huellas de evidencia se vinculan al código de la entrega; el resultado remoto identifica el commit exacto sin un hash circular dentro de ese commit.

## Fronteras que debe conservar M3

- El host autentica y fija `AccessScope`, `can_authorize` y autoridad de construcción. Estos argumentos nunca proceden de una fuente ni de una respuesta LLM. La CLI es un host local confiable, sin autenticación remota.
- Los recibos de acciones M1 son referencias estructuradas; M3 debe mediar la invocación y probar el resultado del destino. El constructor M2 no implementa esa coordinación de workflows.
- SQLite usa rollback journal. Planificación/inspección rechazan WAL o un journal pendiente antes de intentar recuperación. Solo una aplicación/reanudación autorizada recupera transacciones sobre un almacén MCC identificado. Una inicialización del formato de base incompleta requiere reparación explícita, sin reemplazar archivos desconocidos.
- No hay fencing distribuido, scheduler, exportación ni otro backend/runtime. El guard de monotonía M1 no es un lease efectivo. El harness A27 no es un sandbox ni una eval semántica de un modelo.
- La adopción M2 se limita a proyectos ya representados en MCC SQLite. No anuncia importación de un vault o carpeta arbitraria.
- Replanificar no cambia ownership ni sobrescribe configuraciones gestionadas distintas. M3 debe definir expresamente cualquier evolución de la base necesaria para activar capacidades; M5 ampliará el mantenimiento general.
- `node:sqlite` emite un aviso experimental en Node 24.14.1. Las rutas de otras plataformas no prueban compatibilidad: evidencia local macOS; CI registra sus propias ejecuciones.

D20–D23 documentan estas decisiones y el despliegue inicial en [decisions.md](decisions.md).

## Próximo trabajo: M3

1. M3.1: captura de texto/archivos locales, fuentes y revisiones, consultas con permisos y procedencia.
2. M3.2: autoridad de decisiones, consultas actuales/históricas y preservación de artefactos aprobados.
3. M3.3–M3.4: reunión → brief y resumen de proyecto, coordinador durable, checkpoints, cancelación, presupuestos y control de efectos.
4. M3.5–M3.7: adaptador real del runtime, continuidad desde otra sesión y puesta en uso de la instancia base de Manu.
5. Comprobar los escenarios M3 del [roadmap](implementation-plan.md), ampliando A15/A19/A27 al destino realmente invocado.

Al cerrar una sesión, registrar fase, comandos reales, resultados y límites; actualizar handoff, decisiones y evidencia, y regenerar el inventario documental. Mantener conocimiento del usuario y estado de instancia fuera de la distribución.

[Entrada](../README.md)
