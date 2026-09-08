# Crear, inspeccionar y adoptar una instancia

M2 entrega el perfil `foundation` del blueprint `project-knowledge-foundation@0.1.0-draft`: configuración resuelta, catálogo de módulos y un proyecto persistente con manifiesto y evidencia. `verified` acredita este perfil de instalación. El runtime permanece `not_verified` y los workflows se incorporarán en M3.

## Crear con un plan revisable

Instala dependencias y ejecuta `npm run build`. Usa una copia de [install-request.json](../examples/install-request.json) para definir identidad, propietario y propósito. `owner_id` es una identidad que debe fijar el host confiable; la CLI local no autentica cuentas remotas. `runtime` admite `unconfigured`, `codex` y `claude-code` como selección de integración futura, sin atribuirles capacidades ejecutadas.

Ejemplo macOS, con datos fuera del repositorio:

```bash
mcc_demo="$HOME/Library/Application Support/manu-control-center/instances/demo"
node dist/cli/main.js resolve examples/install-request.json "$mcc_demo"
node dist/cli/main.js plan examples/install-request.json "$mcc_demo" > /tmp/mcc-demo-plan.json
node dist/cli/main.js apply /tmp/mcc-demo-plan.json --actor local-user
node dist/cli/main.js verify examples/install-request.json "$mcc_demo"
node dist/cli/main.js inspect examples/install-request.json "$mcc_demo"
```

Usa `node dist/cli/main.js` o el binario instalado para redirigir JSON a un fichero: `npm start` añade cabeceras de npm a stdout. El plan debe guardarse fuera del directorio que se va a crear. `resolve`, `plan` e `inspect` no escriben en el destino; la comprobación del motor utiliza bases temporales desechables.

`apply` autoriza explícitamente las operaciones del plan para el actor indicado y deja `installed_unverified`. `verify` registra un informe nuevo y pasa a `verified` si se cumplen las comprobaciones requeridas. `inspect` recupera proyecto, estado y evidencia sin modificar la base. Una capacidad configurada pero sin invocación probada continúa `not_run` en el manifiesto.

Para resolver, aplicar y verificar en una sola invocación explícita:

```bash
node dist/cli/main.js create examples/install-request.json "$mcc_demo" --actor local-user
```

La carpeta de instancia contiene `store.sqlite`. Se crean con propiedad `managed` la configuración, el catálogo de dos módulos y el proyecto inicial. La configuración deseada y el plan utilizados también quedan registrados en el estado de construcción. Identidades y revisiones son independientes de la ruta y del propósito visible.

## Instancia base de Manu

En esta entrega se ha creado y verificado una base local con identidad `manu` y proyecto `manu-control-center`. Solo contiene el propósito inicial de construir este sistema; no se han incorporado fuentes personales ni invocado un modelo.

- Solicitud editable: `~/Library/Application Support/manu-control-center/configuration/manu.json`.
- Plan original: `~/Library/Application Support/manu-control-center/configuration/manu-installation-plan.json`.
- Instancia: `~/Library/Application Support/manu-control-center/instances/manu`.

```bash
node dist/cli/main.js inspect   "$HOME/Library/Application Support/manu-control-center/configuration/manu.json"   "$HOME/Library/Application Support/manu-control-center/instances/manu"
```

La identidad local `manu` es una elección inicial reversible del despliegue, no una cuenta autenticada. M3 completará el perfil de uso con captura, consulta, ejecución y agente. Editar la solicitud por sí solo no modifica la instalación: una diferencia de configuración gestionada requiere su evolución explícita.

## Adoptar un proyecto existente

La adopción M2 admite proyectos del backend MCC SQLite con identidad y revisión conocidas. No importa una carpeta arbitraria, un vault, otro motor o archivos sueltos. Esos destinos requieren su adaptador de ingreso/portabilidad.

