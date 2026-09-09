# AI OS repository implementation

Status: **K1 and K2 implemented and verified with Codex; K3 next**. This is the active delivery plan following [product direction](product-direction.md) and D33–D39 in [decisions](decisions.md). Manu approved integrating all reviewed improvements on 2026-09-09. They are assigned to the same four stages below. The first two deliveries are available; K3–K4 remain required for full reference-feature parity.

## User experience to deliver

Open the repository with an existing agent, personalize the AI OS around the user's work and available tools, and give it a task. It retrieves context, executes a useful workflow, saves the deliverable and preserves continuity. Return in a fresh session and continue from that work. Manu's Second Brain supplies the memory and knowledge practices supporting this operating loop. The repository ships English instructions and examples; the agent can interact in Spanish and preserve the language of personal content.

The distribution contains reusable instructions, skills, templates and small helpers. Personal context, captures and project notes live in a separate user-selected workspace, which may be an existing Obsidian vault. The normal kit path must work without installing the old npm package, creating a database, configuring a custom runtime or starting a service.

## Target layout

K1–K2 provide the entry, six skills, shared memory guidance, templates, Codex entry and setup helper below. Other capabilities remain implementation destinations. Do not generate empty folders merely to match this diagram.

```text
manu-control-center/
  README.md                       Product entry and actual delivery status
  START-HERE.md                   Setup entry and development continuation
  AGENTS.md                       Repository development rules and kit routing
  kit/
    START-HERE.md                 User-facing setup procedure
    operating-guide.md           OS work loop, tools, memory and behavior guidance
    skills/                      Canonical, maintained skill definitions
    templates/                   Context, sources/connections, knowledge and outputs
    hosts/                       Thin agent-specific entry templates
    examples/                    Synthetic workspace and sample tasks
    scripts/                     Only needed setup, sync and validation helpers
    THIRD-PARTY-NOTICES.md        Adapted sources, versions and applicable notices
  docs/kit-conversion.md          Active conversion plan and completion evidence
  docs/quality-gap-review.md      Source rationale for the adopted improvements
  scripts/check_docs.py           Dependency-free documentation check
```

A new personal workspace starts with a small entry/index, the selected agent's instructions, relevant context and a first useful project or note. Capture, reusable knowledge, project and session locations are created as needed. An existing workspace keeps its own names and metadata; a concise local route map explains their roles. Setup saves a readable record of the kit version, destination and completed steps so it can resume without an installation engine.

Root repository instructions remain development guidance. Installed workspace instructions are for daily use and must not route users through the old implementation plan. Agent-specific skills are generated or copied from `kit/skills/`; never maintain independently edited copies. The application operating skill exists only on the archive branch and must not be restored as the new kit's entry.

## Adopted quality scope

All Q1–Q10 improvements and all six additional capabilities in the [source review](quality-gap-review.md) are included. The delivery mapping below is authoritative; the review's coverage labels describe the earlier plan before adoption.

Core operating guidance covers source authority, scoped retention, memory corrections, meaningful links, artifact handling and effective skill discovery. Decision reviews, resurfacing, URL capture, daily/weekly reviews, tool/SOP notes, scoped specialist workspaces and native scheduling are included as available modes or recipes. They are optional to use, not optional to deliver or silently omit.

Use the planned skills to expose related modes instead of adding a separate skill for every variation. A workspace creates only the files it needs. Integration into the product scope does not authorize connecting Manu's accounts, scheduling personal work, moving notes or installing specialist agents. Native scheduling uses the existing host; it is never a new kit service. The former application's branch boundary remains unchanged.

## Reuse and preservation

