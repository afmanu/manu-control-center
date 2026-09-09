import { readLocalTextFile } from '../adapters/interfaces/local/knowledge.js';
import { readLocalSession, continueLocalSession } from '../adapters/interfaces/local/session.js';
import { DomainError } from '../core/errors.js';
import type { SessionQuery } from '../core/session.js';

export async function runSession(args: string[]) {
  const continuing = args[0] === 'session-continue';
  const offset = continuing ? 4 : 3;
  if (args.length < offset + 2) throw new DomainError('INVALID_INPUT', 'Use session request.json /absolute/instance --actor owner, or session-continue with a payload file.');
  const flags: Record<string, string> = {};
  const allowed = continuing ? ['--actor'] : ['--actor', '--limit', '--after-run-id', '--after-source-id', '--after-decision-id', '--after-claim-id', '--after-capture-id'];
  for (let i = offset; i < args.length; i += 2) {
    if (!allowed.includes(args[i]!) || args[i]! in flags || !args[i + 1]) throw new DomainError('INVALID_INPUT', 'Unknown, duplicate or incomplete session option.');
    flags[args[i]!] = args[i + 1]!;
  }
  if (!flags['--actor']) throw new DomainError('INVALID_INPUT', 'Session commands require --actor.');
  const json = (path: string) => { try { return JSON.parse(readLocalTextFile(path).content); } catch { throw new DomainError('INVALID_INPUT', 'Cannot read session JSON input.'); } };
  if (continuing) return continueLocalSession(json(args[1]!), args[2]!, flags['--actor'], json(args[3]!));
  const query = Object.fromEntries(Object.entries(flags).filter(([key]) => key !== '--actor').map(([key, value]) => [key.slice(2).replaceAll('-', '_'), key === '--limit' ? Number(value) : value])) as SessionQuery;
  return readLocalSession(json(args[1]!), args[2]!, flags['--actor'], query);
}
