import * as en from './locales/en.js';
import * as es from './locales/es.js';

export type Language = 'en' | 'es';
export const messages = { en, es };

/** Locale selection is presentation-only and must finish before dispatching a command. */
export function parseLanguage(input: string[], environment?: string): { args: string[]; language: Language } {
  const args: string[] = [];
  let selected: string | undefined;
  const valueFlags = new Set(['--model', '--after-run-id', '--after-source-id', '--after-decision-id', '--after-claim-id', '--after-capture-id', '--simulate', '--actor', '--key', '--file', '--text', '--expected-revision', '--revision', '--limit', '--after', '--after-revision', '--as-of', '--valid-at', '--kind']);
  const positionals: Record<string, number> = { use: 1, 'profile-create': 3, 'profile-inspect': 1, 'profile-workspace': 2, session: 2, 'session-continue': 3, 'workflow-prepare': 3, 'workflow-read': 3, 'workflow-complete': 3, capture: 3, source: 3, 'source-history': 3, search: 3, context: 2, claim: 3, 'decision-propose': 3, 'artifact-draft': 3, 'decision-grant': 3, 'decision-revoke-grant': 3, 'decision-set': 3, 'artifact-approve': 3, 'artifact-fork': 3, 'sources-check': 3, knowledge: 3, 'knowledge-record': 3 };
  for (const operation of ['submit', 'read', 'claim', 'renew', 'pause', 'advance', 'review', 'revise', 'authorize', 'cancel', 'reconcile', 'retry']) positionals[`coordinator-${operation}`] = 3;
  let remaining = 0;
  for (let index = 0; index < input.length; index++) {
    const token = input[index]!;
    if (remaining > 0) { args.push(token); remaining--; continue; }
    if (token !== '--lang') {
      if (args.length === 2 && args[0] === 'use') remaining = Math.max(0, (positionals[token] ?? 2) - 2);
      if (!args.length) remaining = positionals[token] ?? 0;
      args.push(token);
      if (valueFlags.has(token) && input[index + 1] !== undefined) args.push(input[++index]!);
      continue;
    }
    if (selected !== undefined || !input[index + 1]) throw new Error('Use --lang en|es once.');
    selected = input[++index];
  }
  const language = selected ?? environment ?? 'en';
  if (language !== 'en' && language !== 'es') throw new Error('Unsupported language. Use --lang en|es or MANU_CONTROL_CENTER_LANG=en|es.');
  return { args, language };
}

/** Keep machine diagnostics intact; add a localized summary only to top-level errors. */
export function presentResult(value: unknown, language: Language): unknown {
  if (language !== 'es' || !value || typeof value !== 'object' || !('ok' in value) || value.ok !== false || !('code' in value) || typeof value.code !== 'string') return value;
  const summary = es.errors[value.code];
  return summary ? { ...value, display_message: summary } : value;
}
