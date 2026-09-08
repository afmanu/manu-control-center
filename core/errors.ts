export type ErrorCode = 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN' | 'AUTH_REQUIRED' | 'CAPABILITY_UNAVAILABLE' | 'INCOMPATIBLE_VERSION' | 'STALE_PLAN' | 'VALIDATION_FAILED' | 'RATE_LIMITED' | 'TIMEOUT' | 'EFFECT_UNKNOWN' | 'BUDGET_EXCEEDED' | 'CANCELLED';
export class DomainError extends Error {
  constructor(readonly code: ErrorCode, message: string, readonly details: Record<string, unknown> = {}, readonly retryable = false) { super(message); this.name = 'DomainError'; }
  toJSON(): object { return { code: this.code, message: this.message, retryable: this.retryable, details: this.details, evidence_refs: [] }; }
}
