# Sessions and conversational continuity

M3.6 supplies a Codex-compatible operating skill and a read-only handoff generated from the existing project, knowledge and C19 records. A new conversation needs only the trusted request file, instance directory and actor. It does not need the previous chat or a manually maintained summary.

## Open a session

```bash
manu-control-center session request.json /absolute/instance --actor local-user
manu-control-center session request.json /absolute/instance --actor local-user --lang es
```

The local host verifies the existing installation and owner before opening SQLite read-only. One read snapshot returns the project purpose/status/responsible/next action, accessible source excerpts with exact revisions, decisions and claims with their authority and evidence, pending standalone captures, and the latest coordinator attempt per job. Execution entries include the exact artifact reference/hash, available content, step/effect statuses, review presence, recorded blocker and a suggested next operation. No authorization records, fencing tokens or raw runtime checkpoints are added to the view. Existing decision provenance can still contain its grant reference.

`session-handoff-v1` is a regenerable projection, not a stored execution record. Its timestamp and hash identify the returned snapshot; the hash is not a grant or a guarantee of freshness. Reading it does not invoke a model, renew a lease, create a directory, approve an artifact or change database bytes. Current access to source dependencies is checked before exposing derived content. A run whose context was revoked retains only its permitted owned execution metadata. Unknown project or instance access fails closed.

Each collection defaults to 10 entries, with `--limit 1..25`. Follow its cursor with `--after-source-id`, `--after-decision-id`, `--after-claim-id`, `--after-run-id` or `--after-capture-id`. Ordering is ascending ID, not relevance or newest activity. Latest job attempts are selected before pagination; historical attempts remain retrievable with `coordinator-read`. Source excerpts retain the existing query limit. Artifacts over 16 KiB expose an exact reference/hash and `content_omitted: true`; retrieve their full pinned content with `knowledge-record` or `coordinator-read` before review. A handoff over 256 KiB fails explicitly; use smaller pages or individual record reads. Do not treat a page as an exhaustive project summary.

Only coordinator profiles are listed in the execution collection. Older M3.3 runs remain supported by `workflow-read`; this phase does not migrate them. Standalone captures remain pending after a separate source-reference workflow uses them, as documented by the original capture contract. The handoff reports that distinction instead of silently marking them integrated.

## Continue existing work

Choose a run whose suggested operation is `session-continue`, save its current reference and a new executor identity:

```json
{
  "run_ref": { "id": "<current-run-id>", "revision": "<current-revision>" },
  "executor_id": "session-worker-001"
}
```

```bash
manu-control-center session-continue request.json /absolute/instance operation.json --actor local-user
```

Continuation verifies the expected revision, claims through the existing atomic coordinator and advances **one** knowledge-workflow step. Two callers cannot use the same revision; current permissions, pinned runtime, grants, budgets, source policy and fencing are rechecked by the existing handlers. A failure after claim may leave a lease until it expires; no hidden second ledger or automatic recovery claim is made.

An active lease suggests waiting. A pending draft requires exact review. Failed, blocked, expired, cancellation-pending and delivery runs require the relevant explicit coordinator operation; the convenience command does not renew grants, retry inference, approve, reconcile or deliver. If a recorded owner review already exists, continuation can apply that exact approval without another model call. Changed context may invalidate work when the coordinator advances; the view alone does not certify that an operation will succeed.

## Use from Codex

The repository includes [the operating skill](../.agents/skills/manu-control-center/SKILL.md), [operation reference](../.agents/skills/manu-control-center/references/operations.md), and a relocatable CLI helper. Codex supports repository skills under `.agents/skills`; the skill is also included in the npm tarball. It applies to operating an instance, while the root AGENTS file governs development. No global skill or personal profile is installed automatically.

For a checkout, build with `npm run build`. Explicitly invoke the skill by its path or use `$manu-control-center` where the host discovers it. Supply the binding once:

> Use the Manu Control Center skill. The request is `/absolute/request.json`, the instance is `/absolute/instance`, and the actor is `local-user`. Retrieve this project and continue its pending work within my existing authorization.

The user can write that request and receive explanations in Spanish. Structured keys, source quotes, stored content and approved bytes retain their original language. The M3.5 synthesis profile still produces English narrative; conversational translation does not rewrite it.

A copied skill uses `manu-control-center` on PATH, or the host's `MANU_CONTROL_CENTER_CLI` path to the installed JavaScript CLI. The helper invokes an argument array with no shell interpolation. It does not search private directories for bindings. Missing location/identity is the only setup information it needs to ask for; project purpose and pending work come from persisted state.

The conversational session uses a trusted shell-capable host to call the CLI. It has a different boundary from the tool-disabled M3.5 synthesis subprocess. Skill instructions guide operation and review but do not technically confine that host or prevent an owner from invoking other APIs. The coordinator continues enforcing its domain rules. Source text never becomes an authorization input. Actual fresh-session evidence demonstrates the observed behavior on synthetic data, not a universal prompt-injection defense or cross-runtime portability claim.

Official source: [Codex skills and discovery](https://learn.chatgpt.com/docs/customization/overview#skills).

## Verification

```bash
npm run check
npm run smoke:install
node examples/session-demo.mjs
node scripts/verify-session-codex.mjs prepare /absolute/new-synthetic-directory gpt-5.6-sol
node scripts/verify-session-codex.mjs observe /absolute/new-synthetic-directory gpt-5.6-sol
```

The installed demo uses fresh CLI processes and human-profile fixtures, without model credentials. Tests cover exact references, independent pagination, current permissions, redacted context, latest attempts, lease/deadline advice, byte limits, read-only database equality, review boundaries and stale continuation.

The real evaluator prepares both workflows with actual Codex synthesis, then opens a new ephemeral Codex session using the skill and only the host binding/user request. `observe` is read-only and must preserve database bytes. Independently inspect both complete drafts and record exact synthetic test-owner review before running `continue`; the script never fabricates approval. `continue` opens another fresh Codex session and verifies completed runs with unchanged artifact hashes. Provider events and answers remain in the private evidence directory. The public [verification report](m3.6-verification.json) records scope and hashes; [runtime evaluation](m3.6-runtime-evaluation.json) distinguishes actual behavior from mechanism tests. Synthetic approvals do not imply Manu approved personal content.

Manu's original foundation and saved plan remain intact. Personal binding/activation and first authorized source use are M3.7. A second runtime, scheduler and real external delivery remain outside this profile.

[Coordinator](coordinator.md) · [Codex synthesis](codex-runtime.md) · [Roadmap](implementation-plan.md)
