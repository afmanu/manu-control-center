import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// Actual read-only fresh-session test against an explicitly supplied synthetic operating workspace.
const [directory, model = 'gpt-5.6-sol'] = process.argv.slice(2);
assert.ok(directory && isAbsolute(directory), 'Use verify-profile-session.mjs /absolute/synthetic-workspace [model]');
const root = realpathSync(directory), env = {};
for (const key of ['PATH', 'HOME', 'CODEX_HOME', 'TMPDIR', 'LANG', 'LC_ALL', 'SSL_CERT_FILE', 'SSL_CERT_DIR']) if (process.env[key]) env[key] = process.env[key];
const prompt = JSON.parse(readFileSync(new URL('../examples/locales/es/profile-session.json', import.meta.url), 'utf8')).request;
const args = ['exec', '--ignore-user-config', '--ephemeral', '--skip-git-repo-check', '--sandbox', 'read-only', '--cd', root, '--json', '--color', 'never', '--model', model, '--output-last-message', join(root, 'fresh-session-answer.md'), '-c', 'approval_policy="never"', '-c', 'web_search="disabled"', '-c', 'agents.enabled=false', ...['apps', 'plugins', 'hooks', 'multi_agent', 'multi_agent_v2', 'memories', 'goals', 'browser_use', 'browser_use_external', 'computer_use', 'in_app_browser', 'image_generation', 'skill_mcp_dependency_install', 'skill_search'].flatMap(name => ['--disable', name]), '-'];
const result = spawnSync('codex', args, { cwd: root, env, input: prompt, encoding: 'utf8', timeout: 240000, maxBuffer: 8388608 });
writeFileSync(join(root, 'fresh-session-events.jsonl'), result.stdout ?? '', { mode: 0o600 });
writeFileSync(join(root, 'fresh-session-diagnostics.txt'), result.stderr ?? '', { mode: 0o600 });
assert.equal(result.status, 0, result.error?.message ?? 'Fresh Codex session failed; inspect retained diagnostics.');
const hash = file => createHash('sha256').update(readFileSync(join(root, file))).digest('hex');
console.log(JSON.stringify({ ok: true, actual_fresh_codex_session: true, chat_history_supplied: false, binding_in_prompt: false, workspace_instructions_sha256: hash('AGENTS.md'), events_sha256: hash('fresh-session-events.jsonl'), answer_sha256: hash('fresh-session-answer.md'), semantic_review: 'pending_independent_inspection' }));
