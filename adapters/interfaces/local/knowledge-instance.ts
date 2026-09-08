import { join } from 'node:path';
import { DomainError } from '../../../core/errors.js';
import { requiredText } from '../../../core/knowledge.js';
import { assertRequest } from '../../../builder/planner.js';
import { inspectLocalInstallation, readLocalManifest, readLocalPlan } from './installation.js';

export function existingLocalKnowledge(input: unknown, directory: string, actor: string) {
  const request = assertRequest(input);
  requiredText(actor, 'actor');
  if (actor !== request.owner_id) throw new DomainError('FORBIDDEN', 'Local knowledge commands require the installation owner.');
  const inspection = inspectLocalInstallation(request, directory);
  if (!inspection.store_exists || !inspection.installation_revision) throw new DomainError('NOT_FOUND', 'Create or resume the foundation before using knowledge commands.');
  const plan = readLocalPlan(request, inspection.destination), manifest = readLocalManifest(request, inspection.destination);
  if (!plan || !manifest || manifest.state === 'partial') throw new DomainError('CONFLICT', 'Resume the incomplete foundation before using knowledge commands.');
  return { request, path: join(inspection.destination, 'store.sqlite') };
}
