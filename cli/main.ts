#!/usr/bin/env node
import { messages, parseLanguage, presentResult, type Language } from './i18n.js';
import { readFileSync } from 'node:fs';
import { resolveDataDirectory } from '../adapters/interfaces/local/data-directory.js';

const metadata = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string };
let language: Language = 'en';

function output(value: unknown): void {
  process.stdout.write(`${JSON.stringify(presentResult(value, language), null, 2)}\n`);
}

async function main(args: string[]): Promise<void> {
  if (args.length === 0 || (args.length === 1 && ['--help', '-h', 'help'].includes(args[0]!))) {
    process.stdout.write(messages[language].help(metadata.version));
    return;
  }
  if (args.length === 1 && ['--version', '-v'].includes(args[0]!)) {
    process.stdout.write(`${metadata.version}\n`);
    return;
  }
  if (['resolve', 'plan', 'inspect', 'apply', 'verify', 'create', 'adopt', 'resume'].includes(args[0]!)) {
    const { runConstructor } = await import('./constructor.js');
    runConstructor(args); return;
  }
  if (['capture', 'source', 'source-history', 'search', 'context'].includes(args[0]!)) {
    const { runKnowledge } = await import('./knowledge.js');
    output(runKnowledge(args)); return;
  }
  if (['claim', 'decision-propose', 'artifact-draft', 'decision-grant', 'decision-revoke-grant', 'decision-set', 'artifact-approve', 'artifact-fork', 'sources-check', 'knowledge', 'knowledge-record'].includes(args[0]!)) {
    const { runReview } = await import('./review.js');
    output(runReview(args)); return;
  }
  if (['workflow-prepare', 'workflow-read', 'workflow-complete'].includes(args[0]!)) {
    const { runWorkflow } = await import('./workflows.js');
    output(runWorkflow(args)); return;
  }
  if (['session', 'session-continue'].includes(args[0]!)) {
    const { runSession } = await import('./session.js');
    output(await runSession(args)); return;
  }
  if (args[0]?.startsWith('coordinator-')) {
    const { runCoordinator } = await import('./coordinator.js');
    output(await runCoordinator(args)); return;
  }
  if (args.length === 1 && args[0] === 'doctor') {
    const dataDirectory = resolveDataDirectory();
    const { probeSqlite } = await import('../adapters/backends/sqlite/probe.js');
    const sqlite = probeSqlite();
    const ok = sqlite.persistence && sqlite.conditional_write && sqlite.stale_write_rejected && sqlite.transaction_rollback;
    output({ ok, version: metadata.version, node: process.versions.node, sqlite,
      data_directory: { path: dataDirectory, status: 'configured_not_created' },
      instance_status: 'constructor_available_not_inspected', runtime_integration: 'not_verified' });
    process.exitCode = ok ? 0 : 1;
    return;
  }
  if (args.length === 1 && args[0] === 'contracts') {
    const { contractKinds } = await import('../core/schema-definitions.js');
    output({ schema_version: '0.1.0-draft', kinds: contractKinds }); return;
  }
  if ((args.length === 3 && args[0] === 'validate') || (args.length === 2 && args[0] === 'validate-bundle')) {
    try {
      const input: unknown = JSON.parse(readFileSync(args.at(-1)!, 'utf8'));
      if (args[0] === 'validate-bundle') {
        const { assertConstructionBundle } = await import('../core/construction.js');
        const bundle = assertConstructionBundle(input);
        output({ ok: true, scope: 'declared_construction_coherence', instance_id: bundle.spec.instance_id });
      } else {
        const { contractKinds } = await import('../core/schema-definitions.js');
        const kind = contractKinds.find(kind => kind === args[1]);
        if (!kind) throw new Error('Unknown contract kind. Run contracts.');
        const { validateContract } = await import('../core/validation.js');
        const result = validateContract(kind, input);
        output(result.ok ? { ok: true, kind, schema_version: result.value.schema_version } : result);
        process.exitCode = result.ok ? 0 : 2;
      }
    } catch (error) {
      const { DomainError } = await import('../core/errors.js');
      output({ ok: false, ...(error instanceof DomainError ? error.toJSON() : { code: 'INVALID_INPUT', message: String(error) }) });
      process.exitCode = 2;
    }
    return;
  }
  if (args.length === 2 && args[0] === 'validate-record') {
    let input: unknown;
    try {
      input = JSON.parse(readFileSync(args[1]!, 'utf8'));
    } catch (error) {
      process.stderr.write(`${JSON.stringify(presentResult({ ok: false, code: 'INVALID_INPUT', message: String(error) }, language))}\n`);
      process.exitCode = 2;
      return;
    }
    const { validateRecordEnvelope } = await import('../core/record.js');
    const result = validateRecordEnvelope(input);
    output({ scope: 'record_envelope_only', ...result });
    process.exitCode = result.ok ? 0 : 2;
    return;
  }
  process.stderr.write(`${messages[language].invalidArguments}\n`);
  process.exitCode = 2;
}

async function dispatch(): Promise<void> {
  let parsed;
  try { parsed = parseLanguage(process.argv.slice(2), process.env['MANU_CONTROL_CENTER_LANG']); }
  catch (error) {
    process.stderr.write(`${JSON.stringify({ ok: false, code: 'INVALID_INPUT', message: String(error) })}\n`);
    process.exitCode = 2; return;
  }
  language = parsed.language;
  await main(parsed.args);
}

dispatch().catch(async error => {
  const { DomainError } = await import('../core/errors.js');
  process.stderr.write(`${JSON.stringify(presentResult({ ok: false, ...(error instanceof DomainError ? error.toJSON() : { code: 'CHECK_FAILED', message: String(error) }) }, language))}\n`);
  process.exitCode = error instanceof DomainError && error.code === 'INVALID_INPUT' ? 2 : 1;
});
