# Repository kit conversion

Status: **prepared, implementation pending**. This is the active delivery plan following [product direction](product-direction.md) and D33–D35 in [decisions](decisions.md). It replaces the previous infrastructure sequence. Preparation does not make the kit installable or establish reference-feature parity.

## User experience to deliver

Open the repository with an existing agent, ask it to set up or adopt a personal knowledge workspace, and complete a useful task. Return in a fresh session and continue from saved files. The repository ships English instructions and examples; the agent can interact in Spanish and preserve the language of personal content.

The distribution contains reusable instructions, skills, templates and small helpers. Personal context, captures and project notes live in a separate user-selected workspace, which may be an existing Obsidian vault. The normal kit path must work without installing the old npm package, creating a database, configuring a custom runtime or starting a service.

## Target layout

The paths below are implementation destinations, not existing capabilities. Do not generate empty folders merely to match this diagram.

```text
manu-control-center/
  README.md                       Product entry and actual delivery status
  START-HERE.md                   Setup entry and development continuation
  AGENTS.md                       Repository development rules and kit routing
  kit/
    START-HERE.md                 User-facing setup procedure
    operating-guide.md           Shared knowledge and behavior guidance
    skills/                      Canonical, maintained skill definitions
    templates/                   Context, source, knowledge, project, session, audit
    hosts/                       Thin agent-specific entry templates
    examples/                    Synthetic workspace and sample tasks
    scripts/                     Only needed setup, sync and validation helpers
    THIRD-PARTY-NOTICES.md        Adapted sources, versions and applicable notices
  docs/kit-conversion.md          Active conversion plan and completion evidence
  docs/quality-gap-review.md      Additional source-based recommendations
  scripts/check_docs.py           Dependency-free documentation check
```

A new personal workspace starts with a small entry/index, the selected agent's instructions, relevant context and a first useful project or note. Capture, reusable knowledge, project and session locations are created as needed. An existing workspace keeps its own names and metadata; a concise local route map explains their roles. Setup saves a readable record of the kit version, destination and completed steps so it can resume without an installation engine.

Root repository instructions remain development guidance. Installed workspace instructions are for daily use and must not route users through the old implementation plan. Agent-specific skills are generated or copied from `kit/skills/`; never maintain independently edited copies. The application operating skill exists only on the archive branch and must not be restored as the new kit's entry.

## Reuse and preservation

| Existing material | Conversion treatment |
|---|---|
| Product direction and reference analyses | Use for source mapping and behavior; do not import their entire historical component taxonomy. |
| Original installers and AIS-OS skills | Inspect the exact source files and license at implementation time, adapt relevant procedures, retain attribution and record the source revision. No source skills have been copied in this preparation. |
| Capture, meaning, provenance and continuity rules | Express them in shared operating guidance, templates and skills. |
| Meeting brief and project-status examples | Adapt their useful scenarios to ordinary files in K2. Reuse synthetic inputs and evaluation lessons, not the database/coordinator API. Neither scenario is a user-mandated business priority. |
| Former application operating skill | Preserved on the archive branch for legacy instances; excluded from main and kit setup. |
| TypeScript code, database adapters and historical evidence | Preserved on `archive/application-m4.1`, removed from main. Do not import them into the kit or require their completion. |
| Original vault and installed personal instance | Leave untouched during conversion tests. Real adoption is a separate use of the completed setup path at a user-selected destination. |
| Documentation and development checks | Use the dependency-free Markdown check on main. Keep npm checks and the former generated inventory with the application branch. Add kit-use evidence when capabilities ship. |

