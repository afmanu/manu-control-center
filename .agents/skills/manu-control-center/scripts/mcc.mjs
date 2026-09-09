import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep the skill relocatable; source data never chooses an executable.
const root = new URL('../../../../', import.meta.url);
const packagePath = new URL('package.json', root), bundled = new URL('dist/cli/main.js', root);
const local = existsSync(packagePath) && JSON.parse(readFileSync(packagePath, 'utf8')).name === 'manu-control-center';
const bindingPath = new URL('./cli-binding.json', import.meta.url);
const binding = existsSync(bindingPath) ? JSON.parse(readFileSync(bindingPath, 'utf8')) : null;
if (binding && (Object.keys(binding).join(',') !== 'cli' || typeof binding.cli !== 'string' || !isAbsolute(binding.cli))) throw new Error('Invalid host CLI binding.');
const configured = process.env.MANU_CONTROL_CENTER_CLI || binding?.cli;
if (!configured && local && !existsSync(bundled)) throw new Error('Build the Manu Control Center checkout with npm run build first.');
const script = configured || (local ? fileURLToPath(bundled) : null);
const result = spawnSync(script ? process.execPath : 'manu-control-center', script ? [script, ...process.argv.slice(2)] : process.argv.slice(2), { stdio: 'inherit', shell: false });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
