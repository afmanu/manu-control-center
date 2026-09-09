# Kit quality gaps: AIS-OS and Manu's Second Brain

Reviewed: 2026-09-09. **Recommendations for discussion, not adopted scope or implemented features.** The comparison baseline is the prepared K1–K4 [conversion plan](kit-conversion.md) at `9fdf92f`. The application is preserved on [`archive/application-m4.1`](https://github.com/afmanu/manu-control-center/tree/archive/application-m4.1) and is not counted as kit functionality.

## Conclusion

The plan covers the headline capabilities but loses some important operating detail. The most useful additions concern source authority, evolving memory, meaningful links, knowledge maintenance, reusable artifacts and the ability to create a new skill. These can be expressed through ordinary files, shared procedures and bounded checks. They do not require bringing the application's database or execution services back into main.

Nothing in K1–K4 has yet shipped as an operational kit. In this review, **covered** means present in the plan; **partial** means the intention exists but a useful behavior or check is unspecified; **missing** means the plan omits or narrows the source capability. An absent optional feature is not a runtime defect. Recommendations below are not evidence that either reference system always executes its instructions correctly.

## Already covered in the plan

| Capability | Planned delivery | Remaining implementation work |
|---|---|---|
| Guided setup and adoption that preserve customizations | K1 | Build and verify both paths; reuse known context. |
| Persistent context interviews, source capture and provenance | K1–K2 | Save/read back answers, preserve distinctions and demonstrate resumption. |
| Relevant context retrieval, conceptual links and Activation Map | K2 | Define exact link behavior; see Q3–Q4. |
| Selective distillation, project hubs and session continuity | K2 | Implement the knowledge cycle and fresh-session checks; see Q2 and Q7. |
| Audit history, stable findings and verified improvement | K3 | Implement the evidence loop; see Q5 and Q10. |
| Customized updates, shared skill source and second-agent checks | K3–K4 | Implement and verify packaging, discovery and useful behavior. |
| Optional 3D explorer | K4 | Adapt and run the reference package; no need for a second visualization application. |

These are not new recommendations; they should not become another requirements interview.

## Recommended quality additions

### Q1 — Source and connection register

**Coverage: partial. Recommend for K1 guidance, expanded in K3 checks.** The plan distinguishes live connections from links but leaves connections as a general optional extension. AIS-OS supplies a concrete registry and checks its evidence [N1, N2].

Add a small workspace register recording the system, information it owns, access route, capability (read/write), checked date, limitations and a link to a short usage guide. Record connection status without copying credentials. A listed service may be unavailable; do not imply it is connected merely because a row exists. Actual connection installation remains user-specific.

**Value/check:** the agent knows where to obtain an authoritative task or meeting record and clearly says when access is unverified. Test an available local source and an unavailable external source without activating an integration.

### Q2 — Correct and supersede memory explicitly

**Coverage: partial. Recommend for K2.** Current context plus session history is planned, but later corrections, contradictory sources and affected summaries lack a clear procedure. AIS-OS's interview skill preserves corrected answers and marks supersession; its audit distinguishes source authority and stale caches. Manu's Compiled Truth + Timeline separates current understanding from explanatory history [N2, N3, M3].

Keep a compact current statement and a dated explanation of a meaningful change, linked to its source. Flag unresolved contradictions instead of choosing whichever file was edited last. When a source changes, inspect the directly linked conclusions relevant to the task; do not claim a globally refreshed knowledge base. Live status, stable preferences, old captures and generated summaries can have different authority. Do not create a second mutable summary of every file.

**Value/check:** after the user corrects a priority or a date, a new session uses the corrected value and can explain the change. An old sourced summary remains visibly dated, not current by implication.

### Q3 — Typed relationships with direction and noise controls

**Coverage: partial. Recommend for K2.** The Activation Map and conceptual links are named, but the plan does not specify when a relationship is meaningful. Manu's Neural Vault Protocol and connection auditor distinguish useful, weak, premature and sensitive links [M1, M2].

Represent an optional relationship as source → type → target, with a brief reason and proposed/applied status where necessary. Useful types include extends, depends on, exemplifies, contradicts, updates and questions. An ordinary link is enough when a type adds no value. A mention or shared keyword is not proof of a meaningful relationship; a reference to evidence does not certify that the evidence validates a claim.

**Value/check:** an integration connects a genuinely supporting note and keeps a weak or conflicting relationship labeled appropriately. It does not create a new note for every edge or expose a private note through a public output.

### Q4 — Complete navigation, including the way back

**Coverage: partial. Recommend for K2 and K3 audit checks.** The plan tests retrieval, but important-target-to-index coverage, ambiguous note names and useful return paths are not explicit. AIS-OS checks both route-to-target and important-target-to-route; Manu's hubs link parent/section/notes and use aliases or wikilinks [N4, N5, M1, M4].

Follow manual → relevant hub/index → exact target, and ensure an important output or note is discoverable through that chain. Use explicit relative paths when two notes share a name; preserve existing aliases and heading references. Give a useful return link to the parent hub where appropriate. Do not force backlinks onto every file or load the entire vault.

**Value/check:** two projects with identically named notes resolve to the intended one, and a new important output is reachable from the project's entry. Test a moved or ambiguous target as a detected issue, without automatically renaming it.

### Q5 — Consolidation as a distinct maintenance task

**Coverage: partial. Recommend as a mode of K3 audit/improvement, not a separate service.** The plan checks duplication and routes, but Manu's Dream Cycle also finds conceptual overlap, undistilled resources, repeated insights, unlinked decisions and hubs without a meaningful next step [M2].

Add a bounded consolidation review for a project, area or chosen folder. Return useful reuse, distillation, connection and hub-update proposals. Keep uncertain links and possible merges as proposals. Apply routine edits already authorized by the task; obtain specific authorization for destructive restructuring when it is absent.

**Value/check:** a review identifies that two differently named notes overlap and that a useful resource has not been distilled. It does not delete, merge or archive them merely to improve a score.

### Q6 — Skill discovery must include building useful new skills

**Coverage: missing/narrowed. Recommend for K3, using a compact extension procedure.** The previous plan mapped Manu's `explore-skills` to a task-to-skill index. The source also lets the user inspect, adapt and build a selected capability from a catalog or their own idea. Nate's improvement skill can produce a selected workflow artifact rather than only repair a defect [S1, N6].

Keep discovery, but add an extension recipe: purpose, trigger, inputs, source routes, output location, required tools, boundaries, failure behavior and one useful example. Search existing skills first; improve an existing one where it fits. Save new definitions in the shared source and distribute their supporting resources together. Follow current user authorization without repeating approvals that are already explicit.

**Value/check:** a user-requested custom workflow becomes a discoverable, usable skill with its template; an overlapping request reuses an existing skill. A catalog entry alone is not reported as installed.

### Q7 — Artifacts have a location, lifecycle and reuse path

**Coverage: partial. Recommend for K2.** Sourced drafts are planned, but a broader output convention is missing. Manu's project protocol separates outputs, contextual research, decisions and sessions. His artifact pattern favors reviewable intermediate results for complex work. Nate's expansions include reusable templates, voice examples and brand assets [M4, M5, N7].

Record an output's purpose, source links, current draft/final status and project entry. Preserve accepted content when making a new revision, and retain a link to its predecessor where needed. A report is not automatically a permanent belief or a user decision. Reuse appropriate templates and user-provided voice/assets without forcing a brand package into every workspace. Intermediate outlines or research summaries are useful for complex work, not mandatory ceremony for every note.

**Value/check:** a fresh session locates the latest intended deliverable and distinguishes it from a draft, research note and source. A requested revision preserves the earlier accepted result and uses the chosen template.

### Q8 — Scoped memory and permission to retain less

**Coverage: partial. Recommend for shared K1–K2 guidance.** Personal-workspace separation is planned, but project-specific context, selective retention and sensitive cross-linking need explicit rules. Nate's expansions allow scoped work areas; interviews limit canonical promotion to requested context work. Manu's resolver/capture protocol selects relevant regions, avoids noise and honors a request not to save [N3, N7, M1, M2, M4].

Keep global preferences distinct from project-specific facts and temporary thinking. Consult relevant sources on demand. Do not save every conversation or treat a brainstorming hypothesis as memory. A request not to save overrides normal capture behavior. Public outputs must not gain private facts just because they are linked internally. These are agent procedures, not a claim of file-system access isolation.

**Value/check:** a project-specific assumption is not applied globally; a no-save request leaves no new capture; a public draft omits a private linked detail outside its scope.

### Q9 — Review decisions by their reasons and observed outcomes

**Coverage: missing beyond decision capture. Recommend as an optional K3 review mode.** Nate's decision format preserves reasons, alternatives and conditions that would change the decision. Manu's installer catalog proposes a decision tracker with outcome review [N8, S2]. The catalog is a proposed capability, not an executed tracker.

Extend the decision template with rationale, alternatives and a review condition when useful. A later review can add an observed outcome and what was learned. Keep pending outcomes unknown; do not calculate success/failure statistics from missing data or turn model judgments into the owner's verdict.

**Value/check:** a past decision can be revisited with its original reasoning, relevant outcome evidence and unresolved questions. This provides learning beyond a chronological log.

### Q10 — Capability quality includes discovery, resources and useful output

**Coverage: partial. Recommend for K3–K4 verification.** The plan already includes shared sources and a second agent. Nate's compatibility guide goes further: duplicate skill identities, effective discovery/precedence, supporting files, scoped overrides and intentional host differences [N5].

Distinguish a definition on disk, a skill discovered by a host and a workflow actually exercised. Check bundled templates/scripts/assets and the instructions the active host really reads. Check representative wrong or missing inputs and explain recovery. Do not create a generic agent test platform to do these bounded checks.

**Value/check:** a skill missing its required template fails the package check even if its main file matches; a duplicate identity is reported as ambiguous until effective discovery is established. Successful invocation still needs a useful output check.

## Useful optional additions

| Candidate | Source and current gap | Recommendation |
|---|---|---|
| Resurface relevant old knowledge | Installer catalog's forgotten-notes; vault synthesis. Not explicit in the plan. | Add a synthesis/retrieval mode when useful. Rank by current relevance; modification age does not prove that the user has not read a note. |
| URL/resource capture | Installer catalog; K1 source capture does not yet specify web intake. | Add an input recipe using available host access. Preserve URL/date and distinguish a source summary from validated knowledge. No crawler or automatic permanent promotion. |
| Daily/weekly review | Installer catalog and vault knowledge flow. Manual audits alone do not provide a personal review ritual. | Optional templates and an explicit invocation; combine with existing synthesis/project skills instead of multiplying nearly identical skills. |
| Tool usage notes and recurring SOPs | Nate's connection register and expansions. Only loosely covered. | Save short task-specific guides when a tool/process is actually used; revisit volatile API details instead of treating documentation as permanently current. |
| Native scheduling | Nate's cadence guidance; general optional extension in the plan. | Keep optional and host-operated: trigger, expected output, last run and stop/recovery route. Configure only for an authorized need after the manual workflow works. No scheduler service. |
| Scoped specialist workspaces | Nate's expansions and Manu's project/area hubs. | Start with scoped instructions and routes. Add specialist skills or agents only for a repeated need; do not create them automatically. |

## What not to import by default

- A database index, entity registry, event ledger or automatic graph engine from conceptual memory notes. The inspected Brain-Based Agent Memory note lists these as a model; it does not establish a working requirement for this kit [M3].
- Embeddings/vector search just because the neural metaphor mentions latent relationships. Begin with explicit routes, links and ordinary search; measure a retrieval limitation before adding infrastructure [M1].
- Global automatic linking, forced reciprocal links, mass renaming or consolidation by deletion. More connections do not necessarily improve knowledge quality [M1, M2].
- Numerical link-confidence claims and project-health verdicts derived only from file age. Those heuristics appear in the installer; the useful recommendation needs better uncertainty handling [S2, S3].
- A universal no-inbox policy from Nate or the complete fixed folder hierarchy from Manu. Both systems' useful behavior can survive flexible workspace conventions [N7, M4].
- Mandatory automation, revenue-only improvement metrics or a literal copy of every framework question. Adapt improvement to the user's purpose, including knowledge quality and continuity [N2, N6].
- A second knowledge-view application alongside the planned reference explorer without a demonstrated need. Keep views optional and derived from selected sources.

## Proposed selection

Recommend Q1–Q8 and Q10 as refinements to the existing K1–K4 scope, with Q9 and the optional table available according to use. This does not require more stages. Preserve the two current workflow examples as examples, not the only permitted artifact types. This selection is a recommendation awaiting Manu's decision; the conversion plan has not been silently expanded and none of these features is implemented by this review.

## Evidence and limits

Public repository references below use the exact fetched commits. Local references name only system/procedure files needed to explain the finding; their contents and personal inventories were not copied into the public repository. This is a bounded design review of definitions and selected protocols, not a live integration test, an exhaustive link audit or proof of observed usage. The latest local file content was read; no global vault version or complete implementation audit is claimed.

### AIS-OS source locators

- **N1:** [connections.md](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/connections.md), register fields and mechanism guidance.
- **N2:** [audit/SKILL.md](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/audit/SKILL.md), retrieval probes, freshness/authority, connections and capability evidence.
- **N3:** [grill-me/SKILL.md](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/grill-me/SKILL.md), checkpoints, corrected answers, scope and confirmed-context promotion.
- **N4:** [link/SKILL.md](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/link/SKILL.md), smallest useful route and read-back traversal.
- **N5:** [audit/compatibility.md](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/audit/compatibility.md), sections 1–4: canonical guidance, bidirectional routes, discovery and resources.
- **N6:** [level-up/SKILL.md](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/level-up/SKILL.md), selected improvement, Method/Machine handoff and artifact verification.
- **N7:** [EXPANSIONS.md](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/EXPANSIONS.md) and [AGENTS.md](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/AGENTS.md), scoped work areas, templates, voice/assets, SOPs and restraint in expansion.
- **N8:** [decisions/log.md](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/decisions/log.md), decision entry format.

### Original installer source locators

- **S1:** [explore-skills.md](https://github.com/afmanu/claude-obsidian-second-brain-installer/blob/9cb05973a04b6e2b945fac591ccec8bf6f43f85c/.claude/commands/explore-skills.md), inspect/build/custom capability flows.
- **S2:** [skills-catalog.md](https://github.com/afmanu/claude-obsidian-second-brain-installer/blob/9cb05973a04b6e2b945fac591ccec8bf6f43f85c/docs/skills-catalog.md), optional recipes and their stated heuristics.
- **S3:** [command-contracts.md](https://github.com/afmanu/claude-obsidian-second-brain-installer/blob/9cb05973a04b6e2b945fac591ccec8bf6f43f85c/specs/command-contracts.md), outputs, linking, source context and write behavior.

### Evolved Second Brain source locators

- **M1:** `_system/neural-vault-protocol.md`, typed relationships, activation map and anti-noise rules; protocol currently labeled draft.
- **M2:** `.agents/skills/vault-context-resolver/SKILL.md`, `.agents/skills/vault-connection-auditor/SKILL.md`, `.agents/skills/vault-dream-cycle/SKILL.md`, and the Codex/Claude capture definitions. These define procedures; execution was not tested. The inspected Claude capture lacks the explicit Activation Map section present in the Codex definition, reinforcing the need to check shared behavior rather than assume parity.
- **M3:** `03_Knowledge/Frameworks/compiled-truth-timeline.md`, `03_Knowledge/Insights/memory-is-not-state.md`, and `03_Knowledge/AI-Agents/brain-based-agent-memory.md`. These are knowledge patterns, not proof of an installed memory engine.
- **M4:** `AGENTS.md`, `_system/knowledge-flow.md`, `_system/project-states.md`, `_system/codex-workflow.md`, `_templates/conversation-capture.md`, and `_templates/project-hub.md`: retention, note roles, continuity, hubs and output locations.
- **M5:** `03_Knowledge/Conceptos/artefactos-intermedios-verificables.md`: reviewable intermediate outputs for complex work.

[Home](../README.md)