1. En la solicitud, fija `instance_id`, `owner_id` y `project.id` correspondientes al registro existente.
2. Ejecuta `inspect` sobre su directorio. Recupera la revisión exacta del proyecto dentro del alcance autorizado.
3. Sustituye `adoption: null` por una correspondencia explícita:

```json
{
  "revision": "revision-exacta-observada",
  "ownership": "user_owned"
}
```

4. Genera/revisa el plan y aplícalo, o ejecuta `adopt <solicitud.json> <directorio> --actor <id>`.

Se admite `shared` o `user_owned`. El plan reutiliza el proyecto y conserva contenido, ID, acceso, revisión e historial. No renombra, normaliza ni sobrescribe su propósito con el texto de la solicitud. Un proyecto oculto al actor, una revisión obsoleta o una colisión de tipo detiene la operación. Una nueva planificación no puede convertir un recurso adoptado en propiedad gestionada.

## Interrupción y recuperación

Cada recurso y su checkpoint se guardan en una misma transacción SQLite. Si la transacción se revierte, ambos se revierten; si ya estaba confirmada, reanudar comprueba su revisión y no crea otra copia. El estado `partial` identifica una aplicación incompleta.

```bash
node dist/cli/main.js apply /tmp/mcc-demo-plan.json --actor local-user
node dist/cli/main.js resume examples/install-request.json "$mcc_demo" --actor local-user
```

Ambos caminos conservan el plan original. `resume` requiere la misma solicitud y recupera el plan durable, útil si se utilizó `create`. Si queda un journal tras una caída durante una transacción, la invocación autorizada permite a SQLite recuperarlo antes de continuar. No se borra el journal. La inspección sin escrituras informa de ese estado; no intenta repararlo.

Un plan obsoleto no se fuerza. Si cambia un recurso antes de aplicar, genera uno nuevo después de revisar la edición. Si hay un plan parcial, conserva su solicitud y resuelve su conflicto antes de sustituirlo. M2 no sobrescribe configuraciones gestionadas distintas ni implementa migraciones de versión; la evolución se ampliará en las fases siguientes.

## Alcance técnico y errores

- El adaptador local usa SQLite en modo rollback journal, un host y una carpeta dedicada. Rechaza modo WAL y sus archivos auxiliares antes de abrir una inspección, para mantenerla sin escrituras. No convierte el modo automáticamente.
- Los grants de construcción vinculan actor, instancia, hash del plan, destino, efecto y caducidad. Proceden del host confiable y quedan registrados con los checkpoints; el hash del plan comprueba integridad, no firma ni autentica al emisor.
- El estado de construcción, los recursos, los informes de verificación y el conocimiento tienen tablas distintas en la misma base transaccional. No se crean servicios adicionales.
- La recuperación automática cubre operaciones de recursos sobre un almacén MCC inicializado. Una caída durante la creación inicial del propio formato de base, antes de tener su identidad MCC válida, se conserva para reparación explícita; no se trata un archivo desconocido como reemplazable.
- No hay runtime invocado, scheduler, exportación, fencing distribuido ni importador de otros formatos en M2. Las fuentes del usuario siguen fuera de esta entrega inicial.

Código de salida 0: operación completada; 2: argumentos/JSON inválidos; 1: conflicto, permiso, capacidad o verificación fallida. Los errores son líneas JSON con código y detalles en stderr; el aviso experimental de `node:sqlite` puede compartir ese canal. Los resultados y planes usan JSON en stdout.

Implementación: [planner](../builder/planner.ts), [adaptador local](../adapters/interfaces/local/installation.ts) y [almacén de construcción](../adapters/backends/sqlite/installation.ts). Los exports públicos son `manu-control-center/builder` y `manu-control-center/local`. La comprobación del modo de archivo sigue la [cabecera oficial de SQLite](https://www.sqlite.org/fileformat.html#the_database_header).

[Evidencia M2](m2-verification.json) · [Roadmap](implementation-plan.md) · [Entrada](../README.md)
