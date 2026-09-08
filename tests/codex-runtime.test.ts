import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CodexRuntime } from '../adapters/runtimes/codex.js';
import { agentCapability } from '../core/agent-workflows.js';
import { DomainError } from '../core/errors.js';

const input = { scope: { instance_id: 'synthetic', actor_id: 'tester' }, capability: agentCapability, source_refs: [], input: { workflow: 'project-status', evidence: [], meeting: null } };
async function fake(mode: string, work: (runtime: CodexRuntime, root: string) => Promise<void>) {
  const root = mkdtempSync(join(tmpdir(), 'mcc-fake-codex-')), binary = join(root, 'codex');
  writeFileSync(binary, `#!${process.execPath}\nconst fs=require('node:fs');\nconst args=process.argv.slice(2);\nif(args.includes('--version')) { console.log('codex-cli ${mode === 'version' ? '999.0.0' : '0.146.0'}'); process.exit(0); }\nlet data=''; process.stdin.on('data',c=>data+=c);process.stdin.on('end',()=>{\nfs.writeFileSync(${JSON.stringify(join(root, 'observed.json'))},JSON.stringify({args,cwd:process.cwd(),input:data,envKeys:Object.keys(process.env)}));\nif(${JSON.stringify(mode)}==='timeout') {setTimeout(()=>{},10000);return;}\nif(${JSON.stringify(mode)}==='nonzero') process.exit(2);\nif(${JSON.stringify(mode)}==='overflow') {process.stdout.write('x'.repeat(2200000));return;}\nconst output=args[args.indexOf('--output-last-message')+1];\nif(${JSON.stringify(mode)}!=='missing') fs.writeFileSync(output,JSON.stringify({classifications:[],statements:[{text:'Synthetic output.',evidence_ids:['project']}]}));\nconsole.log(JSON.stringify({type:'thread.started',thread_id:'synthetic'}));\nif(${JSON.stringify(mode)}==='tool') console.log(JSON.stringify({type:'item.completed',item:{type:'command_execution',command:'unexpected'}}));\nconsole.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'done'}}));\nconsole.log(JSON.stringify({type:'turn.completed',usage:{input_tokens:10,output_tokens:5}}));\n});\n`, { mode: 0o700 });
  try { await work(new CodexRuntime({ executable: binary, timeoutMs: mode === 'timeout' ? 100 : 5000 }), root); }
  finally { rmSync(root, { recursive: true, force: true }); }
}
test('Codex process contract fixes flags, restricts inherited environment and cleans disposable input', () => fake('ok', async (runtime, root) => {
  const result = await runtime.invoke(input); assert.equal(result.metadata!['tools_observed'], 0);
  const observed = JSON.parse(readFileSync(join(root, 'observed.json'), 'utf8'));
  for (const flag of ['--ignore-user-config', '--ephemeral', '--output-schema', '--json']) assert.ok(observed.args.includes(flag));
  assert.equal(observed.args[observed.args.indexOf('--sandbox')+1], 'read-only');
  for (const feature of ['apps','plugins','hooks','shell_tool','multi_agent','memories']) assert.ok(observed.args.includes(feature));
  assert.equal(existsSync(observed.cwd), false); assert.equal(observed.envKeys.includes('CODEX_THREAD_ID'), false);
  assert.match(observed.input, /INPUT_DATA/); assert.doesNotMatch(observed.input, /can_authorize|instance-demo/);
}));
for (const [mode, code] of [['version', 'INCOMPATIBLE_VERSION'], ['timeout', 'TIMEOUT'], ['nonzero', 'CAPABILITY_UNAVAILABLE'], ['missing', 'VALIDATION_FAILED'], ['tool', 'FORBIDDEN'], ['overflow', 'BUDGET_EXCEEDED']] as const) test(`Codex ${mode} fails closed`, () => fake(mode, async runtime => {
  await assert.rejects(() => runtime.invoke(input), (error: unknown) => error instanceof DomainError && error.code === code);
}));
test('Codex enforces packet bounds before starting a process', () => fake('ok', async (runtime, root) => {
  await assert.rejects(() => runtime.invoke({ ...input, input: { text: 'x'.repeat(65537) } }), (error: unknown) => error instanceof DomainError && error.code === 'BUDGET_EXCEEDED');
  assert.equal(existsSync(join(root, 'observed.json')), false);
}));
