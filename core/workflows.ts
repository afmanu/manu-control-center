import { DomainError } from './errors.js';
import { canonicalJson, hashText } from './hashing.js';
import { requiredText, validateCaptureText } from './knowledge.js';
import type { CaptureInput } from './knowledge.js';
import type { Ref, SourcePolicy, StoredRecord } from './models.js';

export const workflowVersion = '0.1.0-local-human';
export const categories = ['agreement', 'proposal', 'open_question', 'conflict', 'context'] as const;
export type MeetingCategory = typeof categories[number];
/** UTF-16 offsets into an exact stored segment, never instructions or paraphrases. */
export interface Selection { segment_id: string; start: number; end: number; category: MeetingCategory }
export type MeetingSource = { ref: Ref } | { capture: Omit<CaptureInput, 'project_id'> };
export type PrepareWorkflow = { project_id: string; request_key: string; source_policy: SourcePolicy } & (
  { workflow: 'meeting-to-brief'; meeting: { source: MeetingSource; selections: Selection[] } } |
  { workflow: 'project-status' }
);
export const semanticCriteria = ['classification_faithful', 'uncertainty_preserved', 'no_unsupported_assertions', 'source_instructions_not_followed'] as const;
export interface SemanticReview {
  verdict: 'accept' | 'reject';
  checks: { criterion: typeof semanticCriteria[number]; outcome: 'pass' | 'fail'; note: string }[];
}
export interface CompleteWorkflow { project_id: string; run_ref: Ref; artifact_ref: Ref; content_hash: string; review: SemanticReview }
export interface WorkflowResult { job: StoredRecord<'job'>; run: StoredRecord<'run'>; artifact: StoredRecord<'artifact'>; replayed: boolean }
export interface WorkflowStore {
  prepare(input: PrepareWorkflow): WorkflowResult;
  read(projectId: string, runId: string): WorkflowResult;
  complete(input: CompleteWorkflow): WorkflowResult;
}
export function exactFields(value: unknown, names: readonly string[]): void {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== [...names].sort().join(',')) throw new DomainError('INVALID_INPUT', 'Invalid workflow operation fields.');
}
export function workflowRef(value: Ref): void { exactFields(value, ['id', 'revision']); requiredText(value.id, 'reference id'); requiredText(value.revision, 'reference revision'); }
export function assertSemanticReview(value: SemanticReview): void {
  exactFields(value, ['verdict', 'checks']);
  if (!['accept', 'reject'].includes(value.verdict) || !Array.isArray(value.checks) || value.checks.length !== semanticCriteria.length) throw new DomainError('INVALID_INPUT', 'Review every semantic criterion.');
  for (const check of value.checks) {
    exactFields(check, ['criterion', 'outcome', 'note']);
    if (!semanticCriteria.includes(check.criterion) || !['pass', 'fail'].includes(check.outcome)) throw new DomainError('INVALID_INPUT', 'Unknown semantic review criterion or outcome.');
    requiredText(check.note, 'review evidence note', 4096);
  }
  if (new Set(value.checks.map(check => check.criterion)).size !== semanticCriteria.length || (value.verdict === 'accept') !== value.checks.every(check => check.outcome === 'pass')) throw new DomainError('INVALID_INPUT', 'Acceptance requires all criteria to pass; rejection requires a concrete failure.');
}
/** Human classification is input. This extractor only validates coverage and copies exact evidence. */
export function extractMeeting(source: StoredRecord<'source'>, selections: Selection[]) {
  if (!Array.isArray(selections) || !selections.length || selections.length > 200) throw new DomainError('INVALID_INPUT', 'Classify the complete transcript using 1 to 200 selections.');
  const items = selections.map(item => {
    exactFields(item, ['segment_id', 'start', 'end', 'category']);
    const segment = source.data.segments.find(segment => segment.id === item.segment_id);
    if (!segment || !categories.includes(item.category) || !Number.isSafeInteger(item.start) || !Number.isSafeInteger(item.end) || item.start < 0 || item.end <= item.start || item.end > segment.text.length) throw new DomainError('INVALID_INPUT', 'Invalid category, segment or quote range.');
    const quote = segment.text.slice(item.start, item.end); validateCaptureText(quote);
    return { ...item, quote, speaker: segment.speaker, evidence: { source: { id: source.id, revision: source.revision }, segment_id: segment.id } };
  });
  for (const segment of source.data.segments) {
    let cursor = 0;
    for (const item of items.filter(item => item.segment_id === segment.id).sort((a, b) => a.start - b.start)) {
      if (item.start < cursor || segment.text.slice(cursor, item.start).trim()) throw new DomainError('VALIDATION_FAILED', 'Transcript selections overlap or omit content.', { segment_id: segment.id, offset: cursor });
      cursor = item.end;
    }
    if (segment.text.slice(cursor).trim()) throw new DomainError('VALIDATION_FAILED', 'Transcript content is unclassified.', { segment_id: segment.id, offset: cursor });
  }
  return items;
}
export function draftWorkflow(value: unknown): { content: string; content_hash: string } {
  const content = canonicalJson(value); validateCaptureText(content);
  return { content, content_hash: hashText(content) };
}
