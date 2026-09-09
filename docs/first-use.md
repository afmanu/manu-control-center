# First use and operational profiles

M3.7 connects an existing foundation to the operating CLI and Codex skill through editable host configuration. It does not replace the construction request, catalog, original plan or instance identity. Personal configuration, the operating workspace and captured knowledge stay outside the distribution repository.

## Create a profile for an existing instance

Use the foundation's saved request, instance directory and owner:

```bash
manu-control-center profile-create /absolute/request.json /absolute/instance /absolute/configuration/operational.json --actor local-user --model gpt-5.6-sol --lang es
manu-control-center profile-inspect /absolute/configuration/operational.json
manu-control-center use /absolute/configuration/operational.json session
```

The destination parent must already exist. Creation publishes a complete private file without replacing an existing destination. Repeating the same creation returns its existing profile; changed options require an explicit edit or a new profile path. An unrelated file, symbolic link, changed profile or original request is not overwritten. Inspection opens the existing instance read-only and does not authenticate or invoke Codex.

`operational_profile` format 1 contains the absolute request path and exact byte hash, instance directory and identity, project, owner, `language` (`en`/`es`) and the pinned Codex adapter plus optional model. Edit the language and model as needed. A null model selects the CLI default; an explicit model overrides the ambient model environment for that command only. The existing M3.5 CLI-version guard still applies. Invalid fields, unsupported runtime versions, changed request bytes or mismatched owner/instance/project fail before a command can operate.

The profile is trusted host configuration, not a grant or a sandbox. It contains no credential value and does not change the user-managed Codex login. Its content hash detects which configuration was inspected, not who authorized it. Editing the saved construction request is not a supported way to activate or update an existing foundation. Wider maintenance and binding migration remain M5.

## Create a dedicated operating folder

```bash
manu-control-center profile-workspace /absolute/configuration/operational.json /absolute/new-operating-workspace
```

The new folder contains:

- `AGENTS.md`: the host binding and operating scope.
- `START-HERE.md`: a short guide in the configured language.
- `mcc.mjs`: an argument-based launcher for the installed CLI and profile.
- `.agents/skills/manu-control-center`: the operating skill and its private CLI location binding.

Open this folder in Codex and ask it to retrieve your project. There is no need to repeat the instance paths in each conversation. Alternatively invoke the skill explicitly. From its terminal:

```bash
node mcc.mjs session
```

The workspace generator never overwrites an existing directory. User edits remain untouched. If file creation fails midway, inspect the visible partial directory and use a new destination; no destructive automatic repair is performed. The launcher and copied skill point to the package that generated them, so keep that installed version available. No global skill, shell profile or PATH is modified. Product upgrades are a separate explicit operation.

## Ingest only selected material

```bash
node mcc.mjs capture meeting-notes --key meeting-notes-001 --file /absolute/authorized-notes.txt
node mcc.mjs search prototype
```

Use text or a UTF-8 file that the user supplied or authorized. Nothing watches or scans folders. Updating an existing source requires its current revision, and identical retries keep their request key. The original file is read, not edited. A model-generated summary is not permission to ingest additional material.

Ask Codex to prepare a meeting brief or project status. The skill uses the existing [workflow operations](../.agents/skills/manu-control-center/references/operations.md), with `use <profile>` replacing repeated request/directory/actor arguments. For example:

```bash
node mcc.mjs coordinator-submit operation.json
node mcc.mjs session
node mcc.mjs session-continue continuation.json
```

`use` supports the existing knowledge, workflow, coordinator and session operations. Construction, nested profiles and actor/model overrides inside the operation are rejected. A global explicit `--lang` can override presentation for one command; stored keys and data are unchanged. Arguments that merely look like flags remain data in supported positional/text slots.

The owner reviews the exact generated artifact before acceptance. First-use activation does not fabricate that approval. A personal draft may correctly remain `waiting_input` after installation is complete. The generated [session handoff](sessions.md) explains its next action; a new session can continue already reviewed work without regenerating it. External delivery remains simulator-only.

## Verification and scope

```bash
npm run check
npm run smoke:install
node examples/profile-demo.mjs
node examples/profile-demo.mjs /absolute/new-synthetic-evidence gpt-5.6-sol
node scripts/verify-profile-session.mjs /absolute/new-synthetic-evidence/workspace gpt-5.6-sol
```

The default demo completes both human-profile workflows with explicit synthetic fixture review; clean installation runs it from the tarball without model credentials. With a model argument, it invokes actual Codex through the profile and leaves both exact drafts for independent inspection. Synthetic test-owner review is separate from personal user approval. The fresh-session evaluator supplies only a natural-language request and operating directory; the profile binding must come from generated workspace instructions.

Personal activation is performed only after synthetic checks. Installing the product and creating the profile/workspace must preserve the original request, plan and foundation database bytes. A subsequent authorized personal workflow can add C19 work and a draft; its execution evidence is separate from M2 foundation verification. No personal source import is implicit.

The [M3.7 verification](m3.7-verification.json) records the delivered scope. Runtime and first-use evidence remain private when they contain user content; public reports expose only the necessary synthetic results and non-content checks. This is a local interactive pilot, not a scheduler, second backend/runtime or real delivery integration.

[Sessions](sessions.md) · [Codex synthesis](codex-runtime.md) · [Installation](installation.md) · [Roadmap](implementation-plan.md)