| Existing material | Conversion treatment |
|---|---|
| Product direction and reference analyses | Use for source mapping and behavior; do not import their entire historical component taxonomy. |
| Original installers and AIS-OS skills | Inspect the exact source files and license at implementation time, adapt relevant procedures, retain attribution and record the source revision. K1 uses newly written adaptations; exact source revisions and notices are in `kit/THIRD-PARTY-NOTICES.md`. |
| Capture, meaning, provenance and continuity rules | Express them in shared operating guidance, templates and skills. |
| Meeting brief and project-status examples | K1 delivers the minimal project status/action brief; K2 expands both scenarios. Reuse synthetic inputs and evaluation lessons, not the database/coordinator API. Neither scenario is a user-mandated business priority. |
| Former application operating skill | Preserved on the archive branch for legacy instances; excluded from main and kit setup. |
| TypeScript code, database adapters and historical evidence | Preserved on `archive/application-m4.1`, removed from main. Do not import them into the kit or require their completion. |
| Original vault and installed personal instance | Leave untouched during conversion tests. Real adoption is a separate use of the completed setup path at a user-selected destination. |
| Documentation and development checks | Use the dependency-free Markdown check on main. Keep npm checks and the former generated inventory with the application branch. Add kit-use evidence when capabilities ship. |

