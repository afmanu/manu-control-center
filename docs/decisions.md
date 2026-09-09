# Kit decisions

Current user instructions take precedence. D33 and D34 below are retained history; D35 supersedes their decision to keep application files on main. The complete earlier decision log is preserved on the [application branch](https://github.com/afmanu/manu-control-center/blob/archive/application-m4.1/docs/decisions.md).

### D33 — Restore the intended repository-kit product

Status: **adopted by explicit user correction**, 2026-09-09. Manu clarified that the objective was the same type of repository system as Nate Herk's, integrating improvements from his own, rather than building databases and entity controls. The implementation had overemphasized infrastructure. This correction changes the delivery target, not merely the priority of another infrastructure milestone.

Build an agent-operated kit of context, instructions, skills, templates and directly useful helpers. Use existing agent capabilities and readable workspace files. Preserve the English repository policy, Spanish interaction, personal-workspace separation, original meaning, customization and evidence-based verification. The kit's user journey must not depend on finishing or adopting the custom TypeScript/SQLite platform.

Pause M4.2–M4.5 and stop treating M5/M6's application sequence as the active delivery plan. Preserve existing implementation, evidence and private data without deletion or migration. Reuse only material that directly serves the kit. Current documentation is corrected now; the kit itself is not yet converted or delivered. Next: implement its file-based entry/workspace and the explicitly mapped reference skills plus Manu's improvements, using existing context rather than another discovery interview. [Current brief](product-direction.md).

Source-review follow-up, 2026-09-09: the exact original share link was reopened. Manu requested the combination and cross-ecosystem usability; the assistant introduced the kernel/state/adapters architecture, which Manu subsequently asked to have explained as an approved concept. His current explicit correction supersedes that platform interpretation. The current brief now preserves concrete source contributions, including semantic connections versus retrieval routes, selective knowledge consolidation versus session history, project continuity, customization-preserving adoption and purpose-appropriate audits. Cross-agent usability remains a goal to verify through existing hosts, not a requirement to finish a custom runtime platform. This review changes no application behavior or private data and does not claim the kit is delivered.

### D34 — Prepare conversion through four user-visible kit deliveries

Status: **adopted for conversion preparation**, 2026-09-09. Manu asked to prepare the conversion to the kit. The [conversion plan](kit-conversion.md) establishes K1 setup/adoption and first use, K2 the knowledge/project cycle, K3 audit/improvement and customization-preserving maintenance, and K4 clean distribution, second-agent verification and the optional reference-derived explorer. Every reference capability stays visible until implemented and checked; optional explorer use does not remove it from the parity target.

Use `kit/` as the future maintained source for shared skills, operating guidance, templates, host entries and useful helpers. Its standalone export must work without the legacy application. Personal workspaces remain outside the distribution. Preserve the existing source layout, application skill, installed personal instance and Git history. The old README's application details move to a legacy guide with corrected links; the root README and START-HERE now expose actual kit status and the next delivery.

Preparation changes documentation and navigation only. No kit skills or templates are installed, no runtime compatibility is claimed, and no private data is changed. K1 is the next implementation task using disposable examples and actual Codex sessions. Update source-license checks when adapting source files. Verification must distinguish old application regression checks from kit outcomes. Do not build a new runner, database or migration platform to execute this plan.

### D35 — Isolate the application on its own branch and review quality gaps

Status: **adopted by explicit user instruction**, 2026-09-09. Manu requested that all application material live on a branch instead of main, followed by a comparison of useful system, connection, memory, file-linking, skill and artifact capabilities in AIS-OS and his Second Brain.

The branch `archive/application-m4.1` was created and published at `9fdf92ff919615c0efdf3b71710038b699b57404` before removal. It preserves the full application, dependencies, CI, tests, schemas, operating skill, historical documentation and evidence. Its remote ref was verified against that exact commit. Main retains kit direction, planning, source review, instructions, license and a small documentation check. Application-specific instructions and CI are replaced accordingly. No force push, history rewrite, private-instance migration or source-vault edits are authorized or performed by this separation.

The [quality-gap review](quality-gap-review.md) compares source definitions with the prepared kit plan. Recommendations are for discussion; they are not implemented capabilities or authorization to install connections, activate schedules or expand the plan automatically. Existing planned functions remain pending. Preserve this distinction when the user chooses what to integrate.
