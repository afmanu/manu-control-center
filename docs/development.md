# Developing the foundation and local knowledge tools

Primary repository: [afmanu/manu-control-center](https://github.com/afmanu/manu-control-center). Builder documentation has been integrated here while preserving the initial history and MIT license. Earlier folders are migration background; subsequent changes are maintained in this repository.

## Development installation

Requirements: Node.js 24, at least 24.14.1; npm. The tested version is pinned in `.nvmrc` and dependencies in `package-lock.json`.

```bash
git clone https://github.com/afmanu/manu-control-center.git
cd manu-control-center
nvm use
npm ci --ignore-scripts --no-audit --no-fund
npm run check
```

`nvm use` applies to nvm installations. Another manager providing the `.nvmrc` version may be used. GitHub authentication uses environment credentials; the repository is private.

## Available commands

```bash
npm start -- --help
npm start -- --lang es --help
npm start -- --version
npm start -- doctor
npm start -- validate-record examples/record-envelope.json
npm start -- contracts
npm start -- validate eval_fixture examples/meeting.json
npm start -- validate-bundle examples/contracts/construction-bundle.json
```

After code changes, `npm run build` recompiles. `npm test` compiles and runs contract, state, permission, SQLite, constructor, recovery, CLI and evaluation harness tests. `npm run check` adds generated-schema comparison and documentation checks. `npm run typecheck` checks types without generating files. Repository content is English; [runtime localization](language.md) is independent of user data and machine protocols.

`doctor` creates a temporary database, tests conditional writes between two connections, stale-revision rejection, rollback and persistence after reopening, then removes test data. It returns JSON and exit code 0 when all these checks pass. It shows the intended data location without creating it. **It does not verify a complete backend, agent permissions or an instance.**

`validate-record` checks only [RecordEnvelope](../schemas/record-envelope.schema.json) metadata: identity, instance, opaque revision, contract version and valid UTC timestamps. It rejects extra fields and updates preceding creation. Valid metadata does not establish an authorized entity or validate instance/meeting examples. Exit code 0: valid; 2: invalid arguments/data; 1: diagnostic or environment failure.

`contracts` lists the 22 contracts. `validate <kind> <file.json>` checks structure and invariants; `validate-bundle <file.json>` checks consistency between the need, blueprint, modules, specification, plan and manifest. Neither executes plans. Results summarize validity and errors without dumping content or fixture expectations.

The M3.1 [knowledge guide](knowledge.md) covers capture, source/history retrieval, search and context. The M3.2 [review guide](review.md) covers authority, temporal selectors, artifacts and the runnable `node examples/review-demo.mjs` example. The M3.3 [workflow guide](workflows.md) covers `workflow-prepare`, `workflow-read`, `workflow-complete` and `node examples/workflow-demo.mjs`. The M3.4 [coordinator guide](coordinator.md) covers leases, steps, effects and `node examples/coordinator-demo.mjs`. The M2 constructor commands and Manu deployment are in the [installation guide](installation.md). `resolve`, `plan` and `inspect` do not write to the destination; `apply`, `verify`, `create`, `adopt` and `resume` perform their explicit operations. To produce a JSON plan file, use the installed binary or `node dist/cli/main.js`, without the headers emitted by `npm start`.

## Library and schemas

The package exports the core from `manu-control-center`, the backend from `manu-control-center/sqlite`, the harness from `manu-control-center/evals`, the resolver from `manu-control-center/builder` and local construction from `manu-control-center/local`. M3.1 adds the local knowledge entry points at `manu-control-center/knowledge` and `SqliteKnowledgeBackend` at `manu-control-center/sqlite-knowledge`; see [API and limits](knowledge.md). M3.2 exports local review at `manu-control-center/review` and `SqliteReviewBackend` at `manu-control-center/sqlite-review`. M3.3 exports local workflows at `manu-control-center/workflows`, `SqliteWorkflowBackend` at `manu-control-center/sqlite-workflows`, and neutral workflow types/definitions from the core. M3.4 exports `manu-control-center/coordinator`, `manu-control-center/sqlite-coordinator` and the identified `manu-control-center/simulated-mailbox` target. JavaScript example for a consumer with the package installed:

```js
import { SqliteBackend } from 'manu-control-center/sqlite';

const backend = new SqliteBackend(':memory:');
try {
  // The host sets this identity; never take it from a source or an LLM response.
  const store = backend.forScope({ instance_id: 'demo', actor_id: 'local-user' });
  const project = store.create({
    schema_version: '0.1.0-draft', kind: 'project', id: 'project-1', instance_id: 'demo',
    access: { owner_id: 'local-user', readers: [], writers: [] },
    data: { purpose: 'Synthetic project', status: 'active', responsible: 'local-user',
      next_action: null, decision_refs: [], source_refs: [] },
  });
  const updated = store.update({ ...project, data: { ...project.data, next_action: 'Add a source' } }, project.revision);
  console.log(updated.revision, store.history(project.id).length);
} finally {
  backend.close();
}
```

For persistence, the SQLite constructor takes a dedicated database path. The direct SQLite API requires the parent folder to exist; the M2 constructor's `create`/`apply` prepares it outside the distribution. The scoped API requires a trusted host and does not authenticate users itself. Read [M1 implementation](m1-implementation.md) before connecting a runtime.

Schema sources are [schema-definitions.ts](../core/schema-definitions.ts) and [planner.ts](../builder/planner.ts), which adds the installation request. After changing a schema together with types and validation:

```bash
npm run schemas:write
npm test
npm run manifest:docs
npm run check
```

Do not manually edit generated JSON: `check` detects divergence. Contracts remain drafts; shape changes must record their decision and affected fixtures/tests.

## Data location

The local adapter resolves a location outside the distribution:

| Platform | Default location |
|---|---|
| macOS | `~/Library/Application Support/manu-control-center` |
| Linux | `$XDG_DATA_HOME/manu-control-center` if XDG is absolute; otherwise `~/.local/share/manu-control-center` |
| Windows | `%LOCALAPPDATA%/manu-control-center`, falling back to the user's local directory |

`MANU_CONTROL_CENTER_DATA_DIR` accepts another absolute path. `doctor` only shows this configuration; constructor commands take an explicit absolute directory and create the instance there. Manu's foundation uses the default local directory. M1–M2 test identity and access boundaries. Secrets, databases and real runs remain outside the package and repository.

Initial operational state has one responsible host. Code may live in a synced folder; SQLite file synchronization is not used for coordination between machines. Transfers will use export/import and authority transfer in M4.

## Clean installation and packaging

```bash
npm run smoke:install
npm pack
```

The clean test requires an earlier `npm ci` using the same npm cache. It copies sources to a temporary folder, installs from the lockfile offline, compiles and repeats the tests. It then packs and installs the archive in another folder **with an empty consumer cache and npm registry access**, checking the version, diagnostic, contract/bundle validation, installed command, localized help, and public core, SQLite, eval and builder imports. It also creates, verifies and inspects an instance, captures a packaged synthetic UTF-8 file, updates/replays a source and checks search, history, exact versions and context from the installed package. It then runs the installed review demonstration, checking decision authority, time, grant revocation, exact artifacts and source preflight. Temporary folders and the consumer cache are removed afterward. When needed, pass `--cache /path/to/cache` to npm for the source installation.

Package installation must resolve dependencies as a new consumer would. A cache populated by `npm ci` may contain dependency archives without registry metadata; the second check therefore does not assume an offline package installation is possible.

`npm pack` creates a local archive; it does not publish it. The package retains `private: true`. These commands install the development foundation, M2 constructor and M3.1 local knowledge commands; full system use with an agent arrives in M3.

## Documentation and evidence

After reviewing a documentation change:

```bash
npm run manifest:docs
npm run check:docs
```

The root manifest inventories documentation and schemas, not all code. Earlier manifests in `references/` are historical and retain their original file hashes. Checks validate JSON, local Markdown file links, code fences and component/scenario/phase coverage; they do not fetch external links or check section anchors.

[GitHub Actions](../.github/workflows/ci.yml) runs the same checks and clean installation. [M2 evidence](m2-verification.json), [M0](m0-verification.json) and [M1](m1-verification.json) preserve milestone results. The [handoff](handoff.md) records current phase status and subsequent verification. Translation provenance and retained historical hashes are explained in [language.md](language.md).

## Current technical limitations

In Node 24.14.1, `node:sqlite` emits an experimental warning. It is isolated in the reference adapter and disposable diagnostic. The backend tests local storage, permissions and history; it does not implement export or distributed fencing. The diagnostic does not suppress the warning.

Codex is the first candidate and Claude Code the second because their executables were observed. Models have not been invoked, sessions verified or product runtime adapters implemented. Default paths on other platforms do not establish tested installation there; evidence lists only environments actually exercised.

[Home](../README.md)

## Codex synthesis development

The optional `./codex` export implements RuntimeAdapter for the pinned Codex CLI. `node examples/agent-demo.mjs` and clean package checks use a marked mock; `npm run verify:codex -- /absolute/evidence-directory [model]` and `node examples/codex-demo.mjs /absolute/new-directory [model]` invoke the real runtime and retain synthetic drafts for independent review. They are opt-in and are not part of credential-free CI. See the [runtime guide](codex-runtime.md) and [M3.5 evidence](m3.5-verification.json).
