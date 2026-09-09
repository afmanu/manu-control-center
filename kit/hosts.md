# Host entries and effective skills

Choose Codex, Claude Code or both during setup. `install.py --host codex|claude|both` copies one shared `.mcc/kit/` snapshot. It generates Codex entries in `.agents/skills/` and Claude entries in `.claude/skills/`, plus a personal `AGENTS.md` or `CLAUDE.md` if absent. Existing instructions are preserved for the agent to adopt. The default remains Codex.

Generated definitions have the same names and procedure text. Both adjust `(../../` resource links to `(../../../.mcc/kit/`; Claude also translates literal `.agents/skills/` references to `.claude/skills/`. No model, provider, permissions, hooks, MCP or global settings are installed. A second host uses the same personal notes and `.mcc/skills/` canonical extensions. Expose a personal extension in the selected host's skill directory with a resolving symlink or a documented generated resource transform; preserve collisions.

## Diagnose actual discovery

Read the active host entry and the instructions applicable to the selected subfolder. Inspect known skill locations before invoking a name. Run `python3 <installed-kit>/scripts/check_workspace.py <absolute-workspace> --host <codex|claude|both>` for core drift, missing resources and duplicate names in the selected local entries. `--scope <relative-folder>` lists relevant local instruction candidates; `--skill-root <absolute-folder>` adds an explicitly selected location to the identity check. It never scans the user's home automatically or edits anything. It cannot enumerate all managed/global/plugin settings or prove host selection from files alone.

Distinct definitions sharing a name are ambiguous until their effective host precedence and intended scope are established. Two symlinks to the same canonical directory are one source. Do not silently delete or overwrite a conflicting definition, or pretend the kit definition ran because it exists. Report the exact paths and choose an explicit intended route only when the user's request resolves it. Intentional scoped instructions apply to their area; preserve global context and do not generalize local rules to other projects.

After installation, start a fresh host session and ask for a useful sourced deliverable. Confirm which definition/resources it used, inspect the result, and resume the same workspace with the other host. Keep installed, discovered and exercised evidence separate. Missing input/resource: explain the precise gap, preserve prior outputs, restore a missing core resource from the trusted same-version distribution through the non-overwriting copier, then retry only the affected work. A custom conflicting resource needs reviewed comparison, not forced replacement.

Official documentation checked on 2026-09-09: [Codex skills](https://learn.chatgpt.com/docs/build-skills), [Claude skills](https://code.claude.com/docs/en/skills), [Claude programmatic use](https://code.claude.com/docs/en/headless). Host versions differ; the [capability table](capabilities.md) states actual exercised coverage.

When opening a nested folder directly, do not assume the host found parent skills or context. Prefer opening the workspace root, or provide explicit relative routes from scoped instructions to the shared entry, skill and project hub. Verify retrieval in a fresh session; a printed scoped marker alone does not prove shared discovery.
