---
name: mcc-setup
description: Set up or adopt a personal Manu Control Center AI OS workspace, preserving existing conventions and personalizing context, sources and capabilities. Use for onboarding or resuming incomplete setup, not ordinary project work.
---

# Set up the AI OS

Read [shared guidance](../../operating-guide.md). The outcome is a usable personal workspace and a clear first useful task, not just copied files.

1. Establish the user-selected absolute destination and whether it is new or existing. Reuse information already given about role, priorities, language, projects and tools. Ask only for a missing destination or a fact needed to perform the first task; other unknowns can remain unknown. Do not start a generic questionnaire.
2. Inspect applicable instructions, context pages, hubs and relevant file names in an existing destination. Map functions to its existing structure; retain names, aliases and metadata (including Spanish equivalents). Do not import personal content into the public distribution or inspect unrelated private folders.
3. Use the [installation helper](../../scripts/install.py) to preview and then apply the selected local setup: `python3 <helper> <absolute-workspace> --apply`. The helper preserves editable workspace files and reports conflicting kit files instead of overwriting them. Follow a reported conflict; do not delete customized instructions to force installation. It may leave a partial installation on failure; rerun after correcting the specific cause. No new permission question is needed for an unambiguous destination already authorized by the setup request.
4. If the destination already has AGENTS.md, preserve its text and add a concise route to `.mcc/workspace.md` and `.mcc/kit/operating-guide.md` when an equivalent route is absent. If existing local rules conflict with the requested setup, explain the specific conflict rather than silently replacing them. Do not overwrite CLAUDE.md or claim Claude support.
5. Fill `.mcc/workspace.md` with the actual role/priority/context route, relevant project/hub, capture/output/session locations, user language and setup progress. Path values are relative to the personal workspace root. Keep existing canonical context in place; `.mcc/context.md` is a fallback, not a second truth store. Fill `.mcc/connections.md` or route to an existing register using the [connection template](../../templates/connections.md). Record available local evidence and unverified external routes honestly.
6. Verify the entry-to-context/source/project routes by reading them. Describe only the four shipped capabilities. Record setup as configured once installed instructions and declared routes work; record the first workflow separately as not run until an actual result exists. If a usable source and project task are already included in the request, continue through `mcc-capture` and `mcc-project`. Otherwise provide the ready-to-use first-task prompt and identify the missing input without inventing it.

On repeat setup, reuse the route map and completed steps; inspect before changing only what the user requested. Do not recapture a source, create a duplicate project or reset preferences merely because the installer ran again. The final reply links the personal entry and any actual deliverable, with remaining gaps.
