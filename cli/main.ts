#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolveDataDirectory } from '../adapters/interfaces/local/data-directory.js';

const metadata = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string };
const help = `Manu Control Center ${metadata.version}

Uso:
  manu-control-center --help
  manu-control-center --version
  manu-control-center doctor
  manu-control-center validate-record <archivo.json>

doctor verifica SQLite con datos temporales y muestra la ubicación prevista de datos.
validate-record valida únicamente metadatos RecordEnvelope (0.1.0-draft).
Creación de instancias y workflows: pendientes de M1–M3.
`;

function output(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function main(args: string[]): Promise<void> {
  if (args.length === 0 || (args.length === 1 && ['--help', '-h', 'help'].includes(args[0]!))) {
    process.stdout.write(help);
    return;
  }
  if (args.length === 1 && ['--version', '-v'].includes(args[0]!)) {
    process.stdout.write(`${metadata.version}\n`);
    return;
  }
  if (args.length === 1 && args[0] === 'doctor') {
    const dataDirectory = resolveDataDirectory();
    const { probeSqlite } = await import('../adapters/backends/sqlite/probe.js');
    const sqlite = probeSqlite();
    const ok = sqlite.persistence && sqlite.conditional_write && sqlite.stale_write_rejected && sqlite.transaction_rollback;
    output({ ok, version: metadata.version, node: process.versions.node, sqlite,
      data_directory: { path: dataDirectory, status: 'configured_not_created' },
      instance_status: 'not_implemented', runtime_integration: 'not_verified' });
    process.exitCode = ok ? 0 : 1;
    return;
  }
  if (args.length === 2 && args[0] === 'validate-record') {
    let input: unknown;
    try {
      input = JSON.parse(readFileSync(args[1]!, 'utf8'));
    } catch (error) {
      process.stderr.write(`${JSON.stringify({ ok: false, code: 'INVALID_INPUT', message: String(error) })}\n`);
      process.exitCode = 2;
      return;
    }
    const { validateRecordEnvelope } = await import('../core/record.js');
    const result = validateRecordEnvelope(input);
    output({ scope: 'record_envelope_only', ...result });
    process.exitCode = result.ok ? 0 : 2;
    return;
  }
  process.stderr.write(`Argumentos no válidos. Ejecuta manu-control-center --help.\n`);
  process.exitCode = 2;
}

main(process.argv.slice(2)).catch(error => {
  process.stderr.write(`${JSON.stringify({ ok: false, code: 'CHECK_FAILED', message: String(error) })}\n`);
  process.exitCode = 1;
});
