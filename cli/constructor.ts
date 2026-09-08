import { readFileSync } from 'node:fs';
import { DomainError } from '../core/errors.js';
import { assertInstallPlan, assertRequest } from '../builder/planner.js';
import type { InstallPlan } from '../builder/model.js';
import { applyLocalInstallation, inspectLocalInstallation, planLocalInstallation, readLocalManifest, readLocalPlan, readLocalVerification, recoverLocalConstruction, resolveLocalInstallation, verifyLocalInstallation } from '../adapters/interfaces/local/installation.js';

export const constructorCommands = ['resolve', 'plan', 'inspect', 'apply', 'verify', 'create', 'adopt', 'resume'];
const output = (value: unknown) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
function read(path: string): unknown {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { throw new DomainError('INVALID_INPUT', 'Cannot read a JSON input file.', { path }); }
}
function authority(plan: InstallPlan, actor: string) {
  // Explicit local CLI invocation is a trusted host action, not permission inferred from source text.
  return { actor_id: actor, instance_id: plan.request.instance_id, plan_digest: plan.digest,
    destination: plan.observation.destination, effects: ['instance.install'], valid_until: new Date(Date.now() + 60 * 60 * 1000).toISOString() };
}
export function runConstructor(args: string[]): void {
  const command = args[0]!;
  if (command === 'apply' && args.length === 4 && args[2] === '--actor') {
    const plan = assertInstallPlan(read(args[1]!));
    const manifest = applyLocalInstallation(plan, authority(plan, args[3]!));
    output({ ok: true, directory: plan.observation.destination, manifest, next: 'verify', runtime_integration: 'not_verified' });
    return;
  }
  if (['resolve', 'plan', 'inspect', 'verify'].includes(command) && args.length === 3) {
    const request = assertRequest(read(args[1]!)), directory = args[2]!;
    if (command === 'resolve') output(resolveLocalInstallation(request, directory));
    if (command === 'plan') output(planLocalInstallation(request, directory));
    if (command === 'inspect') output({ inspection: inspectLocalInstallation(request, directory), manifest: readLocalManifest(request, directory), verification_evidence: readLocalVerification(request, directory) });
    if (command === 'verify') {
      const manifest = verifyLocalInstallation(request, directory), ok = manifest.state === 'verified';
      output({ ok, scope: 'foundation', manifest, runtime_integration: 'not_verified' });
      process.exitCode = ok ? 0 : 1;
    }
    return;
  }
  if (['create', 'adopt', 'resume'].includes(command) && args.length === 5 && args[3] === '--actor') {
    const request = assertRequest(read(args[1]!)), directory = args[2]!, actor = args[4]!;
    if (actor !== request.owner_id) throw new DomainError('FORBIDDEN', 'CLI actor differs from the installation owner.');
    if ((command === 'create' && request.adoption) || (command === 'adopt' && !request.adoption)) throw new DomainError('INVALID_INPUT', 'Use adopt with an explicit revision/ownership mapping; use create for a new project.');
    if (command === 'resume') recoverLocalConstruction(request, directory, actor);
    const plan = command === 'resume' ? readLocalPlan(request, directory) : planLocalInstallation(request, directory);
    if (!plan) throw new DomainError('NOT_FOUND', 'No recorded plan to resume.');
    applyLocalInstallation(plan, authority(plan, actor));
    const manifest = verifyLocalInstallation(request, directory), ok = manifest.state === 'verified';
    output({ ok, scope: 'foundation', directory: plan.observation.destination, manifest, runtime_integration: 'not_verified' });
    process.exitCode = ok ? 0 : 1;
    return;
  }
  throw new DomainError('INVALID_INPUT', 'Invalid constructor arguments. Run --help.');
}
