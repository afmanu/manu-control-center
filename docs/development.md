# Kit development

Main contains the kit's preparation and source comparison. K1–K4 implementation is pending. Follow [repository instructions](../AGENTS.md), the [conversion plan](kit-conversion.md) and the [handoff](handoff.md).

## Checks

```bash
python3 scripts/check_docs.py
git diff --check
```

The dependency-free documentation check validates local Markdown links, heading anchors and code fences. CI runs the same check. It does not execute the planned skills, validate external URLs or prove useful agent behavior. Add focused behavior checks with each implemented stage.

No npm installation, build, database or application test suite is required on main. There is no generated package manifest: ordinary files and Git describe this preparation. A kit release and its packaging checks will be introduced when the kit exists.

## Application archive

The complete former application is preserved on [`archive/application-m4.1`](https://github.com/afmanu/manu-control-center/tree/archive/application-m4.1) at commit `9fdf92ff919615c0efdf3b71710038b699b57404`. Its README, development guide, lockfile, tests and CI remain together. Use a separate checkout for any future application maintenance. Do not merge it back into main as part of kit work.

Local ignored build/dependency folders were moved out of the main checkout during separation; the installed personal application was untouched. Git history remains intact, so older commits can still contain application code even though the current main tree does not.

[Home](../README.md)
