import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 1 && args[0] === '--write'), 'Use check-docs.mjs [--write]');
const write = args.includes('--write');
const list = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const path = join(directory, entry.name);
  return entry.isDirectory() ? list(path) : entry.isFile() && entry.name !== '.DS_Store' ? [path] : [];
});
const files = ['README.md', 'AGENTS.md', 'START-HERE.md', 'LICENSE'].map(name => join(root, name));
for (const directory of ['docs', 'examples', 'references', 'schemas']) files.push(...list(join(root, directory)));
files.sort();
let links = 0;
let jsonFiles = 0;
for (const path of files) {
  const text = readFileSync(path, 'utf8');
  if (extname(path) === '.json') {
    JSON.parse(text);
    jsonFiles++;
  }
  if (extname(path) !== '.md') continue;
  let fence;
  for (const line of text.split('\n')) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
    if (!marker) continue;
    if (!fence) fence = marker[1];
    else if (marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
  }
  assert.equal(fence, undefined, `Unclosed code fence: ${relative(root, path)}`);
  for (const match of text.matchAll(/\[[^\]\n]+\]\((<[^>]+>|[^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1].replace(/^<|>$/g, '');
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
    const destination = decodeURIComponent(target.split('#')[0]);
    const resolved = resolve(dirname(path), destination);
    assert.ok(existsSync(resolved) || (write && resolved === join(root, 'package-manifest.json')), `Missing local link in ${relative(root, path)}: ${target}`);
    links++;
  }
}
const text = name => readFileSync(join(root, name), 'utf8');
const expected = (prefix, count, first = 1, width = 2) => Array.from({ length: count }, (_, i) => `${prefix}${String(i + first).padStart(width, '0')}`);
const components = [...text('docs/component-map.md').matchAll(/^\| (C\d{2}) \|/gm)].map(match => match[1]);
assert.deepEqual(components, expected('C', 30));
const scenarios = [...text('docs/acceptance.md').matchAll(/^\| (A\d{2}) \|/gm)].map(match => match[1]);
assert.deepEqual(scenarios, expected('A', 27));
const roadmap = text('docs/implementation-plan.md');
assert.deepEqual([...roadmap.matchAll(/^## (M\d) —/gm)].map(match => match[1]), expected('M', 7, 0, 1));
const trace = roadmap.split('## Trazabilidad de aceptación')[1]?.split('## Reglas de ejecución y cierre')[0];
assert.ok(trace, 'Missing roadmap traceability table');
assert.deepEqual([...new Set(trace.match(/\bA\d{2}\b/g))].sort(), scenarios);
const manifest = {
  package: 'manu-control-center',
  format_version: 1,
  scope: 'Documentación y esquemas del repositorio; excluye código, dependencias y su propia huella. No es un manifiesto de instancia.',
  validation: { internal_markdown_links: links, markdown_fences: 'passed', json_parse: jsonFiles, components: 30, acceptance_scenarios: 27, roadmap_phases: 7 },
  files: files.map(path => {
    const bytes = readFileSync(path);
    return { path: relative(root, path).split('\\').join('/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  }),
};
const manifestPath = join(root, 'package-manifest.json');
if (write) writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
assert.ok(existsSync(manifestPath), 'Missing inventory: run npm run manifest:docs');
assert.deepEqual(JSON.parse(readFileSync(manifestPath, 'utf8')), manifest, 'Document inventory changed: review and run npm run manifest:docs');
process.stdout.write(JSON.stringify({ ok: true, scope: 'documentation_only', ...manifest.validation, files: manifest.files.length }) + '\n');
