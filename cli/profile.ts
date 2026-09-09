import { createOperationalProfile, createOperationalWorkspace, inspectOperationalProfile } from '../adapters/interfaces/local/profile.js';
import { DomainError } from '../core/errors.js';
import type { Language } from './i18n.js';

export function runProfile(args: string[], language: Language) {
  if (args[0] === 'profile-inspect' && args.length === 2) return inspectOperationalProfile(args[1]!);
  if (args[0] === 'profile-workspace' && args.length === 3) return createOperationalWorkspace(args[1]!, args[2]!);
  if (args[0] !== 'profile-create' || args.length < 6) throw new DomainError('INVALID_INPUT', 'Use profile-create request.json /absolute/instance /absolute/profile.json --actor owner [--model model], profile-inspect profile.json or profile-workspace profile.json /absolute/new-workspace.');
  const flags: Record<string, string> = {};
  for (let i = 4; i < args.length; i += 2) {
    if (!['--actor', '--model'].includes(args[i]!) || args[i]! in flags || !args[i + 1]) throw new DomainError('INVALID_INPUT', 'Unknown, duplicate or incomplete profile option.');
    flags[args[i]!] = args[i + 1]!;
  }
  if (!flags['--actor']) throw new DomainError('INVALID_INPUT', 'Profile creation requires the existing owner.');
  return createOperationalProfile(args[1]!, args[2]!, flags['--actor'], args[3]!, language, flags['--model'] ?? null);
}
