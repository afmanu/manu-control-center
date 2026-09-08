import { dirname, join } from 'node:path';
import { lstatSync } from 'node:fs';
import { DomainError } from '../../../core/errors.js';
import { defaultCoordinatorBudget } from '../../../core/coordinator.js';
import type { ClaimRequest, CoordinatorInput, EffectTarget, GrantRequest, Lease, ReviseRequest, RunRequest } from '../../../core/coordinator.js';
import type { CompleteWorkflow } from '../../../core/workflows.js';
import { exactFields } from '../../../core/workflows.js';
import { SqliteCoordinatorBackend } from '../../backends/sqlite/coordinator.js';
import { CodexRuntime } from '../../runtimes/codex.js';
import { SimulatedMailbox, type SimulatorMode } from '../../effects/simulated-mailbox.js';
import { existingLocalKnowledge } from './knowledge-instance.js';

export const coordinatorOperations = ['submit', 'read', 'claim', 'renew', 'pause', 'advance', 'review', 'revise', 'authorize', 'cancel', 'reconcile', 'retry'] as const;
export type CoordinatorOperation = typeof coordinatorOperations[number];
/** Explicit owner CLI host. No source or agent payload can choose authorization or an adapter implementation. */
export async function operateLocalCoordinator(input: unknown, directory: string, actor: string, operation: CoordinatorOperation, value: unknown, mode: SimulatorMode = 'confirm'): Promise<unknown> {
  if (!coordinatorOperations.includes(operation) || !['confirm', 'lose_response', 'no_effect', 'unavailable'].includes(mode) || (mode !== 'confirm' && !['advance', 'reconcile'].includes(operation))) throw new DomainError('INVALID_INPUT', 'Invalid coordinator operation or simulator fault mode.');
  if (!value || typeof value !== 'object' || Array.isArray(value) || 'project_id' in value) throw new DomainError('INVALID_INPUT', 'The host binds the coordinator project.');
  const payload = value as Record<string, unknown>, { request, path } = existingLocalKnowledge(input, directory, actor);
  const targets = new Map<string, EffectTarget>(); let simulator: SimulatedMailbox | null = null;
  const backend = new SqliteCoordinatorBackend(path, undefined, targets, { readOnly: operation === 'read' }, new Map([['codex', new CodexRuntime(process.env['MANU_CONTROL_CENTER_CODEX_MODEL'] ? { model: process.env['MANU_CONTROL_CENTER_CODEX_MODEL'] } : {})]]));
  try {
    const store = backend.forCoordinator({ instance_id: request.instance_id, actor_id: actor, can_authorize: ['submit', 'review', 'revise', 'authorize'].includes(operation) });
    const bound = { ...payload, project_id: request.project.id };
    if (['advance', 'reconcile'].includes(operation)) {
      exactFields(payload, ['lease']); const lease = payload['lease'] as Lease;
      if (!lease || typeof lease.run_id !== 'string') throw new DomainError('INVALID_INPUT', 'A current executor lease is required.');
      const result = store.read(request.project.id, lease.run_id);
      if (mode !== 'confirm' && result.job.data.workflow.id !== 'deliver-approved-artifact') throw new DomainError('INVALID_INPUT', 'Simulator fault modes only apply to simulated delivery jobs.');
      if (result.job.data.workflow.id === 'deliver-approved-artifact') {
        const targetPath = join(dirname(path), 'simulated-mailbox.sqlite');
        try { const stat = lstatSync(targetPath); if (!stat.isFile() || stat.isSymbolicLink()) throw new DomainError('INVALID_INPUT', 'Simulator store must be a regular file.'); }
        catch (error) { if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error; }
        simulator = new SimulatedMailbox(targetPath, 'local-mailbox', mode); targets.set(simulator.id, simulator);
      }
    }
    switch (operation) {
      case 'submit': return store.submit({ budget: defaultCoordinatorBudget, ...bound } as CoordinatorInput);
      case 'read': exactFields(payload, ['run_id']); return store.read(request.project.id, payload['run_id'] as string);
      case 'claim': return store.claim(bound as unknown as ClaimRequest);
      case 'review': return store.review(bound as unknown as CompleteWorkflow);
      case 'revise': return store.revise(bound as unknown as ReviseRequest);
      case 'authorize': return store.authorize(bound as unknown as GrantRequest);
      case 'cancel': return store.cancel(bound as unknown as RunRequest);
      case 'retry': return store.retry(bound as unknown as RunRequest);
      case 'renew': exactFields(payload, ['lease', 'lease_ms']); return store.renew(request.project.id, payload['lease'] as Lease, payload['lease_ms'] as number);
      case 'pause': exactFields(payload, ['lease']); return store.pause(request.project.id, payload['lease'] as Lease);
      case 'advance': return await store.advance(request.project.id, payload['lease'] as Lease);
      case 'reconcile': return await store.reconcile(request.project.id, payload['lease'] as Lease);
    }
  } finally { backend.close(); simulator?.close(); }
}
