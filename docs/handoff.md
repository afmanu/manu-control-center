# Kit development handoff

Updated: 2026-09-09. **Main is dedicated to the kit. The application has been archived on its own branch. K1–K4 implementation remains pending.**

## Current task and outcome

Manu requested moving all application material out of main into a branch, followed by a quality comparison against AIS-OS and his Second Brain. The [quality-gap review](quality-gap-review.md) records observed plan coverage, source evidence and recommendations for discussion. It does not install features or automatically expand scope.

The branch [`archive/application-m4.1`](https://github.com/afmanu/manu-control-center/tree/archive/application-m4.1) was created and published at `9fdf92ff919615c0efdf3b71710038b699b57404` before any removal. Its remote ref matched the original main commit. It preserves application code, npm dependencies/lockfile, schemas, operating skill, tests, CI, historical specifications, source analyses and execution evidence. The previous decisions and full handoff remain there.

Main removes those application files and the generated inventory. Shared repository entry documents now describe only the kit; language/development guidance and CI use a dependency-free Python documentation check. Local ignored build/dependency folders were moved outside the checkout. The original vault and the installed private application, including its earlier draft, were not edited. No force push or history rewrite is involved.

## Source review

Both public reference clones were fetched and their inspected HEAD matched origin/main: AIS-OS `ce9cb93a1145da5daba84ea37208ec35fd03606e`; installer `9cb05973a04b6e2b945fac591ccec8bf6f43f85c`. Relevant manuals, command/skill definitions, connection and expansion guidance were read. Selected local vault protocols, templates and knowledge patterns were also inspected read-only. Only generalized findings and system-file locators appear publicly; no private source content was imported.

Key proposed refinements: concrete source/connection registry; correcting and superseding memory; typed links and complete navigation; consolidation review; building selected new skills; artifact reuse/lifecycle; scoped retention; decision outcome review; and skill discovery/resource checks. Existing setup, capture, synthesis, continuity, audit and explorer targets remain planned, not implemented. No reference skills or integrations were executed for this review.

## Next action

Discuss or incorporate Manu's chosen recommendations from [quality-gap-review.md](quality-gap-review.md). Do not present the recommendations as approved features. The existing [K1 target](kit-conversion.md) remains the first implementation stage: ordinary-file setup/adoption, capture/retrieval and fresh-session continuity with Codex. No further platform architecture phase is required.

Preserve English repository content, Spanish interaction, source attribution and private-workspace separation. Use synthetic inputs and disposable workspaces for implementation checks. Source access is not authorization to publish private notes, configure services or activate schedules.

## Checks

`python3 scripts/check_docs.py` passes for 11 Markdown files and 45 local links, both in the checkout and in a clean export of the staged tree. A temporary valid-link case and four rejection cases (missing target, missing heading, unclosed fence and non-portable local path) pass. `git diff --check` and the staged equivalent pass.

Separation checks confirm that all 168 removed tracked files exist in the preserved archive commit. The new main index contains 15 files, no application source/test/schema/skill directories and no npm package, lockfile, TypeScript configuration or former inventory. LICENSE bytes match the archive. The first clean-export helper used a tar API unavailable in the local Python version; the helper was corrected to write only inspected regular files/directories and the clean-tree check passed. This did not affect repository files.

Application tests were not rerun on main because the application now belongs on its own branch. These separation and documentation checks do not establish kit usability or execution of source-system capabilities.