Following the explicit branch-separation request, all application code, tests, dependencies, schemas and historical implementation documentation live on [archive/application-m4.1](https://github.com/afmanu/manu-control-center/tree/archive/application-m4.1). Main no longer includes them. Git history is preserved; no personal data is migrated. The kit distribution will contain only kit material.

## Four delivery stages

### K1 — Set up the AI OS and complete a first workflow

Status: **complete**, 2026-09-09. Four actual Codex sessions verified new setup, sourced work, fresh-session revision, customized adoption, repetition and no-save behavior. See [the K1 evidence](k1-verification.md).

**Deliver:** the user entry, shared operating guide, minimal templates, Codex entry, setup/context/capture skills, a first project-workflow procedure and a synthetic example. The entry identifies operating priorities, available tools/sources and callable capabilities, then routes a concrete request to useful work. Bring a minimal project-status/action-brief workflow forward from K2 so K1 delivers a result beyond storing information; this is an implementation example, not a user-selected business priority. Setup supports both a new directory and adoption of an existing folder. Reuse known answers, inspect relevant existing instructions and map existing locations before adding anything. Preserve custom text and metadata. Repeated setup should recognize completed work and continue; it must not overwrite a personalized file with its template.

Include a source/connection register template: what information each source owns, exact access route, available read/write capability, connection/verification status, checked date, limits and an optional usage-guide link. Record no credentials. A local source can be sufficient for first use; external rows remain unverified until checked. Shared guidance distinguishes global preferences, project facts and temporary thinking, honors no-save requests, and keeps sensitive linked information out of public outputs unless the task authorizes it. Do not treat the existence of a link as permission to expose its target.

**Done when:** from the kit entry, an actual Codex session sets up a disposable workspace, captures a synthetic source with provenance, retrieves it, runs the first work procedure and produces a useful sourced project-status/action brief. The output distinguishes known status, decisions, uncertainties and proposed actions, is reachable through the project entry, and is checked against the source. Save enough continuity to act on or revise that deliverable later. A fresh session finds the source, deliverable and next step without the prior chat and can continue the selected work without recapturing the same input. A second case adopts a customized workspace without changing unrelated content, renaming metadata or duplicating notes; rerunning setup preserves the customizations. The test does not invoke the old CLI, use its installed profile or create a database.

Also check an available local source alongside an unavailable external reference: the agent selects the right authority and does not claim remote access. A no-save request leaves no new capture, and a project-specific fact is not promoted into global preferences. These checks use synthetic data and do not activate a connection.

**Result:** a first usable AI OS with a demonstrated request-to-deliverable path. Capture/retrieval alone does not complete K1. K1 alone does not establish full reference parity; later deliveries are tracked below.

### K2 — Expand workflows with connected knowledge and project continuity

Status: **complete**, 2026-09-09. Actual Codex sessions verified interview pause/resume and correction, conflicting sources, selected-format meeting/project work, synthesis/relationships, private-output scope, scoped work, fresh retrieval, duplicate avoidance and bounded HTTP intake. See [K2 evidence](k2-verification.md) for exact outcomes and host limits.

**Deliver:** context interviews that save progress, task-to-source routing, meaningful conceptual links, selective synthesis and project continuity/next-step procedures. The link procedure includes a concise Activation Map where useful. Templates separate sources, current consolidated understanding, decisions/proposals and session history without requiring one file for every category or action.

Memory correction updates the relevant current statement, retains the meaningful change with a dated source link, and marks superseded or unresolved claims. Inspect directly linked conclusions affected by the task; do not silently choose the newest file as truth or claim a global refresh. Links may record source → relationship → target, a reason, and proposed/applied status. Use an ordinary link when a typed relation adds no value. Check important-target-to-hub coverage, useful return routes, aliases/heading targets and duplicate note names as well as forward lookup.

Outputs have a purpose, source links, draft/final status, project route and a revision link where appropriate. Preserve an accepted result when making a revision. Reuse user-selected templates, voice examples and assets; add reviewable intermediate artifacts only when they help complex work. A report or source summary does not become permanent knowledge automatically. Decision notes include rationale, alternatives and a review condition when useful; outcome review is delivered in K3.

Add URL/resource intake to capture using available host access, preserving the source URL, capture date and access limits. Add a relevant-old-knowledge mode to synthesis/retrieval that explains relevance rather than inferring unread status from file age. Support scoped specialist workspaces through existing project/area routes and local guidance, preserving shared rules and avoiding duplicate global memory. These are modes of the same kit, not separate applications.

Expand the first K1 workflow and adapt the two existing useful scenarios: a sourced meeting brief and a project-status update. Both are examples of reusable work procedures; the AI OS must not be presented as limited to note management or these two output types. The agent writes readable drafts and records unresolved questions; it does not turn its recommendations into user decisions. Shared authorization rules honor the user's actual request without creating approval prompts for every note operation.

**Done when:** a source containing an agreement, a suggestion and an unresolved date produces a faithful brief; an existing project supplies a sourced status update and proposed next steps. A fresh session distinguishes accepted decisions from proposals, finds both outputs and resumes correctly. Repeated capture avoids duplication, and synthesized knowledge links back to its sources. An interrupted context interview resumes from saved answers.

Additional cases: a correcting answer supersedes a prior value with traceability; contradictory sources remain unresolved when authority is unclear; identically named notes in two projects resolve correctly; a weak relationship stays proposed; and a newly created output is reachable from its hub. A revision preserves the earlier accepted artifact, and a public draft omits an out-of-scope private detail. URL intake reports inaccessible content honestly. Resurfacing recovers an older relevant note without calling it unread. A scoped work area reuses the shared guidance while retaining its own local facts.

**Result:** the combined daily knowledge workflow is usable, including Manu's distinctive connections, distillation and continuity improvements.

### K3 — Audit, improve and maintain

**Deliver:** an audit skill, an improvement skill and readable findings/history. Check priority-relevant workflows, useful output evidence, connection access, retrieval, broken routes, context, note duplication and project continuity. A healthy note collection does not alone establish a useful operating system. Keep stable finding references, preserve open/unverified findings and close a finding only after checking the repair. Choose one useful improvement per cycle. Manual review is a valid operating mode; do not penalize a knowledge workspace for lacking an unwanted scheduler.

Include a consolidation mode covering conceptual overlap, undistilled resources, repeated insights, unlinked decisions and hubs without a useful next step. Keep merges and uncertain connections as proposals unless the user has authorized the relevant changes. Include decision-outcome review and daily/weekly review modes using project/synthesis templates; leave missing outcomes unknown and separate observed evidence from the agent's judgment.

Extend skill discovery into inspect/adapt/build through the improvement skill. The extension recipe records purpose, trigger, inputs, source routes, output destination, tools, boundaries, failure behavior and one useful example. Search existing skills first and reuse or improve one when suitable. Write selected new skills into the shared source with their supporting files; verify discovery and actual use. Save concise tool usage notes and recurring SOPs when a process is used, with source/check dates for volatile instructions.

Add a small update/repair procedure for installed kit-owned instructions: record their source version, compare before replacing and preserve user modifications. A changed personal instruction needs a reviewed merge or an additive proposal, not silent replacement. Existing session authorization remains valid for unambiguous routine changes.

**Done when:** an audit detects a deliberately broken retrieval route; improvement repairs it and a new retrieval check supports closing the finding. An unrelated note stays unchanged. A repeated update preserves a deliberately customized instruction and explains any unresolved conflict. No new database or maintenance service is needed.

Also detect conceptual duplicates with different names and an undistilled resource without merging/deleting them. A requested custom workflow becomes discoverable and produces its expected output with its template; an overlapping request reuses an existing skill. A decision review retains the original rationale and a pending outcome. Daily and weekly review modes save dated results and next steps, reuse an existing same-period note when appropriate, and create no schedule by default. A saved tool/SOP guide can be located and reused in a fresh session, with outdated or unverified instructions identified as such.

**Result:** the workspace can improve and receive kit updates without losing personal work.

### K4 — Reference parity and distributable release

**Deliver:** a clean standalone kit package, a short start guide, a capability/status table, source notices, and a second agent entry generated from the shared definitions. Claude Code is the second implementation target; other environments remain explicitly unverified until tested. Check the host's current official setup documentation when implementing that entry.

Verify skill discovery and effective instructions, including duplicate identities, scoped overrides, intentional host adaptations, and all required templates/scripts/assets. Distinguish present, discovered and exercised capabilities; file equality alone is insufficient. Document representative missing-input/resource failures and recovery without a custom runner.

Ship an opt-in native-scheduling recipe tied to an already working manual workflow. Record the existing host, trigger, expected output, latest due/run evidence and pause/stop/recovery route. No automatic activation during setup, no new scheduler service and no claim of unattended operation from a skill name. Use current host documentation and a bounded synthetic host test when verifying scheduling; do not schedule a personal task as release verification.

Adapt the reference 3D explorer as an optional local view and include its working invocation and prerequisites. Optional means users need not run it for everyday work; it still belongs in the comparison and cannot silently disappear from the completion criteria. Use the reference implementation where appropriate, retaining its applicable notices. This does not authorize deployment or hosting a new application.

**Done when:** a clean export runs K1's useful path without the old application's files or dependencies, preserves English distribution content and supports Spanish interaction. A second agent opens the same synthetic knowledge workspace, retrieves the prior work and continues it correctly. Generated shared instructions have no drift. The explorer renders the example knowledge and its source links are checked. Installation/adoption and the scope of demonstrated compatibility are documented.

A missing bundled resource is detected, a duplicate skill identity is resolved or explicitly reported as ambiguous, and representative input failures leave a useful recovery path. For each advertised scheduling host, observe a synthetic due execution and its output and verify how it is paused/stopped, leaving no test schedule active. If host execution is unavailable, label the recipe delivered but execution unverified; do not claim that capability or mark K4 fully verified while that required check remains open.

**Result:** the combined repository kit is delivered for the verified hosts. If a host, the explorer or a required optional-capability check cannot be exercised, record the specific gap and do not mark full completion. Real account connections and scheduled tasks remain user-specific activation choices through existing host facilities; their reusable guidance is part of the kit delivery.

## Reference coverage and current status

K1–K2 ship the six named setup/context/capture/project/link/synthesize skill directories. Audit, improvement and explorer remain proposed implementation destinations. Users may request the capabilities in natural language; the host determines invocation syntax.

| Source capability | Kit implementation | Stage | Current status |
|---|---|---|---|
| AIS-OS onboarding; Manu's guided installer | `mcc-setup`, context and workspace templates | K1 | Delivered and checked |
| AIS-OS saved context interviews | `mcc-context` with saved answers and resumable interviews | K1–K2 | K1–K2 delivered and checked |
| Manu's capture | `mcc-capture` with sources, meaning and duplicate checks | K1–K2 | K1–K2 delivered and checked |
| AIS-OS `/link`; Manu's link finder and Activation Map | `mcc-link`, source routes and semantic connections | K2 | Delivered and checked |
| Manu's synthesis | `mcc-synthesize`, scoped distillation and source links | K2 | Delivered and checked; broader consolidation remains K3 |
| Work execution supported by Manu's next steps/project hubs; both existing example workflows | `mcc-project`, first work procedure in K1, richer project/session/output templates in K2 | K1–K2 | K1–K2 delivered and checked |
| Manu's skill discovery and construction | Entry index plus `mcc-improve` inspect/adapt/build mode and shared extension recipe | K1, K3–K4 | Six-capability entry delivered; K3–K4 expansion pending |
| AIS-OS `/audit` | `mcc-audit`, retrieval checks and findings/history | K3 | Pending |
| AIS-OS `/level-up` | `mcc-improve`, verified repair and useful maintenance | K3 | Pending |
| AIS-OS `/3d-brain` | `mcc-brain`, optional reference-derived local explorer | K4 | Pending |
| Shared agent instructions and portability | Canonical skills, generated host entries and clean kit export | K1, K4 | Codex entry and canonical resources checked; K4 pending |

## Quality coverage and delivery mapping

All rows are adopted requirements. **K1–K2 deliver source registration, corrected memory, relationships, basic navigation, reusable artifacts, scoped retention, resurfacing, URL intake and scoped work areas. Q9 decision records are delivered; outcome review remains K3. Audit/consolidation, skill building, deeper discovery checks and scheduling remain K3–K4.** Optional use means the capability is available without being enabled or imposed on every user. The source rationale and original coverage assessment remain in [quality-gap-review.md](quality-gap-review.md).

| Adopted item | Delivery location or mode | Stage | Completion evidence |
|---|---|---|---|
| Q1 — Sources and connections | Setup/context register template; audit check | K1, K3 | Local authority found; unavailable external source remains explicitly unverified. |
| Q2 — Corrected and superseded memory | Context/synthesis procedure; current statement and change history | K2 | A fresh session uses the corrected value and traces it to the change; unresolved conflicts remain visible. |
| Q3 — Typed relationships and noise controls | Link procedure and optional Activation Map | K2 | Direction and reason are useful; weak relations stay proposed and ordinary links remain valid. |
| Q4 — Complete navigation | Project/hub routes and audit checks | K2–K3 | Same-name notes resolve correctly; important outputs are reachable; broken/ambiguous routes are detected. |
| Q5 — Consolidation | Audit/improve maintenance mode | K3 | Conceptual overlap and undistilled material found without unauthorized merging or deletion. |
| Q6 — Inspect, adapt and build skills | Improvement mode and extension recipe | K3 | Selected capability runs with its resources; overlapping capability is reused. |
| Q7 — Reusable artifacts | Project/output templates, chosen voice/assets and revision links | K2 | Latest intended output is findable; prior accepted content survives a revision. |
| Q8 — Scoped retention | Shared operating guidance and context/capture procedures | K1–K2 | No-save, project-only fact and public-output scope cases preserve the requested boundaries. |
| Q9 — Decision outcome review | Decision template; optional project/synthesis review mode | K2–K3 | Rationale and alternatives survive; observed outcome is sourced and missing outcome remains unknown. |
| Q10 — Skill discovery and output quality | Audit and host/package checks | K3–K4 | Missing resource and duplicate identity cases are detected; actual use produces a useful output. |
| Resurface relevant old knowledge | Optional synthesis/retrieval mode | K2 | Older relevant knowledge is recovered without treating modification age as reading history. |
| URL/resource capture | Optional capture input mode | K2 | URL/date and access limits preserved; inaccessible content is not fabricated or silently promoted. |
| Daily/weekly review | Optional project/synthesis templates and modes | K3 | Both periods produce useful dated continuity; repeated use avoids duplicate notes and creates no schedule. |
| Tool usage notes and recurring SOPs | Connection guide and improvement procedure | K3 | Reusable process guide is found from its route; volatile details carry a check date/limit. |
| Native scheduling | Opt-in host recipe and capability evidence | K4 | Synthetic due run, output and pause/stop verified on advertised host; no test schedule left active. |
| Scoped specialist workspaces | Project/area setup recipe and scoped guidance | K2 | Scoped facts remain local while shared rules and routes remain available; no automatic specialist-agent installation. |

## Execution and evidence

Implement K3 next; do not initiate another requirements interview or create additional architecture phases before it. The existing documented objective is enough to begin. A missing personal destination does not block synthetic implementation and verification.

For each stage, update its status here and the [handoff](handoff.md) with the delivered paths, actual commands/sessions, observed result and material gaps. Use disposable synthetic workspaces for checks. The old application's test count does not prove any row above is complete. Do not add a generic test framework or custom agent runner to perform these bounded checks.

The current main tree contains the K2 kit, [K1](k1-verification.md) and [K2](k2-verification.md) practical verification, adopted scope, source review and lightweight checks. The application remains on its archive branch. K1–K2 skills were installed and exercised in disposable synthetic workspaces; no personal installation, real account connection or full K4 release is claimed. Continue K3 without reopening scope selection.
