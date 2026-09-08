import { DomainError } from './errors.js';

/** Millisecond UTC instants give exact ordering across the CLI, core and SQLite. */
export function assertInstant(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) throw new DomainError('INVALID_INPUT', `${field} must be a UTC timestamp with milliseconds (YYYY-MM-DDTHH:mm:ss.sssZ).`);
}
export function assertAsOf(value: unknown, now: string): asserts value is string {
  assertInstant(value, 'as_of'); assertInstant(now, 'clock');
  if (Date.parse(value) > Date.parse(now)) throw new DomainError('INVALID_INPUT', 'Historical queries cannot assert future recorded state.');
}
