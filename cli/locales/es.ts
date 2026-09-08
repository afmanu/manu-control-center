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

doctor comprueba SQLite con datos temporales y muestra la ubicación prevista de datos.
validate-record valida únicamente metadatos RecordEnvelope (0.1.0-draft).
El constructor local está disponible. Planificar no escribe en el destino.
Agentes y workflows: M3.
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
