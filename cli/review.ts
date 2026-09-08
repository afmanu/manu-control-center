import { readFileSync } from 'node:fs';
import { DomainError } from '../core/errors.js';
import type { ReviewKind } from '../core/review.js';
import { approveLocalArtifact, changeLocalDecision, checkLocalSources, forkLocalArtifact, grantLocalDecision, queryLocalKnowledge, readLocalKnowledgeRecord, revokeLocalDecisionGrant, saveLocalDraft } from '../adapters/interfaces/local/review.js';

export const reviewCommands = ['claim', 'decision-propose', 'artifact-draft', 'decision-grant', 'decision-revoke-grant', 'decision-set', 'artifact-approve', 'artifact-fork', 'sources-check', 'knowledge', 'knowledge-record'];
function json(path: string): unknown {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { throw new DomainError('INVALID_INPUT', 'Cannot read a JSON input file.'); }
}
export function runReview(args: string[]): unknown {
  const command = args[0]!, allowed = command === 'knowledge' ? ['actor', 'text', 'limit', 'after', 'as-of', 'valid-at'] : command === 'knowledge-record' ? ['actor', 'kind', 'revision', 'as-of'] : ['actor'];
  if (args.length < 6 || !reviewCommands.includes(command)) throw new DomainError('INVALID_INPUT', 'Invalid review arguments. Run --help.');
  const flags: Record<string, string> = {};
  for (let index = 4; index < args.length; index += 2) {
    const key = args[index]!;
    if (!key.startsWith('--') || !allowed.includes(key.slice(2)) || key in flags || args[index + 1] === undefined) throw new DomainError('INVALID_INPUT', 'Unknown, duplicate or incomplete review option.');
    flags[key] = args[index + 1]!;
  }
  if (!flags['--actor']) throw new DomainError('INVALID_INPUT', 'Review commands require --actor.');
  const request = json(args[1]!), directory = args[2]!, actor = flags['--actor'];
  const temporal = flags['--as-of'] === undefined ? {} : { as_of: flags['--as-of'] };
  if (command === 'knowledge-record') return readLocalKnowledgeRecord(request, directory, actor, args[3]!, flags['--kind'] as ReviewKind, { ...temporal, ...(flags['--revision'] === undefined ? {} : { revision: flags['--revision'] }) });
  if (command === 'knowledge') {
    let limit: number | undefined;
    if (flags['--limit'] !== undefined) {
      if (!/^[1-9][0-9]*$/.test(flags['--limit'])) throw new DomainError('INVALID_INPUT', 'Page limit must be an integer from 1 to 100.');
      limit = Number(flags['--limit']);
    }
    return queryLocalKnowledge(request, directory, actor, { kind: args[3] as ReviewKind, ...temporal, ...(flags['--valid-at'] === undefined ? {} : { valid_at: flags['--valid-at'] }), ...(limit === undefined ? {} : { limit }), ...(flags['--text'] === undefined ? {} : { text: flags['--text'] }), ...(flags['--after'] === undefined ? {} : { after_id: flags['--after'] }) });
  }
  const payload = json(args[3]!);
  if (command === 'claim') return saveLocalDraft(request, directory, actor, 'claim', payload);
  if (command === 'decision-propose') return saveLocalDraft(request, directory, actor, 'decision', payload);
  if (command === 'artifact-draft') return saveLocalDraft(request, directory, actor, 'artifact', payload);
  if (command === 'decision-grant') return grantLocalDecision(request, directory, actor, payload);
  if (command === 'decision-revoke-grant') return revokeLocalDecisionGrant(request, directory, actor, payload);
  if (command === 'decision-set') return changeLocalDecision(request, directory, actor, payload);
  if (command === 'artifact-approve') return approveLocalArtifact(request, directory, actor, payload);
  if (command === 'artifact-fork') return forkLocalArtifact(request, directory, actor, payload);
  return checkLocalSources(request, directory, actor, payload);
}
