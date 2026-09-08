import { DomainError } from '../core/errors.js';
import { readLocalTextFile } from '../adapters/interfaces/local/knowledge.js';
import { completeLocalWorkflow, prepareLocalWorkflow, readLocalWorkflow } from '../adapters/interfaces/local/workflows.js';
function json(path: string): unknown {
  try { return JSON.parse(readLocalTextFile(path).content); }
  catch (error) { if (error instanceof DomainError) throw error; throw new DomainError('INVALID_INPUT', 'Cannot read workflow JSON input.'); }
}
export function runWorkflow(args: string[]): unknown {
  if (args.length !== 6 || args[4] !== '--actor' || !args[5] || !['workflow-prepare', 'workflow-read', 'workflow-complete'].includes(args[0]!)) throw new DomainError('INVALID_INPUT', 'Use workflow-prepare|workflow-read|workflow-complete <request.json> <absolute-directory> <payload.json|run-id> --actor <id>.');
  const request = json(args[1]!), directory = args[2]!, actor = args[5]!;
  if (args[0] === 'workflow-read') return readLocalWorkflow(request, directory, actor, args[3]!);
  const payload = json(args[3]!);
  return args[0] === 'workflow-prepare' ? prepareLocalWorkflow(request, directory, actor, payload) : completeLocalWorkflow(request, directory, actor, payload);
}