Following the explicit branch-separation request, all application code, tests, dependencies, schemas and historical implementation documentation live on [archive/application-m4.1](https://github.com/afmanu/manu-control-center/tree/archive/application-m4.1). Main no longer includes them. Git history is preserved; no personal data is migrated. The kit distribution will contain only kit material.

## Four delivery stages

### K1 — Open, set up and use the kit

**Deliver:** the user entry, shared operating guide, minimal templates, Codex entry, setup/context/capture skills and a synthetic example. Setup supports both a new directory and adoption of an existing folder. Reuse known answers, inspect relevant existing instructions and map existing locations before adding anything. Preserve custom text and metadata. Repeated setup should recognize completed work and continue; it must not overwrite a personalized file with its template.

**Done when:** from the kit entry, an actual Codex session sets up a disposable workspace, captures a synthetic source with provenance, retrieves it and saves useful continuity. A fresh session finds that source and the next step without the prior chat. A second case adopts a customized workspace without changing unrelated content, renaming metadata or duplicating notes; rerunning setup preserves the customizations. The test does not invoke the old CLI, use its installed profile or create a database.

**Result:** a first usable kit. K2–K4 remain visible gaps; this is not yet full reference parity.

### K2 — Complete the knowledge and project cycle

**Deliver:** context interviews that save progress, task-to-source routing, meaningful conceptual links, selective synthesis and project continuity/next-step procedures. The link procedure includes a concise Activation Map where useful. Templates separate sources, current consolidated understanding, decisions/proposals and session history without requiring one file for every category or action.

Adapt the two existing useful scenarios: a sourced meeting brief and a project-status update. The agent writes readable drafts and records unresolved questions; it does not turn its recommendations into user decisions. Shared authorization rules honor the user's actual request without creating approval prompts for every note operation.

**Done when:** a source containing an agreement, a suggestion and an unresolved date produces a faithful brief; an existing project supplies a sourced status update and proposed next steps. A fresh session distinguishes accepted decisions from proposals, finds both outputs and resumes correctly. Repeated capture avoids duplication, and synthesized knowledge links back to its sources. An interrupted context interview resumes from saved answers.

**Result:** the combined daily knowledge workflow is usable, including Manu's distinctive connections, distillation and continuity improvements.

### K3 — Audit, improve and maintain

**Deliver:** an audit skill, an improvement skill and readable findings/history. Check retrieval, broken routes, useful context, note duplication and project continuity. Keep stable finding references, preserve open/unverified findings and close a finding only after checking the repair. Choose one useful improvement per cycle. Manual review is a valid operating mode; do not penalize a knowledge workspace for lacking an unwanted scheduler.

Add a small update/repair procedure for installed kit-owned instructions: record their source version, compare before replacing and preserve user modifications. A changed personal instruction needs a reviewed merge or an additive proposal, not silent replacement. Existing session authorization remains valid for unambiguous routine changes.

**Done when:** an audit detects a deliberately broken retrieval route; improvement repairs it and a new retrieval check supports closing the finding. An unrelated note stays unchanged. A repeated update preserves a deliberately customized instruction and explains any unresolved conflict. No new database or maintenance service is needed.

**Result:** the workspace can improve and receive kit updates without losing personal work.

### K4 — Reference parity and distributable release

**Deliver:** a clean standalone kit package, a short start guide, a capability/status table, source notices, and a second agent entry generated from the shared definitions. Claude Code is the second implementation target; other environments remain explicitly unverified until tested. Check the host's current official setup documentation when implementing that entry.

Adapt the reference 3D explorer as an optional local view and include its working invocation and prerequisites. Optional means users need not run it for everyday work; it still belongs in the comparison and cannot silently disappear from the completion criteria. Use the reference implementation where appropriate, retaining its applicable notices. This does not authorize deployment or hosting a new application.

**Done when:** a clean export runs K1's useful path without the old application's files or dependencies, preserves English distribution content and supports Spanish interaction. A second agent opens the same synthetic knowledge workspace, retrieves the prior work and continues it correctly. Generated shared instructions have no drift. The explorer renders the example knowledge and its source links are checked. Installation/adoption and the scope of demonstrated compatibility are documented.

**Result:** the combined repository kit is delivered for the verified hosts. If a host or the explorer cannot be exercised, record the specific gap and do not mark full parity complete. Live service connections and scheduled tasks remain optional extensions configured for a concrete user need through existing host facilities.

## Reference coverage and current status

Names in the implementation column are proposed canonical skill directories, not currently installed commands. Users may request the capabilities in natural language; the host determines invocation syntax.

| Source capability | Kit implementation | Stage | Current status |
|---|---|---|---|
| AIS-OS onboarding; Manu's guided installer | `mcc-setup`, context and workspace templates | K1 | Pending |
| AIS-OS saved context interviews | `mcc-context` with saved answers and resumable interviews | K1–K2 | Pending |
| Manu's capture | `mcc-capture` with sources, meaning and duplicate checks | K1–K2 | Pending |
| AIS-OS `/link`; Manu's link finder and Activation Map | `mcc-link`, source routes and semantic connections | K2 | Pending |
| Manu's synthesis | `mcc-synthesize`, selective consolidation and source links | K2 | Pending |
| Manu's next steps and project hubs; both existing example workflows | `mcc-project`, project/session templates and examples | K2 | Pending |
| Manu's skill discovery | Entry guide's task-to-skill index, extended as skills ship | K1–K4 | Pending |
| AIS-OS `/audit` | `mcc-audit`, retrieval checks and findings/history | K3 | Pending |
| AIS-OS `/level-up` | `mcc-improve`, verified repair and useful maintenance | K3 | Pending |
| AIS-OS `/3d-brain` | `mcc-brain`, optional reference-derived local explorer | K4 | Pending |
| Shared agent instructions and portability | Canonical skills, generated host entries and clean kit export | K1, K4 | Pending |

## Execution and evidence

Implement K1 next; do not initiate another requirements interview or create additional architecture phases before it. The existing documented objective is enough to begin. A missing personal destination does not block synthetic implementation and verification.

For each stage, update its status here and the [handoff](handoff.md) with the delivered paths, actual commands/sessions, observed result and material gaps. Use disposable synthetic workspaces for checks. The old application's test count does not prove any row above is complete. Do not add a generic test framework or custom agent runner to perform these bounded checks.

The current main tree contains kit preparation, the [quality-gap review](quality-gap-review.md) and lightweight documentation tooling. The application is preserved on its archive branch. No personal installation, skill installation or kit release is claimed. Quality-review recommendations await selection; they have not silently expanded K1–K4.
