import { createHash } from 'node:crypto';
import { DomainError } from './errors.js';
import type { Json, StoredRecord } from './models.js';

export function canonicalJson(value: unknown): string {
  const active = new Set<object>();
  function encode(input: unknown): string {
    if (input === null || typeof input === 'boolean' || typeof input === 'string') return JSON.stringify(input);
    if (typeof input === 'number' && Number.isFinite(input)) return JSON.stringify(input);
    if (typeof input !== 'object' || input === null || active.has(input)) throw new DomainError('INVALID_INPUT', 'Expected acyclic JSON data.');
    if (!Array.isArray(input) && ![Object.prototype, null].includes(Object.getPrototypeOf(input))) throw new DomainError('INVALID_INPUT', 'Expected plain JSON objects.');
    active.add(input);
    let result: string;
    if (Array.isArray(input)) {
      const values: string[] = [];
      for (let i = 0; i < input.length; i++) values.push(encode(input[i]));
      result = `[${values.join(',')}]`;
    } else {
      const object = input as Record<string, unknown>;
      result = `{${Object.keys(object).sort().map(key => `${JSON.stringify(key)}:${encode(object[key])}`).join(',')}}`;
    }
    active.delete(input);
    return result;
  }
  return encode(value);
}
export function hashText(value: string): string { return createHash('sha256').update(value, 'utf8').digest('hex'); }
export function hashJson(value: unknown): string { return hashText(canonicalJson(value)); }
export function effectKey(instance: string, job: string, step: string, effect: string): string { return hashJson(['mcc-effect-v1', instance, job, step, effect]); }
export function decisionContentHash(decision: StoredRecord<'decision'>): string {
  const { project_ref, choice, actor_id, alternatives, evidence, review_criterion } = decision.data;
  return hashJson({ project_ref, choice, actor_id, alternatives, evidence, review_criterion });
}
export function cloneJson<T>(value: T): T { return JSON.parse(canonicalJson(value)) as T; }
export function asJson(value: unknown): Json { return cloneJson(value) as Json; }
