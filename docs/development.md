# Desarrollo y uso de la base M0–M2

Repositorio principal: [afmanu/manu-control-center](https://github.com/afmanu/manu-control-center). La documentación del constructor se ha integrado aquí conservando el historial inicial y su licencia MIT. Las carpetas anteriores son antecedentes de la migración; los siguientes cambios se mantienen en este repositorio.

## Instalación de desarrollo

Requisitos: Node.js de la línea 24, mínimo 24.14.1; npm. La versión usada para las pruebas está fijada en `.nvmrc` y las dependencias en `package-lock.json`.

```bash
git clone https://github.com/afmanu/manu-control-center.git
cd manu-control-center
nvm use
npm ci --ignore-scripts --no-audit --no-fund
npm run check
```

`nvm use` corresponde a instalaciones con nvm. También puede utilizarse otro gestor que proporcione la versión de `.nvmrc`. La autenticación de GitHub se resuelve con las credenciales del entorno; el repositorio es privado.

## Comandos disponibles

```bash
npm start -- --help
npm start -- --version
npm start -- doctor
npm start -- validate-record examples/record-envelope.json
npm start -- contracts
npm start -- validate eval_fixture examples/meeting.json
npm start -- validate-bundle examples/contracts/construction-bundle.json
```

Después de cambiar código, `npm run build` recompila. `npm test` compila y ejecuta 92 pruebas de contratos, estados, permisos, SQLite, constructor, recuperación, CLI y harness de evaluación. `npm run check` añade la comparación del esquema generado y la comprobación documental. `npm run typecheck` comprueba tipos sin generar archivos.

`doctor` crea una base temporal, prueba escritura condicional entre dos conexiones, rechazo de una revisión obsoleta, rollback y persistencia al reabrir, y elimina los datos de prueba. Devuelve JSON y código 0 cuando todas esas comprobaciones pasan. Muestra la ubicación prevista de datos sin crearla. **No verifica todavía un backend completo, permisos de agentes ni una instancia.**

`validate-record` comprueba exclusivamente los metadatos de [RecordEnvelope](../schemas/record-envelope.schema.json): identidad, instancia, revisión opaca, versión del contrato y fechas UTC válidas. Rechaza campos adicionales y una actualización anterior a la creación. No convierte metadatos válidos en una entidad autorizada ni valida los ejemplos de instancia/reunión. Código 0: válido; código 2: argumentos o datos inválidos; código 1: fallo del diagnóstico o del entorno.

`contracts` lista los 22 contratos. `validate <kind> <file.json>` comprueba su estructura e invariantes; `validate-bundle <file.json>` comprueba coherencia entre necesidad, blueprint, módulos, especificación, plan y manifiesto. Ninguno ejecuta planes. Los resultados resumen validez y errores sin volcar el contenido ni las expectativas del fixture.

Los comandos del constructor M2 y el despliegue de Manu están en la [guía de instalación](installation.md). `resolve`, `plan` e `inspect` no escriben en el destino; `apply`, `verify`, `create`, `adopt` y `resume` realizan sus operaciones explícitas. Para producir un fichero JSON de plan utiliza el binario instalado o `node dist/cli/main.js`, sin las cabeceras de `npm start`.

## Biblioteca y esquemas

El paquete exporta el núcleo desde `manu-control-center`, el backend desde `manu-control-center/sqlite` y el harness desde `manu-control-center/evals`, el resolver desde `manu-control-center/builder` y la construcción local desde `manu-control-center/local`. Ejemplo JavaScript para un consumidor con el paquete instalado:

```js
import { SqliteBackend } from 'manu-control-center/sqlite';

const backend = new SqliteBackend(':memory:');
try {
  // El host fija esta identidad; nunca tomarla de una fuente o respuesta LLM.
  const store = backend.forScope({ instance_id: 'demo', actor_id: 'local-user' });
  const project = store.create({
    schema_version: '0.1.0-draft', kind: 'project', id: 'project-1', instance_id: 'demo',
    access: { owner_id: 'local-user', readers: [], writers: [] },
    data: { purpose: 'Proyecto sintético', status: 'active', responsible: 'local-user',
      next_action: null, decision_refs: [], source_refs: [] },
  });
  const updated = store.update({ ...project, data: { ...project.data, next_action: 'Añadir fuente' } }, project.revision);
  console.log(updated.revision, store.history(project.id).length);
} finally {
  backend.close();
}
```

Para persistencia, el constructor de SQLite recibe una ruta a una base dedicada. La API directa de SQLite requiere que exista la carpeta padre; `create`/`apply` del constructor M2 la preparan fuera de la distribución. La API de alcance exige un host confiable y no autentica usuarios por sí misma. Consulte [M1 implementado](m1-implementation.md) antes de conectar un runtime.

Las fuentes de esquemas son [schema-definitions.ts](../core/schema-definitions.ts) y [planner.ts](../builder/planner.ts), que añade la solicitud de instalación. Tras cambiarla junto con tipos y validación:

```bash
npm run schemas:write
npm test
npm run manifest:docs
npm run check
```

No editar manualmente el JSON generado: `check` detecta su divergencia. Los contratos siguen en versión draft; cambios de forma deben registrar su decisión, fixtures y pruebas afectados.

## Ubicación de los datos

La configuración del adaptador local resuelve una ubicación fuera de la distribución:

| Plataforma | Ubicación predeterminada |
|---|---|
| macOS | `~/Library/Application Support/manu-control-center` |
| Linux | `$XDG_DATA_HOME/manu-control-center` si XDG es absoluto; si no, `~/.local/share/manu-control-center` |
| Windows | `%LOCALAPPDATA%/manu-control-center`, con fallback al directorio local del usuario |

`MANU_CONTROL_CENTER_DATA_DIR` permite indicar otra ruta absoluta. `doctor` solo muestra esa configuración; los comandos de construcción reciben un directorio absoluto explícito y crean allí la instancia. La base de Manu utiliza el directorio local predeterminado. M1–M2 prueban identidad y límites de acceso. Secretos, bases de datos y ejecuciones reales quedan fuera del paquete y del repositorio.

El primer estado operativo tendrá un host responsable. El código puede residir en una carpeta sincronizada; la sincronización del archivo SQLite no se utiliza como coordinación entre máquinas. Los traslados se implementarán con exportación/importación y transferencia de autoridad en M4.

## Instalación limpia y empaquetado

```bash
npm run smoke:install
npm pack
```

La prueba limpia necesita haber ejecutado primero `npm ci` con la misma caché de npm. Copia las fuentes a una carpeta temporal, instala con el lockfile en modo offline, compila y repite los tests. Luego empaqueta e instala el archivo en otra carpeta **con una caché de consumidor vacía y acceso al registro npm**, comprueba versión, diagnóstico, validación de contratos/bundle, comando instalado e imports públicos de núcleo, SQLite, evals y constructor. También crea, verifica e inspecciona una instancia desde el paquete instalado. Limpia las carpetas y la caché temporal al terminar. Puede pasarse `--cache /ruta/a/cache` a npm para la instalación de fuentes cuando el entorno lo requiera.

La instalación del paquete necesita resolver sus dependencias como un consumidor nuevo. Una caché creada por `npm ci` puede contener los archivos de dependencias sin sus metadatos de registro; por eso esta segunda comprobación no presupone que sea posible instalar el paquete offline.

`npm pack` genera un paquete local; no lo publica. El paquete mantiene `private: true`. Las instrucciones de instalación del sistema completo llegarán en M2–M3; estos comandos instalan la base de desarrollo M0–M1.

## Documentación y evidencia

Después de una modificación documental revisada:

```bash
npm run manifest:docs
npm run check:docs
```

El manifiesto raíz inventaría documentación y esquemas, no todo el código. Los manifiestos anteriores de `references/` son históricos y conservan sus huellas originales. La comprobación valida JSON, enlaces locales a archivos, bloques de código y cobertura de componentes/escenarios/fases; no consulta enlaces externos ni comprueba anclas de secciones.

La configuración de [GitHub Actions](../.github/workflows/ci.yml) ejecuta las mismas comprobaciones y la instalación limpia. La evidencia local vigente se registra en [m2-verification.json](m2-verification.json), conservando [M0](m0-verification.json) y [M1](m1-verification.json) como históricos; el estado real de cada fase se mantiene en [handoff.md](handoff.md).

## Límites técnicos actuales

En Node 24.14.1, `node:sqlite` emite un aviso experimental. Su uso queda aislado en el adaptador de referencia y su diagnóstico desechable. El backend prueba almacenamiento local, permisos e historial; no implementa exportación ni fencing distribuido. El diagnóstico no silencia ese aviso.

Codex se selecciona como primer candidato y Claude Code como segundo por disponibilidad observada de sus ejecutables. No se han invocado modelos, verificado sesiones ni implementado adaptadores del producto. Las rutas predeterminadas de otras plataformas no acreditan una instalación probada allí; la evidencia enumera únicamente los entornos ejecutados.

[Entrada](../README.md)
