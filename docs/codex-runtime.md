# Codex workflow runtime

M3.5 connects the existing coordinator to Codex CLI. The product supplies authorized context; Codex returns classifications and cited narrative; the coordinator validates and checkpoints the response, then creates a draft through its existing local effect path. Exact human review still controls approval. Real delivery remains a separate M6 capability.

## Requirements and scope

- Node.js 24.14.1 and the package's locked dependencies.
- Codex CLI **0.146.0**, authenticated through its own supported login. The adapter rejects unverified CLI versions rather than guessing flag compatibility.
- The `foundation` instance already created by the constructor. No catalog replacement, database migration or private source import is implicit.

The adapter uses the existing Codex login, including a ChatGPT login; it does not require the product to store an API key. Availability inspection only checks the executable/version. Authentication and model access are established by an actual invocation. An executable alone is not operational verification.

`CodexRuntime` accepts a trusted host `model` option. The local CLI reads the optional `MANU_CONTROL_CENTER_CODEX_MODEL` environment variable; otherwise Codex selects its default. Provider aliases can resolve differently over time. Results record the requested identifier/default selection, CLI/adapter version, packet hash, output/event hashes, elapsed time and reported usage. An unreported resolved model ID or monetary cost is unknown, never fabricated.

## Run a workflow

First capture a source using the [capture guide](knowledge.md). Meeting synthesis accepts an exact existing source reference and empty selections; the model supplies classification. Project status uses the bounded persisted project, decision and claim context.

Save a meeting operation as `task.json`:

```json
{
  "workflow": "meeting-to-brief",
  "request_key": "agent-meeting-001",
  "source_policy": "fresh",
  "runtime": { "id": "codex", "version": "0.146.0-mcc.1" },
  "meeting": {
    "source": { "ref": { "id": "<captured-source-id>", "revision": "<captured-revision>" } },
    "selections": []
  }
}
```

For project status:

```json
{
  "workflow": "project-status",
  "request_key": "agent-status-001",
  "source_policy": "snapshot",
  "runtime": { "id": "codex", "version": "0.146.0-mcc.1" }
}
```

Use the existing [coordinator commands and lease payloads](coordinator.md):

```bash
manu-control-center coordinator-submit request.json /absolute/instance task.json --actor local-user
manu-control-center coordinator-claim request.json /absolute/instance claim.json --actor local-user
manu-control-center coordinator-advance request.json /absolute/instance lease.json --actor local-user
```

The first advance invokes Codex and pauses with a validated runtime checkpoint. Read the latest run, claim again, and advance to prepare the artifact. The draft includes the exact classified quotes, the model's narrative statements and citation mapping, deterministic project/knowledge data, and runtime provenance. Statement text is English in this initial profile; original quoted source text and stored identities retain their language. Spanish CLI help/error presentation remains available. Broader conversational localization belongs to M3.6.

Inspect the full draft and its sources. Submit the existing four-criterion `coordinator-review` payload, bound to its exact artifact revision/hash. After acceptance, claim and advance to complete. Model output has no field for approval, grants, commands or delivery. A meeting agreement remains reported meeting content; it does not activate a decision. A separately captured source is not automatically treated as an inline capture owned by this workflow.

New agent runs use `0.1.0-coordinated-agent`; the agent artifact producer uses `0.1.0-agent`. Original M3.3/M3.4 profiles remain compatible. There are eight durable steps, including a distinct inference step. All state stays in C19; the temporary Codex directory is transport, not another workflow ledger.

## Input, tools and output controls

The trusted host selects the runtime implementation and binds actor/project. Before transmission it checks current project/source/derived-record access, builds one bounded snapshot and issues an exact persisted runtime grant. The packet contains only task evidence, not the database path, grant authority, test expectations or a tool implementation. Input is limited to 64 KiB, retaining the existing maximum of 50 decisions, 50 claims and 100 supporting sources. Oversized context fails explicitly.

Codex runs from a fresh temporary directory with an output schema, `--ephemeral`, `--ignore-user-config` and the read-only sandbox. Fixed configuration disables shell execution, web search, apps, plugins, hooks, agent spawning, memory and other supported auxiliary surfaces. The process inherits only the small documented environment allowlist in the adapter; no parent conversation identity or app tool pipe is forwarded. The user's authentication remains managed by Codex. Managed environment policy is not bypassed.

