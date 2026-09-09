# Product direction: an agent-operated Second Brain kit

## User correction

Manu clarified the intended product: a repository like Nate Herk's AIS-OS, incorporating the useful improvements from Manu's existing Second Brain installer and evolved knowledge system. Building databases, entity-control infrastructure and a custom execution platform was not the intended outcome. This explicit correction supersedes the infrastructure-first M0–M6 delivery sequence and any conflicting earlier architecture guidance.

The product is a usable repository of context, operating instructions, skills, templates and small supporting tools. The user's existing agent runs it. A user should be able to open the kit, personalize or adopt a knowledge workspace, and do useful work in that workspace. English repository content and Spanish runtime interaction remain required.

## What belongs in the kit

### Original objective reviewed on 2026-09-09

The [exact conversation originally supplied by Manu](https://chatgpt.com/share/6a9fb943-0ab4-83eb-ae6d-715dcafc3e98) was reopened for this review. Manu asked how to combine the strengths of both repositories and make the result usable across agent ecosystems, then requested an explanation of the approved concept's components and foundations. The assistant introduced a different architecture with a canonical kernel, independent state and runtime adapters. Later implementation planning turned that proposal into mandatory infrastructure.

The conversation did contain that broader architecture, and Manu approved developing its conceptual explanation. However, it does not justify retaining every proposed mechanism after his explicit product correction. Preserve the useful behavior and portability goal; do not treat the assistant's component list as a binding platform backlog. The earlier [conversation review](../references/shared-conversation-review.md) cites a different share URL and remains historical background, not a substitute for the exact source or the current instruction.

**Delivery objective:** publish a reusable, agent-operated repository that combines AIS-OS's guided context, routing and improvement cycle with Manu's personalized setup and deeper knowledge capture, connections, synthesis and continuity. A user opens it with an existing agent, creates or adopts a personal workspace, and starts using it. Codex is the first verified agent; other environments need their own practical compatibility checks.

### Contributions to retain

| Contribution | Product behavior to preserve or deliver |
|---|---|
| AIS-OS setup and ongoing context interviews | Personalize the workspace and progressively capture business context, preferences and plans, reusing known answers. |
| AIS-OS routing | Make relevant files and projects findable through concise instructions and useful links. |
| AIS-OS audits and improvement cycles | Inspect real retrieval and workflow behavior, retain findings/history, implement a useful correction and verify it. |
| AIS-OS knowledge explorer | Retain visibility in the feature comparison; reuse or adapt the existing visual package with attribution if included, rather than inventing a new platform for it. |
| Manu's installer | Clear installation entry, environment-aware setup, separation of distribution and personal workspace, personalization and adoption of an existing workspace. |
| Manu's Second Brain | Capture with provenance, meaningful connections, project continuity, synthesis, next-step suggestions and selective distillation into reusable knowledge. |
| Combined improvements | Preserve customizations and original meaning, distinguish decisions from proposals, keep one maintained source for shared skill instructions, and test actual behavior in each advertised agent. |

Use ordinary readable files, links and the agent's available tools. Lightweight scripts are appropriate when they directly help installation, skill packaging, link validation or another user-visible task. Obsidian can be a supported workspace interface without becoming a mandatory database or an excuse to rewrite existing notes.

### Concrete combined behavior

The feature comparison must cover the following user outcomes. These are delivery targets, not claims that the current application already implements the kit.

| User outcome | Reference contribution | Lightweight implementation and useful verification |
|---|---|---|
| Start with relevant context | AIS-OS onboarding and ongoing interviews; Manu's guided installer and profiles. | A setup skill and editable context templates reuse known answers, save progress and ask only for necessary gaps. Verify both a new workspace and adoption of an existing one. |
| Capture information without losing its origin | Manu's capture process; both systems distinguish raw input from accepted knowledge. | Save a source note with provenance, date and an appropriate location. Search before creating a duplicate; preserve uncertain statements as uncertain. |
| Find and connect useful knowledge | AIS-OS `/link`; Manu's link finder, meaningful relationships and Activation Map. | Keep task-to-source routes and concept-to-concept links distinct. Explain why a relationship is useful; load only relevant context. Verify retrieval from a fresh session. |
| Turn experience into reusable knowledge | Manu's synthesis and selective distillation. | Separate raw captures/session history from consolidated notes. Retain sources and explain updates; do not turn every model output into a lasting rule. |
| Resume a project and choose a next step | Manu's project hubs, continuity and next-step skills; AIS-OS context and decision records. | Maintain purpose, current state, confirmed decisions, open questions and next actions in readable project notes. A fresh session should recover them without the old chat. |
| Improve the workspace from evidence | AIS-OS `/audit` and `/level-up`; Manu's knowledge maintenance. | Save findings, choose one useful repair and check it again. Assess retrieval, continuity and knowledge usefulness; manual operation is valid when automation is not a user requirement. |
| Understand the knowledge structure visually | AIS-OS `/3d-brain`; Manu's linked knowledge. | Retain the explorer in the parity comparison and reuse/adapt the existing package with attribution when delivered. Keep it an optional view; its absence must remain an explicit capability gap. |
| Use another compatible agent without rebuilding the knowledge system | Original cross-ecosystem request; both repositories' agent guidance. | Maintain shared skill instructions once, provide host-specific entry files and verify advertised hosts. An untested host is not supported merely because a manual exists. |

The knowledge cycle is **capture → contextualize → apply → distill → connect → review**. Session history records what happened; consolidated notes express the current understanding. Decisions, proposals and unresolved questions retain their meaning throughout that cycle. These distinctions belong in templates and procedures; they do not require a custom entity database.

Adoption must respect existing folder names, metadata, hubs and language conventions. Recognize equivalent structures and report actual conflicts instead of imposing a complete taxonomy or rewriting a vault. Personal content stays separate from the public distribution. Installation, updates and repairs should preserve customizations.

Three different capabilities must not be conflated: conceptual links explain how knowledge relates; retrieval routes say where to look for a task; external connections provide access to a service. A connections file does not establish a working integration. Likewise, a review skill is usable manually; an automated cadence requires a configured host facility and observed runs. Add real integrations and schedules only when needed and authorized, using existing host tools.

AIS-OS already includes memory, continuity, source authority and action limits. The combined kit improves the fit and depth of knowledge work; it must not claim those qualities were absent from the reference.

Source basis: [AIS-OS](https://github.com/nateherkai/AIS-OS), [Manu's installer](https://github.com/afmanu/claude-obsidian-second-brain-installer), the [installer and evolved-workspace review](../references/installer-review.md), and the [memory comparison](../references/memory-and-control-analysis.md). Source inspection establishes available definitions and design evidence, not successful execution in this kit.

## What is no longer a prerequisite

- Finishing database adapters, cross-backend migrations, entity-control layers, distributed coordination or custom runtime orchestration.
- Running the TypeScript/npm application or creating a SQLite instance to use the future kit.
- Rebuilding functions already supplied by the user's agent or installing every possible integration.
- Another discovery interview with Manu about the already documented objective.

In practical terms, describe work steps in a skill instead of implementing an execution coordinator; retain decisions and source references in notes instead of requiring an entity-control API; and express continuity in project notes instead of requiring a database-backed job ledger. Small scripts remain appropriate where an actual user task benefits from deterministic handling.

Preserve existing code, evidence, Git history and private data while restructuring. Existing technical work is retained as prior implementation, not a dependency that the kit must justify or consume. Reuse only the pieces that simplify an actual kit capability. Do not delete or migrate the installed personal instance as an incidental cleanup.

## Immediate development direction

The next implementation should establish the kit's ordinary file-based entry and workspace structure, bring over the reference capabilities and Manu's improvements, and verify an installation/adoption and useful end-to-end session. Keep an explicit feature comparison so that user-facing capabilities are not replaced by infrastructure milestones. Reuse existing source material and preserve applicable licenses and attribution.

The existing application and its operating skill remain available, but they do not yet constitute this kit. Do not describe this direction correction as a completed product conversion. The previous M4.2 export/import milestone is no longer the next task.

Success is a user opening the repository with a compatible agent, using their context and knowledge, producing useful results, resuming later, and improving the workspace without losing personal content. Verification must support the capabilities actually delivered; a large mechanism-test count is not a substitute for that experience.
