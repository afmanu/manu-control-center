import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Keep the skill relocatable; source data never chooses an executable.
const root = new URL('../../../../', import.meta.url);
const packagePath = new URL('package.json', root), bundled = new URL('dist/cli/main.js', root);
const local = existsSync(packagePath) && JSON.parse(readFileSync(packagePath, 'utf8')).name === 'manu-control-center';
const configured = process.env.MANU_CONTROL_CENTER_CLI;
if (!configured && local && !existsSync(bundled)) throw new Error('Build the Manu Control Center checkout with npm run build first.');
const script = configured || (local ? fileURLToPath(bundled) : null);
const result = spawnSync(script ? process.execPath : 'manu-control-center', script ? [script, ...process.argv.slice(2)] : process.argv.slice(2), { stdio: 'inherit', shell: false });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
