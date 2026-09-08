import * as en from './locales/en.js';
import * as es from './locales/es.js';

export type Language = 'en' | 'es';
export const messages = { en, es };

/** Locale selection is presentation-only and must finish before dispatching a command. */
export function parseLanguage(input: string[], environment?: string): { args: string[]; language: Language } {
  const args: string[] = [];
  let selected: string | undefined;
  for (let index = 0; index < input.length; index++) {
    if (input[index] !== '--lang') { args.push(input[index]!); continue; }
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
