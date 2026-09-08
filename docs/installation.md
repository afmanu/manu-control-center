# Creating, inspecting and adopting an instance

M2 delivers the `foundation` profile of `project-knowledge-foundation@0.1.0-draft`: resolved configuration, a module catalog and a persistent project with a manifest and evidence. `verified` certifies this installation profile. The runtime remains `not_verified`; workflows arrive in M3.

## Create from a reviewable plan

Install dependencies and run `npm run build`. Copy [install-request.json](../examples/install-request.json) to define identity, owner and purpose. A trusted host must set `owner_id`; the local CLI does not authenticate remote accounts. `runtime` accepts `unconfigured`, `codex` and `claude-code` as future integration selections, without claiming executed capabilities. User-written purposes may remain in Spanish; use `--lang es` for localized help and error summaries. See [language behavior](language.md).

macOS example, with data outside the repository:

```bash
mcc_demo="$HOME/Library/Application Support/manu-control-center/instances/demo"
node dist/cli/main.js resolve examples/install-request.json "$mcc_demo"
node dist/cli/main.js plan examples/install-request.json "$mcc_demo" > /tmp/mcc-demo-plan.json
node dist/cli/main.js apply /tmp/mcc-demo-plan.json --actor local-user
node dist/cli/main.js verify examples/install-request.json "$mcc_demo"
node dist/cli/main.js inspect examples/install-request.json "$mcc_demo"
```

Use `node dist/cli/main.js` or the installed binary to redirect JSON to a file: `npm start` adds npm headers to stdout. Save the plan outside the directory being created. `resolve`, `plan` and `inspect` do not write to the destination; engine checks use disposable temporary databases.

`apply` explicitly authorizes the plan's operations for the specified actor and leaves `installed_unverified`. `verify` records a new report and changes the state to `verified` when required checks pass. `inspect` retrieves the project, state and evidence without modifying the database. A configured capability without a demonstrated invocation stays `not_run` in the manifest.

To resolve, apply and verify in one explicit invocation:

```bash
node dist/cli/main.js create examples/install-request.json "$mcc_demo" --actor local-user
```

The instance folder contains `store.sqlite`. Configuration, the two-module catalog and the initial project are created with `managed` ownership. Desired configuration and the applied plan are also recorded in construction state. Identities and revisions are independent of paths and visible purposes.

## Manu's foundation instance

M2 created and verified a local foundation with identity `manu` and project `manu-control-center`. It contains only the initial purpose of building this system; no personal sources have been imported and no model has been invoked.

- Editable request: `~/Library/Application Support/manu-control-center/configuration/manu.json`.
- Original plan: `~/Library/Application Support/manu-control-center/configuration/manu-installation-plan.json`.
- Instance: `~/Library/Application Support/manu-control-center/instances/manu`.

```bash
node dist/cli/main.js inspect "$HOME/Library/Application Support/manu-control-center/configuration/manu.json" "$HOME/Library/Application Support/manu-control-center/instances/manu"
```

The local identity `manu` is a reversible initial deployment choice, not an authenticated account. M3 will complete capture, queries, execution and agent use. Editing the request alone does not change the installation: a managed configuration difference requires explicit evolution. Repository translation preserves the original request, plan and stored catalog; it does not migrate this instance.

## Adopt an existing project

M2 adoption supports projects in the MCC SQLite backend with known identities and revisions. It does not import arbitrary folders, vaults, other engines or loose files. Those targets require ingestion/portability adapters.

1. Set the request's `instance_id`, `owner_id` and `project.id` to match the existing record.
2. Run `inspect` on its directory. Retrieve the exact project revision within the authorized scope.
3. Replace `adoption: null` with an explicit mapping:

```json
{
  "revision": "exact-observed-revision",
  "ownership": "user_owned"
}
```

4. Generate/review and apply the plan, or run `adopt <request.json> <directory> --actor <id>`.

Both `shared` and `user_owned` are supported. The plan reuses the project and preserves its content, ID, access, revision and history. It does not rename, normalize or overwrite its purpose with the request text. A project hidden from the actor, a stale revision or a type collision stops the operation. Replanning cannot promote an adopted resource to managed ownership.

## Interruption and recovery

Each resource and its checkpoint are saved in one SQLite transaction. If the transaction rolls back, both roll back; if committed, resumption checks the revision without creating a duplicate. `partial` identifies an incomplete application.

```bash
node dist/cli/main.js apply /tmp/mcc-demo-plan.json --actor local-user
node dist/cli/main.js resume examples/install-request.json "$mcc_demo" --actor local-user
```

Both paths preserve the original plan. `resume` requires the same request and retrieves the durable plan, which is useful after `create`. If a crash during a transaction leaves a journal, the authorized invocation lets SQLite recover it before continuing. The journal is not deleted. Read-only inspection reports this condition without repairing it.

Do not force a stale plan. If a resource changes before application, review the edit and generate a new plan. If a partial plan exists, retain its request and resolve its conflict before replacing it. M2 does not overwrite different managed configurations or implement version migrations; later phases expand evolution support.

## Technical scope and errors

- The local adapter uses SQLite rollback journaling, one host and a dedicated folder. It rejects WAL mode and sidecar files before opening an inspection to keep inspection free of writes. It does not automatically convert journal mode.
- Construction grants bind the actor, instance, plan hash, destination, effect and expiry. They come from the trusted host and are recorded with checkpoints; the plan hash checks integrity but does not sign or authenticate the issuer.
- Construction state, resources, verification reports and knowledge use separate tables in the same transactional database. No additional services are created.
- Automatic recovery covers resource operations on an initialized MCC store. A crash while initially creating the database format, before a valid MCC identity exists, is preserved for explicit repair; unknown files are not treated as replaceable.
- M2 has no invoked runtime, scheduler, export, distributed fencing or other-format importer. User sources remain outside this initial delivery.

Exit code 0: completed operation; 2: invalid arguments/JSON; 1: conflict, permission, capability or verification failure. Constructor errors are JSON lines with codes and details on stderr; the experimental `node:sqlite` warning may share that channel. Results and plans use JSON on stdout. Spanish adds an error summary while preserving canonical diagnostics.

Implementation: [planner](../builder/planner.ts), [local adapter](../adapters/interfaces/local/installation.ts) and [construction store](../adapters/backends/sqlite/installation.ts). Public exports are `manu-control-center/builder` and `manu-control-center/local`. File-mode checking follows the [official SQLite header](https://www.sqlite.org/fileformat.html#the_database_header).

[M2 evidence](m2-verification.json) · [Roadmap](implementation-plan.md) · [Home](../README.md)
