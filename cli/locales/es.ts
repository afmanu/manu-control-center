export const help = (version: string) => `Manu Control Center ${version}

Uso:
  manu-control-center [--lang en|es] <comando>
  manu-control-center --help
  manu-control-center --version
  manu-control-center doctor
  manu-control-center validate-record <archivo.json>
  manu-control-center contracts
  manu-control-center validate <tipo> <archivo.json>
  manu-control-center validate-bundle <archivo.json>
  manu-control-center resolve <solicitud.json> <directorio-absoluto>
  manu-control-center plan <solicitud.json> <directorio-absoluto>
  manu-control-center inspect <solicitud.json> <directorio-absoluto>
  manu-control-center apply <plan.json> --actor <id>
  manu-control-center verify <solicitud.json> <directorio-absoluto>
  manu-control-center create <solicitud.json> <directorio-absoluto> --actor <id>
  manu-control-center adopt <solicitud.json> <directorio-absoluto> --actor <id>
  manu-control-center resume <solicitud.json> <directorio-absoluto> --actor <id>
  manu-control-center capture <solicitud.json> <directorio-absoluto> <source-id> --actor <id> --key <key> (--file <path> | --text <texto>) [--expected-revision <revision>]
  manu-control-center source <solicitud.json> <directorio-absoluto> <source-id> --actor <id> [--revision <revision> | --as-of <timestamp>]
  manu-control-center source-history <solicitud.json> <directorio-absoluto> <source-id> --actor <id> [--limit <n>] [--after-revision <revision>]
  manu-control-center search <solicitud.json> <directorio-absoluto> <texto> --actor <id> [--limit <n>] [--after <source-id>] [--valid-at <timestamp>] [--as-of <timestamp>]
  manu-control-center context <solicitud.json> <directorio-absoluto> --actor <id> [--limit <n>] [--after <source-id>] [--valid-at <timestamp>] [--as-of <timestamp>]
  manu-control-center claim <solicitud.json> <directorio-absoluto> <operacion.json> --actor <id>
  manu-control-center decision-propose <solicitud.json> <directorio-absoluto> <operacion.json> --actor <id>
  manu-control-center decision-grant <solicitud.json> <directorio-absoluto> <operacion.json> --actor <id>
  manu-control-center decision-revoke-grant <solicitud.json> <directorio-absoluto> <operacion.json> --actor <id>
  manu-control-center decision-set <solicitud.json> <directorio-absoluto> <operacion.json> --actor <id>
  manu-control-center artifact-draft <solicitud.json> <directorio-absoluto> <operacion.json> --actor <id>
  manu-control-center artifact-approve <solicitud.json> <directorio-absoluto> <operacion.json> --actor <id>
  manu-control-center artifact-fork <solicitud.json> <directorio-absoluto> <operacion.json> --actor <id>
  manu-control-center sources-check <solicitud.json> <directorio-absoluto> <operacion.json> --actor <id>
  manu-control-center knowledge <solicitud.json> <directorio-absoluto> <claim|decision|artifact> --actor <id> [--as-of <timestamp>] [--text <text>] [--limit <n>] [--after <id>] [--valid-at <timestamp>]
Síntesis con agente: añade runtime {id: "codex", version: "0.146.0-mcc.1"} al flujo de conocimiento. Consulta docs/codex-runtime.md.
  manu-control-center coordinator-<submit|claim|renew|pause|advance|review|revise|authorize|cancel|reconcile|retry> <request.json> <absolute-directory> <operation.json> --actor <id>
  manu-control-center coordinator-read <request.json> <absolute-directory> <run-id> --actor <id>
  manu-control-center workflow-prepare <request.json> <absolute-directory> <operation.json> --actor <id>
  manu-control-center workflow-read <request.json> <absolute-directory> <run-id> --actor <id>
  manu-control-center workflow-complete <request.json> <absolute-directory> <review.json> --actor <id>
  manu-control-center knowledge-record <solicitud.json> <directorio-absoluto> <id> --actor <id> --kind <claim|decision|artifact> [--revision <revision> | --as-of <timestamp>]

doctor comprueba SQLite con datos temporales y muestra la ubicación prevista de datos.
validate-record valida únicamente metadatos RecordEnvelope (0.1.0-draft).
El constructor local está disponible. Planificar no escribe en el destino.
La captura local UTF-8 y las consultas con procedencia están disponibles. La invocación de agentes está pendiente en M3.5.
Los comandos de revisión registran decisiones explícitas del propietario; las fuentes no conceden aprobación.
Opciones temporales: --as-of <fecha-UTC> consulta el historial registrado; --valid-at filtra la vigencia explícita de afirmaciones o la disponibilidad declarada de fuentes.
Los workflows locales de reunión a brief y estado de proyecto están disponibles con revisión humana. La invocación real del runtime sigue pendiente.
El coordinador guarda pasos, concesiones y pruebas de efectos. La entrega solo usa el simulador; --simulate confirm|lose_response|no_effect|unavailable se aplica a advance/reconcile.
Idioma: --lang en|es o MANU_CONTROL_CENTER_LANG (predeterminado: en).
El idioma afecta a la ayuda y al resumen de errores; claves JSON, diagnósticos y datos se conservan.
`;
export const invalidArguments = 'Argumentos no válidos. Ejecuta manu-control-center --help.';
export const errors: Record<string, string> = {
  INVALID_INPUT: 'Los argumentos o datos de entrada no son válidos.',
  NOT_FOUND: 'No se ha encontrado el recurso solicitado.',
  CONFLICT: 'La operación entra en conflicto con el estado actual.',
  FORBIDDEN: 'La operación no está autorizada en este alcance.',
  AUTH_REQUIRED: 'Se requiere autorización para continuar.',
  CAPABILITY_UNAVAILABLE: 'Una capacidad necesaria no está disponible.',
  INCOMPATIBLE_VERSION: 'La versión no es compatible.',
  STALE_PLAN: 'El estado ha cambiado desde que se generó el plan.',
  VALIDATION_FAILED: 'La validación ha fallado.',
  RATE_LIMITED: 'Se ha alcanzado el límite de solicitudes.',
  TIMEOUT: 'Se ha agotado el tiempo de espera.',
  EFFECT_UNKNOWN: 'No se ha podido determinar el resultado de la acción.',
  BUDGET_EXCEEDED: 'Se ha superado el presupuesto de ejecución.',
  CANCELLED: 'La operación se ha cancelado.',
  CHECK_FAILED: 'La comprobación o el entorno han fallado.',
};
