# Update installed kit instructions without losing personal work

Use the selected new distribution and the user's intended workspace. Read its instructions, route map, installed `.mcc/kit/VERSION` and any prior update record. Use the new distribution's `mcc-improve` procedure when the installed version lacks it. Do not change personal notes, context routes, custom skills or host rules merely to resemble defaults.

## Compare before replacing

Establish the old baseline from a trusted, unchanged copy of the installed release or a verified Git commit whose `kit/VERSION` matches the installed version. The installed kit is the **current working copy**, not proof of the old baseline: it may contain customizations. The new distribution is the incoming version. Check actual file contents in all three. If no trusted old baseline is available, preserve differences and record review proposals; do not guess original bytes from a version label or download arbitrary code.

Record a reviewable comparison in the existing maintenance location, or `.mcc/maintenance/update-<target-version>.md`: installed/target versions, baseline origin, file/action/reason, customizations, unresolved conflicts, checks and progress. Reuse this record on repeat attempts; retain meaningful prior outcomes. Compare generated core skill entries using the same resource-path transform as the copier, not raw equality with canonical files.

| Comparison | Treatment |
|---|---|
| Current equals incoming | Keep; already done. |
| Current equals old baseline, incoming differs | Eligible for an authorized update; keep a recoverable copy before replacement. |
| Current differs from old, incoming equals old | Keep the local customization; upstream did not change it. |
| Both current and incoming differ from old | Preserve current; review a merge or leave an additive proposal/conflict. Do not silently replace it. |
| Incoming is new and destination absent | Add if needed by the selected version and within scope. |
| Destination contains an unexpected file or symlink | Preserve and report the collision. |
| Old file is absent from incoming | Retain; no automatic deletion during update. |

## Apply the reviewed scope

Apply unambiguous authorized file updates/additions with the host's ordinary tools; avoid broad directory replacement. Back up only files to be changed, under the private maintenance folder, before writing. A reviewed merge can retain local edits when the user has authorized it; if the user requests leaving custom files unresolved, honor that constraint. Do not ask again for routine changes already authorized by the update request. Report a real conflicting choice only when the user's intent cannot resolve it.

Maintain canonical core resources and their generated `.agents/skills/` entries together. If the host protects a discovery directory, use its approved write/approval path; otherwise stop those writes and record the exact pending mirrors. Do not bypass the restriction or report a complete installation from canonical files alone. Preserve personal extensions in `.mcc/skills/` and unrelated host entries. Existing `AGENTS.md`, workspace/context/connection files are personalized: make only a needed additive route/status edit, never recopy their templates. The supplied `install.py` remains a non-overwriting copier for initial setup and missing-file recovery; do not delete files to make an upgrade pass it.

Read back updated resources and run a small relevant retrieval/workflow check. Mark the target version complete only when required files and mirrors are coherent and any custom merge is resolved/accepted. Otherwise retain the last completed version marker, state the target and partial/mixed status in the update/workspace record, and list exact pending files. An intentional local-only customization is not automatically a conflict. A repeat attempt recognizes already applied files, preserves remaining customizations and does not duplicate backups or restart completed work. If interrupted, use the recorded comparison and backups to resume or recover only affected files. No database, service, migration engine or package installation is required.
