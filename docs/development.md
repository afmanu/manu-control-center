# Kit development

Main contains the K4 kit candidate, source comparison and active delivery plan. Follow [repository instructions](../AGENTS.md), the [conversion plan](kit-conversion.md) and the [handoff](handoff.md).

## Checks

```bash
python3 scripts/check_docs.py
python3 scripts/test_kit.py
python3 scripts/test_explorer.py
git diff --check
```

The dependency-free documentation check validates local Markdown links, heading anchors and code fences. CI runs that check and nine focused installation checks: preview, adoption/repetition, conflicts, symlink routes, partial-copy recovery, generated resources and distribution separation. These deterministic checks do not execute the skills, validate external URLs or prove useful agent behavior. Verify each delivered work procedure in actual bounded host sessions.

No npm installation or database is required for kit use. The optional viewer needs Node 22+; its two focused tests check graph/source preservation and rejected symlink outputs. Its prebuilt JavaScript is bundled. Rebuilding only that renderer uses its isolated package manifest and lockfile. See [release packaging](release.md) and [K4 evidence](k4-verification.md).

## Real Codex checks

Use disposable synthetic workspaces and the kit entry. A representative invocation is:

```bash
codex exec --ignore-user-config --ephemeral --sandbox workspace-write \
  --skip-git-repo-check -C /absolute/path/to/synthetic-workspace \
  --json -o /absolute/path/to/result.txt - < /absolute/path/to/prompt.txt
```

Store prompts, logs and test outputs outside the distribution. Run a fresh process for continuity, and compare before/after files for read-only and no-save cases. Do not embed a custom runner or authentication material in the kit. Host credentials and host-owned state are supplied by Codex; they are not kit dependencies or a kit database.

Codex's documented repository discovery uses `.agents/skills/`. The installer generates those nine entry copies from `kit/skills/`, adjusting relative resource links to `.mcc/kit/`; edit the canonical definitions only. Keep skill identity and resource checks distinct from actual exercised behavior. Official documentation checked on 2026-09-09: [building skills](https://learn.chatgpt.com/docs/build-skills) and [non-interactive execution](https://learn.chatgpt.com/docs/non-interactive-mode).

## Application archive

The complete former application is preserved on [`archive/application-m4.1`](https://github.com/afmanu/manu-control-center/tree/archive/application-m4.1) at commit `9fdf92ff919615c0efdf3b71710038b699b57404`. Its README, development guide, lockfile, tests and CI remain together. Use a separate checkout for any future application maintenance. Do not merge it back into main as part of kit work.

Local ignored build/dependency folders were moved out of the main checkout during separation; the installed personal application was untouched. Git history remains intact, so older commits can still contain application code even though the current main tree does not.

[Home](../README.md)


## K2 verification scope

K2 extends the same canonical-skill/resource checks to six skills. Verify context pause/resume/correction, contradictory sources, synthesis, relationships, source reuse, public output scope and project/meeting continuity in fresh synthetic sessions. Keep each accepted artifact and unrelated project under before/after file comparison.

URL intake uses the host's existing access. For a bounded HTTP fixture, the CLI invocation can add `-c sandbox_workspace_write.network_access=true` for that process only; never modify the user's persistent configuration for a test. Bind the synthetic server to loopback, keep its files outside the kit, verify successful and inaccessible responses and stop it afterward. This optional test fixture is not a kit service. The setting was checked against the [official configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference) on 2026-09-09. No account connection is implied.

## K3 verification scope

Exercise audit findings and repair through the declared route, preserving IDs and untested findings. Compare protected source/accepted/unrelated files by hash. Build one selected personal skill with its canonical resources, verify discovery/use in a fresh Codex session, and repeat a matching request without duplicating the capability. Verify dated daily/weekly and decision reviews, pending outcomes and fresh SOP retrieval.

For updates, prepare a trusted unchanged baseline from the prior release, a deliberately customized installation and the incoming kit. Follow [the agent-operated update procedure](../kit/update.md); the installer intentionally does not overwrite conflicts. Check a repeat attempt, local-only changes, generated mirrors, recoverable backups and honest partial-version status. Do not place the temporary comparison scripts, synthetic notes or host logs in the distribution. These are bounded practical checks, not a new maintenance engine.

A non-interactive sandbox may protect host discovery directories such as `.agents/skills/`. Use the host's approved write path for the exact authorized entries or retain a pending result; do not disable the boundary silently. Record any approved outer-host installation step separately from fresh-session discovery and useful execution.
