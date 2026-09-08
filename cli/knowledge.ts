import { readFileSync } from 'node:fs';
import { DomainError } from '../core/errors.js';
import { captureLocalSource, readLocalContext, readLocalSource, readLocalSourceHistory, readLocalSourceAt, searchLocalSources } from '../adapters/interfaces/local/knowledge.js';

const flags: Record<string, string[]> = {
  capture: ['actor', 'key', 'file', 'text', 'expected-revision'],
  source: ['actor', 'revision', 'as-of'],
  'source-history': ['actor', 'limit', 'after-revision'],
  search: ['actor', 'limit', 'after', 'as-of', 'valid-at'],
  context: ['actor', 'limit', 'after', 'as-of', 'valid-at'],
};
export function runKnowledge(args: string[]): unknown {
  const command = args[0]!, positionalCount = command === 'context' ? 3 : 4;
  if (!flags[command] || args.length < positionalCount) throw new DomainError('INVALID_INPUT', 'Invalid knowledge arguments. Run --help.');
  const values: Record<string, string> = {};
  for (let index = positionalCount; index < args.length; index += 2) {
    const flag = args[index]!;
    if (!flag.startsWith('--') || !flags[command]!.includes(flag.slice(2)) || flag in values || args[index + 1] === undefined) throw new DomainError('INVALID_INPUT', 'Unknown, duplicate or incomplete knowledge option.');
    values[flag] = args[index + 1]!;
  }
  const actor = values['--actor'];
  if (!actor) throw new DomainError('INVALID_INPUT', 'Knowledge commands require --actor.');
  let limit: number | undefined;
  if (values['--limit'] !== undefined) {
    if (!/^[1-9][0-9]*$/.test(values['--limit'])) throw new DomainError('INVALID_INPUT', 'Page limit must be an integer from 1 to 100.');
    limit = Number(values['--limit']);
    if (!Number.isSafeInteger(limit) || limit > 100) throw new DomainError('INVALID_INPUT', 'Page limit must be an integer from 1 to 100.');
  }
  let request: unknown;
  try { request = JSON.parse(readFileSync(args[1]!, 'utf8')); }
  catch { throw new DomainError('INVALID_INPUT', 'Cannot read a JSON request file.'); }
  const directory = args[2]!, id = args[3]!;
  if (command === 'capture') return captureLocalSource(request, directory, actor, {
    source_id: id, request_key: values['--key']!, expected_revision: values['--expected-revision'] ?? null,
    ...(values['--file'] === undefined ? {} : { file: values['--file'] }), ...(values['--text'] === undefined ? {} : { text: values['--text'] }),
  });
  if (command === 'source' && values['--as-of'] !== undefined) {
    if (values['--revision'] !== undefined) throw new DomainError('INVALID_INPUT', 'Choose --revision or --as-of.');
    return readLocalSourceAt(request, directory, actor, id, values['--as-of']);
  }
  if (command === 'source') return readLocalSource(request, directory, actor, id, values['--revision']);
  const paging = limit === undefined ? {} : { limit };
  if (command === 'source-history') return readLocalSourceHistory(request, directory, actor, id, { ...paging, ...(values['--after-revision'] === undefined ? {} : { after_revision: values['--after-revision'] }) });
  const query = { ...paging, ...(values['--as-of'] === undefined ? {} : { as_of: values['--as-of'] }), ...(values['--valid-at'] === undefined ? {} : { valid_at: values['--valid-at'] }), ...(values['--after'] === undefined ? {} : { after_id: values['--after'] }) };
  if (command === 'search') return searchLocalSources(request, directory, actor, { ...query, text: id });
  return readLocalContext(request, directory, actor, query);
}
