import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { DomainError } from '../../core/errors.js';
import { hashJson } from '../../core/hashing.js';
import type { EffectObservation, EffectRequest, EffectTarget } from '../../core/coordinator.js';
import type { JsonObject } from '../../core/models.js';

export type SimulatorMode = 'confirm' | 'lose_response' | 'no_effect' | 'unavailable';
/** A separate durable target simulator, not a second authority for coordinator state. */
export class SimulatedMailbox implements EffectTarget {
  readonly version = '0.1.0-simulator'; readonly simulated = true;
  private readonly db: DatabaseSync;
  constructor(path: string, readonly id = 'local-mailbox', private readonly mode: SimulatorMode = 'confirm', options: { readOnly?: boolean } = {}) {
    this.db = new DatabaseSync(path, { timeout: 2000, readOnly: options.readOnly ?? false });
    try {
      const app = this.db.prepare('PRAGMA application_id').get()?.['application_id'];
      const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
      if (app !== 1296253774 && (app !== 0 || tables.length)) throw new DomainError('INCOMPATIBLE_VERSION', 'Destination is not an MCC mailbox simulator.');
      if (app === 1296253774) {
        const stored = this.db.prepare("SELECT value FROM simulator_metadata WHERE key='target_id'").get()?.['value'];
        if (stored !== id) throw new DomainError('INCOMPATIBLE_VERSION', 'Simulator target identity does not match.');
      } else {
        if (options.readOnly) throw new DomainError('NOT_FOUND', 'Simulator has not been initialized.');
        this.db.exec(`BEGIN IMMEDIATE;
          CREATE TABLE simulator_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
          CREATE TABLE intents (logical_key TEXT PRIMARY KEY, destination TEXT NOT NULL, payload_hash TEXT NOT NULL) STRICT;
          CREATE TABLE deliveries (logical_key TEXT PRIMARY KEY, receipt TEXT NOT NULL) STRICT;
          CREATE TABLE sealed_attempts (logical_key TEXT NOT NULL, attempt INTEGER NOT NULL, receipt TEXT NOT NULL, PRIMARY KEY(logical_key,attempt)) STRICT;
          PRAGMA application_id=1296253774;`);
        this.db.prepare('INSERT INTO simulator_metadata VALUES (?,?)').run('target_id', id); this.db.exec('COMMIT');
      }
    } catch (error) { this.db.close(); throw error; }
  }
  close() { this.db.close(); }
  deliveryCount(): number { return Number(this.db.prepare('SELECT count(*) AS n FROM deliveries').get()?.['n']); }
  private transaction<T>(work: () => T): T { this.db.exec('BEGIN IMMEDIATE'); try { const result = work(); this.db.exec('COMMIT'); return result; } catch (error) { this.db.exec('ROLLBACK'); throw error; } }
  private intent(request: EffectRequest) {
    if (!request.destination.startsWith('simulator:') || hashJson(request.payload) !== request.payload_hash || !Number.isSafeInteger(request.attempt) || request.attempt < 1) throw new DomainError('INVALID_INPUT', 'Invalid simulated effect request.');
    const existing = this.db.prepare('SELECT destination,payload_hash FROM intents WHERE logical_key=?').get(request.logical_key);
    if (existing && (existing['destination'] !== request.destination || existing['payload_hash'] !== request.payload_hash)) throw new DomainError('CONFLICT', 'Simulator key belongs to another destination or payload.');
    if (!existing) this.db.prepare('INSERT INTO intents VALUES (?,?,?)').run(request.logical_key, request.destination, request.payload_hash);
  }
  private observed(request: EffectRequest): EffectObservation | null {
    const delivered = this.db.prepare('SELECT receipt FROM deliveries WHERE logical_key=?').get(request.logical_key);
    if (delivered) return { status: 'confirmed', receipt: JSON.parse(String(delivered['receipt'])) as JsonObject };
    const sealed = this.db.prepare('SELECT receipt FROM sealed_attempts WHERE logical_key=? AND attempt=?').get(request.logical_key, request.attempt);
    return sealed ? { status: 'no_effect_proven', receipt: JSON.parse(String(sealed['receipt'])) as JsonObject } : null;
  }
  private receipt(request: EffectRequest, status: string): JsonObject {
    return { target_id: this.id, target_version: this.version, logical_key: request.logical_key, destination: request.destination, payload_hash: request.payload_hash, attempt: request.attempt, status, receipt_id: randomUUID(), observed_at: new Date().toISOString() };
  }
  async invoke(request: EffectRequest): Promise<EffectObservation> {
    if (this.mode === 'unavailable') return { status: 'unknown', receipt: null };
    const result = this.transaction(() => {
      this.intent(request); const prior = this.observed(request); if (prior) return prior;
      if (this.mode === 'no_effect') return this.seal(request);
      const receipt = this.receipt(request, 'confirmed');
      this.db.prepare('INSERT INTO deliveries VALUES (?,?)').run(request.logical_key, JSON.stringify(receipt));
      return { status: 'confirmed' as const, receipt };
    });
    return this.mode === 'lose_response' ? { status: 'unknown', receipt: null } : result;
  }
  private seal(request: EffectRequest): EffectObservation {
    const receipt = this.receipt(request, 'no_effect_proven');
    this.db.prepare('INSERT INTO sealed_attempts VALUES (?,?,?)').run(request.logical_key, request.attempt, JSON.stringify(receipt));
    return { status: 'no_effect_proven', receipt };
  }
  async reconcile(request: EffectRequest): Promise<EffectObservation> {
    if (this.mode === 'unavailable') return { status: 'unknown', receipt: null };
    // Sealing and lookup are atomic. A late old invocation cannot deliver after absence was proven.
    return this.transaction(() => { this.intent(request); return this.observed(request) ?? this.seal(request); });
  }
  async verify(request: EffectRequest, observation: EffectObservation): Promise<boolean> {
    if (observation?.status === 'unknown') return observation.receipt === null;
    if (!['confirmed', 'no_effect_proven'].includes(observation?.status) || !observation.receipt) return false;
    const intent = this.db.prepare('SELECT destination,payload_hash FROM intents WHERE logical_key=?').get(request.logical_key);
    if (!intent || intent['destination'] !== request.destination || intent['payload_hash'] !== request.payload_hash) return false;
    const row = observation.status === 'confirmed' ? this.db.prepare('SELECT receipt FROM deliveries WHERE logical_key=?').get(request.logical_key) : this.db.prepare('SELECT receipt FROM sealed_attempts WHERE logical_key=? AND attempt=?').get(request.logical_key, request.attempt);
    return !!row && hashJson(JSON.parse(String(row['receipt']))) === hashJson(observation.receipt);
  }
}
