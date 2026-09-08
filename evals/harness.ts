import { assertContract } from '../core/validation.js';
import { cloneJson } from '../core/hashing.js';
import type { ExpectedBrief, MeetingInput } from '../core/models.js';

export function prepareEvalInput(fixture: unknown): MeetingInput { return cloneJson(assertContract('eval_fixture', fixture).input); }
/** API-level separation; executing arbitrary hostile code in-process is not sandboxing. */
export async function runEvalCase<T>(fixture: unknown, execute: (input: MeetingInput) => Promise<unknown>, evaluate: (output: unknown, expected: ExpectedBrief) => Promise<T>): Promise<T> {
  const validated = assertContract('eval_fixture', fixture);
  const expected = cloneJson(validated.expected);
  const output = await execute(cloneJson(validated.input));
  return evaluate(output, expected);
}
