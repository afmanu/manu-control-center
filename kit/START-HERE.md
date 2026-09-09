# Start your AI OS

Open this kit with Codex (verified) or Claude Code (entry supplied; execution verification pending) and ask it to set up Manu Control Center in a separate personal folder, or adopt an existing workspace. Include the destination if you know it. The agent reads [mcc-setup](skills/mcc-setup/SKILL.md), reuses context you already supplied and asks only for essential missing information.

For example:

> Set up my AI OS in a separate personal workspace. Reuse what I have told you about my priorities and tools, preserve existing files, then prepare a project action brief from a source I choose.

The kit needs a file-capable agent. The optional installation helper needs Python 3.9 or newer, with no packages. It copies the kit and nine local skills; it does not start another agent, install dependencies, create databases, connect accounts or schedule work.

Preview from this kit directory:

```bash
python3 scripts/install.py /absolute/path/to/personal-workspace --host codex
```

Choose `--host claude` or `--host both` for the corresponding generated entries. See [host guidance](hosts.md) and [capability status](capabilities.md).

After the destination is selected, the agent can apply the same command with `--apply`. Setup then personalizes the ordinary Markdown route/context files and checks a first useful task. Copying files alone is not completed onboarding.

Open the personal folder in Codex for daily use. Ask naturally, or mention `mcc-context`, `mcc-capture`, `mcc-project`, `mcc-link`, `mcc-synthesize`, `mcc-audit` `mcc-improve` or `mcc-brain`. If newly installed skills do not appear in the current session, open a fresh session; the workspace entry also provides exact skill paths.

K3 adds evidence-based audits, verified repairs, consolidation proposals, selected skill building, daily/weekly and decision reviews, reusable SOPs and customization-preserving updates to the K2 work and knowledge cycle. K4 adds Claude entries, local discovery diagnostics, the optional [3D view](explorer/README.md) and [native scheduling recipes](scheduling.md). Required host and due-execution checks remain open; consult the capability table before assuming compatibility.

For an existing installation, use `mcc-improve` from the new distribution and follow [the update procedure](update.md). Supply the selected workspace and a trusted original release snapshot when available. It compares old, current and incoming files, preserves personalizations and records any unresolved conflicts. The initial copy helper still refuses to overwrite different files; do not delete custom instructions to force installation.

Use the [synthetic example](examples/README.md) to try K1 without personal information. See [operating guidance](operating-guide.md) for the shared behavior. The kit is in English; interaction and personal notes can use your preferred language.