The adapter bounds process time and captured output, kills the child on timeout/abort, requires one successful terminal event, rejects unexpected tool/action events, and removes its temporary files. Event rejection is a final acceptance check, not a way to undo an already executed tool. These are claims about the pinned, tested CLI profile, not a general sandbox against arbitrary runtimes, a hostile host or every future Codex version. Provider inference necessarily uses network access and may consume account usage.

The neutral validator enforces a closed output shape, complete non-whitespace transcript coverage, exact ordered quote spans and citation IDs from the packet. The host resolves references; the model cannot choose new sources or approve an artifact. A valid citation identity does not prove the narrative is semantically supported. Independent evaluation and human review remain necessary.

## Concurrency, freshness and failure

The coordinator reserves the inference step before starting it. A heartbeat checks the current lease, access, exact runtime grant and job deadline, renews current authority and requests process abortion if those checks fail. Output acceptance repeats the checks transactionally. A cancelled or superseded worker cannot attach a result or create an artifact.

Snapshot jobs build the artifact from the same pinned project/knowledge versions used for inference. Fresh jobs additionally reject changed versions or changed knowledge membership before dispatch, after inference and before artifact creation. Later invalidation uses the existing replacement-generation mechanism. Because agent inference consumes the whole snapshot, it invalidates the runtime step and all downstream preparation/review steps; the human profile retains its narrower dependency behavior. For a changed fresh transcript, `coordinator-revise` takes its current reference and empty selections in the agent profile, then performs new model classification. Replacement output requires new review. Renewed runtime grants can be issued through `coordinator-authorize`; revocation never expands context access.

Inference is a computation step, not a domain mutation or a simulated delivery Action. Its invocation requires an exact grant; all resulting artifact and approval mutations still pass through C21 Actions. A failed or interrupted inference may have consumed provider usage even when no draft exists. There is no inference billing idempotency claim. A takeover detects an unfinished runtime step and fails that attempt; an explicit bounded retry may invoke again. Validated completed output is reused without another model call. Cancellation prevents further artifact work, but cannot undo already consumed inference usage.

Step reservations, run-attempt limits and the original wall-clock deadline remain enforced. A runtime invocation has a maximum 180-second process timeout; heartbeats do not extend the job deadline. Numeric token/cost budgets are rejected because this CLI profile cannot enforce a hard generation cap or known monetary limit. Reported tokens are observations after a completed turn. Failed/interrupted usage and monetary cost may remain unknown.

## Verification and reuse

```bash
npm run check
npm run smoke:install
node examples/agent-demo.mjs
npm run verify:codex -- /absolute/synthetic-evidence-directory
node examples/codex-demo.mjs /absolute/new-cli-evidence-directory
```

The installed [agent demo](../examples/agent-demo.mjs) uses a clearly marked mock runtime for reproducible packaging tests; CI does not authenticate to a model. `verify:codex` invokes the real CLI against four existing meeting fixtures and a separate project-status case. It preserves synthetic stores and exact drafts for independent review. Fixture expected answers remain in the evaluator process; category checks and semantic review are reported separately. The [real CLI demo](../examples/codex-demo.mjs) uses a new transcript and fresh CLI processes, leaving exact drafts for review. The evidence directory must be private and outside the distribution. [Recorded model results and reviews](m3.5-runtime-evaluation.json) include calibration failures and the separate new-transcript check; they do not establish general model accuracy.

Public APIs: `manu-control-center/codex` exports `CodexRuntime`; the SQLite coordinator accepts a trusted runtime registry; the root export supplies neutral context/output validation and workflow definitions. Ordinary callers cannot register an implementation through source or CLI task JSON.

Official references: [non-interactive execution](https://learn.chatgpt.com/docs/developer-commands#codex-exec), [Codex configuration](https://learn.chatgpt.com/docs/config-file/config-reference). The installed CLI help and real invocation evidence determine this adapter's exact compatibility.

[Coordinator](coordinator.md) · [Roadmap](implementation-plan.md) · [Home](../README.md)
