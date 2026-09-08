# Desarrollo y uso de la base M0

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
```

Después de cambiar código, `npm run build` recompila. `npm test` compila y ejecuta pruebas del validador, CLI y la prueba de SQLite. `npm run check` añade la comprobación documental. `npm run typecheck` comprueba tipos sin generar archivos.

`doctor` crea una base temporal, prueba escritura condicional entre dos conexiones, rechazo de una revisión obsoleta, rollback y persistencia al reabrir, y elimina los datos de prueba. Devuelve JSON y código 0 cuando todas esas comprobaciones pasan. Muestra la ubicación prevista de datos sin crearla. **No verifica todavía un backend completo, permisos de agentes ni una instancia.**

`validate-record` comprueba exclusivamente los metadatos de [RecordEnvelope](../schemas/record-envelope.schema.json): identidad, instancia, revisión opaca, versión del contrato y fechas UTC válidas. Rechaza campos adicionales y una actualización anterior a la creación. No convierte metadatos válidos en una entidad autorizada ni valida los ejemplos de instancia/reunión. Código 0: válido; código 2: argumentos o datos inválidos; código 1: fallo del diagnóstico o del entorno.

## Ubicación de los datos

La configuración del adaptador local resuelve una ubicación fuera de la distribución:

| Plataforma | Ubicación predeterminada |
|---|---|
| macOS | `~/Library/Application Support/manu-control-center` |
| Linux | `$XDG_DATA_HOME/manu-control-center` si XDG es absoluto; si no, `~/.local/share/manu-control-center` |
| Windows | `%LOCALAPPDATA%/manu-control-center`, con fallback al directorio local del usuario |

`MANU_CONTROL_CENTER_DATA_DIR` permite indicar otra ruta absoluta. M0 solo resuelve y muestra la configuración; M2 creará las instancias. Cada instancia tendrá su identidad y límites de acceso, por implementar en M1–M3. Secretos, bases de datos y ejecuciones reales quedan fuera del paquete y del repositorio.

El primer estado operativo tendrá un host responsable. El código puede residir en una carpeta sincronizada; la sincronización del archivo SQLite no se utiliza como coordinación entre máquinas. Los traslados se implementarán con exportación/importación y transferencia de autoridad en M4.

## Instalación limpia y empaquetado

```bash
npm run smoke:install
npm pack
```

La prueba limpia necesita haber ejecutado primero `npm ci` con la misma caché de npm. Copia las fuentes a una carpeta temporal, instala con el lockfile en modo offline, compila y repite los tests. Luego empaqueta e instala el archivo en otra carpeta **con una caché de consumidor vacía y acceso al registro npm**, comprueba versión, diagnóstico, validación y el comando instalado. Limpia las carpetas y la caché temporal al terminar. Puede pasarse `--cache /ruta/a/cache` a npm para la instalación de fuentes cuando el entorno lo requiera.

La instalación del paquete necesita resolver sus dependencias como un consumidor nuevo. Una caché creada por `npm ci` puede contener los archivos de dependencias sin sus metadatos de registro; por eso esta segunda comprobación no presupone que sea posible instalar el paquete offline.

`npm pack` genera un paquete local; no lo publica. El paquete mantiene `private: true`. Las instrucciones de instalación del sistema completo llegarán en M2–M3; estos comandos instalan únicamente la base de desarrollo M0.

## Documentación y evidencia

Después de una modificación documental revisada:

```bash
npm run manifest:docs
npm run check:docs
```

El manifiesto raíz inventaría documentación y esquemas, no todo el código. Los manifiestos anteriores de `references/` son históricos y conservan sus huellas originales. La comprobación valida JSON, enlaces locales a archivos, bloques de código y cobertura de componentes/escenarios/fases; no consulta enlaces externos ni comprueba anclas de secciones.

La configuración de [GitHub Actions](../.github/workflows/ci.yml) ejecuta las mismas comprobaciones y la instalación limpia. La evidencia local se registra en [m0-verification.json](m0-verification.json); el estado real de cada fase se mantiene en [handoff.md](handoff.md).

## Límites técnicos de M0

En Node 24.14.1, `node:sqlite` emite un aviso experimental. Su uso queda aislado en una prueba desechable del adaptador. La selección del motor SQLite está adoptada para el piloto; la API concreta puede sustituirse en M1 si sus garantías o estabilidad resultan insuficientes. El diagnóstico no silencia ese aviso.

Codex se selecciona como primer candidato y Claude Code como segundo por disponibilidad observada de sus ejecutables. No se han invocado modelos, verificado sesiones ni implementado adaptadores del producto. Las rutas predeterminadas de otras plataformas no acreditan una instalación probada allí; la evidencia enumera únicamente los entornos ejecutados.

[Entrada](../README.md)
