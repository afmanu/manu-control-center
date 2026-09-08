import { DomainError } from '../core/errors.js';
import { readLocalTextFile } from '../adapters/interfaces/local/knowledge.js';
import { coordinatorOperations, operateLocalCoordinator, type CoordinatorOperation } from '../adapters/interfaces/local/coordinator.js';
import type { SimulatorMode } from '../adapters/effects/simulated-mailbox.js';
function json(path: string): unknown {
  try { return JSON.parse(readLocalTextFile(path).content); }
  catch (error) { if (error instanceof DomainError) throw error; throw new DomainError('INVALID_INPUT', 'Cannot read coordinator JSON input.'); }
}
export async function runCoordinator(args: string[]) {
  const operation = args[0]?.slice('coordinator-'.length) as CoordinatorOperation;
  if (!args[0]?.startsWith('coordinator-') || !coordinatorOperations.includes(operation) || args.length < 6) throw new DomainError('INVALID_INPUT', 'Invalid coordinator command. Run --help.');
  const flags: Record<string, string> = {};
  for (let index = 4; index < args.length; index += 2) {
    const key = args[index]!;
    if (!['--actor', '--simulate'].includes(key) || key in flags || !args[index + 1]) throw new DomainError('INVALID_INPUT', 'Unknown, duplicate or incomplete coordinator option.');
    flags[key] = args[index + 1]!;
  }
  if (!flags['--actor']) throw new DomainError('INVALID_INPUT', 'Coordinator commands require --actor.');
  if (flags['--simulate'] && !['advance', 'reconcile'].includes(operation)) throw new DomainError('INVALID_INPUT', 'Simulator fault injection applies only to advance/reconcile.');
  return operateLocalCoordinator(json(args[1]!), args[2]!, flags['--actor'], operation, operation === 'read' ? { run_id: args[3]! } : json(args[3]!), (flags['--simulate'] ?? 'confirm') as SimulatorMode);
}
