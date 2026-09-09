# Kit development

Main contains the K1 kit, source comparison and active K2–K4 delivery plan. Follow [repository instructions](../AGENTS.md), the [conversion plan](kit-conversion.md) and the [handoff](handoff.md).

## Checks

```bash
python3 scripts/check_docs.py
python3 scripts/test_kit.py
git diff --check
```

The dependency-free documentation check validates local Markdown links, heading anchors and code fences. CI runs that check and seven focused installation checks: preview, adoption/repetition, conflicts, symlink routes, partial-copy recovery, generated resources and distribution separation. These deterministic checks do not execute the skills, validate external URLs or prove useful agent behavior. Verify each delivered work procedure in actual bounded host sessions.

No npm installation, build, database or application test suite is required on main. There is no generated package manifest: ordinary files and Git describe the kit. K4 will verify release packaging and a second host.

## Real Codex checks

Use disposable synthetic workspaces and the kit entry. A representative invocation is:

```bash
codex exec --ignore-user-config --ephemeral --sandbox workspace-write \
  --skip-git-repo-check -C /absolute/path/to/synthetic-workspace \
  --json -o /absolute/path/to/result.txt - < /absolute/path/to/prompt.txt
```

Store prompts, logs and test outputs outside the distribution. Run a fresh process for continuity, and compare before/after files for read-only and no-save cases. Do not embed a custom runner or authentication material in the kit. Host credentials and host-owned state are supplied by Codex; they are not kit dependencies or a kit database.

Codex's documented repository discovery uses `.agents/skills/`. The installer generates those four entry copies from `kit/skills/`, adjusting relative resource links to `.mcc/kit/`; edit the canonical definitions only. Keep skill identity and resource checks distinct from actual exercised behavior. Official documentation checked on 2026-09-09: [building skills](https://learn.chatgpt.com/docs/build-skills) and [non-interactive execution](https://learn.chatgpt.com/docs/non-interactive-mode).

## Application archive

The complete former application is preserved on [`archive/application-m4.1`](https://github.com/afmanu/manu-control-center/tree/archive/application-m4.1) at commit `9fdf92ff919615c0efdf3b71710038b699b57404`. Its README, development guide, lockfile, tests and CI remain together. Use a separate checkout for any future application maintenance. Do not merge it back into main as part of kit work.

Local ignored build/dependency folders were moved out of the main checkout during separation; the installed personal application was untouched. Git history remains intact, so older commits can still contain application code even though the current main tree does not.

[Home](../README.md)
