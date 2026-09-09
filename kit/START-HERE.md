# Start your AI OS

Open this kit with Codex and ask it to set up Manu Control Center in a separate personal folder, or adopt an existing workspace. Include the destination if you know it. The agent reads [mcc-setup](skills/mcc-setup/SKILL.md), reuses context you already supplied and asks only for essential missing information.

For example:

> Set up my AI OS in a separate personal workspace. Reuse what I have told you about my priorities and tools, preserve existing files, then prepare a project action brief from a source I choose.

The kit needs a file-capable agent. The optional installation helper needs Python 3.9 or newer, with no packages. It copies the kit and six local skills; it does not start another agent, install dependencies, create databases, connect accounts or schedule work.

Preview from this kit directory:

```bash
python3 scripts/install.py /absolute/path/to/personal-workspace
```

After the destination is selected, the agent can apply the same command with `--apply`. Setup then personalizes the ordinary Markdown route/context files and checks a first useful task. Copying files alone is not completed onboarding.

Open the personal folder in Codex for daily use. Ask naturally, or mention `mcc-context`, `mcc-capture`, `mcc-project`, `mcc-link` or `mcc-synthesize`. If newly installed skills do not appear in the current session, open a fresh session; the workspace entry also provides exact skill paths.

K2 supplies setup/adoption, resumable context interviews, corrections with history, local/URL capture, project and meeting briefs, meaningful links, synthesis, resurfacing and scoped work areas. Audits, skill building, upgrade merging, other agents, the explorer and scheduling remain later deliveries. Existing unrelated skills and workspace rules are preserved.

For an existing K1 installation, preview first. Different kit-owned files are preserved and reported as conflicts; do not delete personal files or overwrite customized instructions to force an upgrade. K3 will supply the update/merge procedure. A separate disposable folder can try this version now.

Use the [synthetic example](examples/README.md) to try K1 without personal information. See [operating guidance](operating-guide.md) for the shared behavior. The kit is in English; interaction and personal notes can use your preferred language.
