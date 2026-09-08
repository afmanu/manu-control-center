> HISTORICAL BACKGROUND. This does not establish current status or scope. [Current decisions](../docs/decisions.md) and [architecture](../docs/architecture.md) prevail. Earlier recommendations are retained as context. English translation; original text is preserved in Git history.

# Memory and control systems architecture

## Context and status

Proposed construction baseline derived from the structure, protocols and a targeted note sample in Manu's vault. Its purpose is to make design choices explicit and turn them into a foundation applicable to projects/agents.

The name/grouping is a synthesis proposed on 2026-09-08. There is no evidence this framework guided the vault from the start. This is not an exhaustive audit of links, knowledge quality or external repository operation.

## Definition

Design systems that make purpose explicit, retrieve necessary context, execute bounded procedures, preserve continuity and improve from evidence.

The vault architecture combines responsibility/lifecycle organization, layered memory, hub/relationship navigation, specialized procedures and human-control rules.

## How it developed: historical evidence

| Time | Documentary evidence | Transferable principle |
|---|---|---|
| April 2026 | AGENTS history records the organizational foundation and introduction of hubs. | Give information a location and retrieval path. |
| May 8 | The architecture session preserves PARA, adds `_system`, separates logs/knowledge and establishes continuity. | Evolve a useful structure; separate rules, content and history. |
| May 21 | Agent Components Taxonomy and Agents as Operational Systems formalize contracts, capabilities, memory, state, permissions and evaluation. | Describe the operating system around the model. |
| May 22 | The Neural Vault session adds activation/connections through a protocol and skills while retaining the foundation. | Add capabilities incrementally with bounded autonomy. |

The named records are historical vault references, not implementation dependencies. Interpretation: the observed pattern is incremental layered evolution focused on context/continuity preservation. Dates describe vault records, not every physical repository change.

## Design principles

1. **Purpose before components.** Define the problem/useful completion result, then choose documentation, scripts, workflows, skills or agents.
2. **Responsibility separation.** Distinguish rules, sources, hypotheses, decisions, results, durable memory and temporary state. Folders materialize but do not replace that distinction.
3. **Context before action.** Find existing information, its authority/currency and load only task-relevant material.
4. **Continuity as a requirement.** Prepare for another session/person: explicit state, decisions, open items and next step.
5. **Evidence before consolidation.** Distinguish proposed, implemented and verified. Retain selective lessons with provenance/certainty.

These synthesize documented rules. They neither describe the owner's psychological traits nor guarantee uniform compliance across notes.

## Six architectural layers

| Layer | Question | Vault manifestation | Agent equivalent | Effective-presence test |
|---|---|---|---|---|
| Purpose and contract | Why does it exist and what must it deliver? | Vault identity and hub objectives. | Mission, inputs, outputs, scope and success criteria. | Accept/reject results against pre-execution criteria. |
| Context and access | What must it know and where is it? | Map, hubs, wikilinks and resolver. | Selective retrieval, authorized sources and necessary connectors. | Fresh sessions locate relevant sources and distinguish missing sources from confirmed facts. |
| Capabilities and process | How do inputs become results? | Resolution, capture and review skills. | Procedures, tools and execution paths. | A representative case produces a useful, verifiable artifact. |
| Memory and state | What is retained and where did work stop? | Knowledge, sessions, decisions and continuity hubs. | Durable memory separate from per-run checkpoints. | Interrupt/resume preserves current decisions and avoids repeated completed actions. |
| Control and evaluation | What may it do and how is correctness known? | Editing rules, autonomy level and integration criteria. | Effective permissions, stop conditions, validators and tests. | Out-of-scope cases stop; wrong results fail validation. |
| Maintenance and evolution | How does it stay useful? | Synthesis protocol and consolidation skill. | Currency, failure, cost and verified-improvement reviews. | Problems are detected and evidenced repairs recorded; schedules have real run records. |

Layers are responsibilities, not six agents/mandatory folders. Define purpose/control from the start; context, memory/capabilities may grow during a first complete run. Add recurring autonomy once that run is reliable.

## Creation sequence

```text
Concrete problem
  → Result and success criteria
  → Sources, context and limits
  → Minimal process and necessary components
  → First complete execution
  → Validation of result and boundaries
  → State, evidence and selective learning
  → Repetition and maintenance
```

Failures return to the affected contract, context or process. Learning changes rules/memory only when evidence supports it.

| Step | Minimum artifact |
|---|---|
| State the problem | One sentence with user, need and useful result. |
| Define the contract | Inputs, output, exclusions, acceptance and stop conditions. |
| Resolve context | Brief source/authority map and explicit missing information. |
| Design the process | Steps/decisions, responsibilities and required tools. |
| Execute and validate | Real result, evidence and a relevant failure case. |
| Prepare continuity | Current state, decisions, next step and run history. |
| Maintain | Review trigger and observable signal justifying changes. |

## Relationship to the supplied example

The user supplied an excerpt attributing Three Ms and Four Cs to Nate Herk. It illustrates methodological communication; the kit had not been inspected or its operation verified at this stage.

- **Three Ms:** the example separates mindset, method and construction; this proposal separates principles, architectural layers and creation sequence.
- **Context:** context/retrieval; the vault also includes continuity/memory.
- **Connections:** live tool/data access in the example. Vault wikilinks supply semantic navigation but prove no external-service integration.
- **Capabilities:** procedures/tools. A skill file establishes an available definition, not correct execution by itself.
- **Cadence:** recurrent operation. A review skill may run manually; its existence proves no active automation.

This synthesis explicitly places mission, memory/state and control/evaluation alongside capabilities. It is a design proposal adapted to vault material, not a claim of product superiority.

## Example: project follow-up agent

**Mission:** produce a prioritized list of projects needing attention, with reasons, sources and next steps.

**Context:** relevant hubs/decisions, update dates and activity criteria. Missing logs mean missing information, not proven inactivity.

**Process:** locate scoped projects, retrieve continuity, detect blocks and prepare proposals. It may start as one workflow.

**Memory:** retain confirmed decisions/stable rules. **State:** record reviewed projects, open items and the result belonging to this run.

**Control:** do not infer completion or change project priority. Changes must stay within the task's specific authorization.

**Evaluation:** recommendations link evidence, distinguish facts/uncertainty and propose hub-consistent steps. Test a current hub, a contradictory hub and one without a next step.

**Maintenance:** begin with manual review. If recurrence is needed, configure its trigger and check actual run records.

## Short template for a new project

```text
Purpose: which problem and for whom.
Result: which deliverable demonstrates usefulness.
Contract: inputs, scope, exclusions and acceptance.
Context: sources, authority, currency and missing information.
Process: steps, decisions and smallest sufficient component.
Capabilities: required tools and procedures.
Memory: what deserves persistence and under which criteria.
State: what to save to resume this run.
Control: permissions, limits and stop conditions.
Evidence: how to verify results and restrictions.
Maintenance: which signal requires review and who performs it.
```

For agents, expand this using the existing Agent Design Spec (historical vault reference; not required for implementation). Do not duplicate the technical template.

## Limits and next validation

- The vault demonstrates documentary architecture; this analysis does not verify every mechanism in execution.
- Reviewed SPPF-G/Nano hubs contain pending validations/integrations. Keep design documentation separate from operational availability.
- A note labeled `validado: true` (the original Spanish metadata field) does not replace evidence review.
- Consolidation recurrence and global retrieval quality were not audited.
- The main application risk is oversizing every project's architecture. A few lines may initially satisfy each responsibility.

**Proposed next validation:** apply the template to a small project and check delivery, resumption without context reconstruction, and detection of a relevant failure. Measure usefulness before adopting it as a general standard.

## Activation Map

**Activated regions:** Second Brain/vault system (high); AI Agents/operational design (high); SPPF-G/Nano as documentary comparisons (medium).

**Reused neurons:** Knowledge Flow, Project States, Neural Vault Protocol, Agent Components Taxonomy, Agent Anatomy, Compiled Truth + Timeline and Agent Design Spec.

**New neurons:** this draft framework and the analysis's temporary record.

**Applied connections:** earlier notes feed the synthesis; the template points to Agent Design Spec for technical expansion.

**Proposed connections:** reuse in new projects and assess SPPF-G fit. No contract changes or default-standard adoption.

**Risks:** confusing inference with history, documentation with operation or neural metaphor with literal implementation. The note remains in the private vault and includes no private operational content from reviewed projects.

## Subsequent AIS-OS comparison — 2026-09-08

After the initial proposal, Manu requested comparison with [nateherkai/AIS-OS](https://github.com/nateherkai/AIS-OS). An inspected copy at `ce9cb93a1145da5daba84ea37208ec35fd03606e` included manuals, connection registry, expansions, six skills, audit rubric/history, synchronization and visual package definition. No interviews, automations or explorer were executed.

### Correction to the initial comparison's scope

The earlier section used only the supplied excerpt and remains a record of that reading. The full repository does specify memory, continuity, source authority, action limits and evaluation. Explicit layers in this synthesis do not make these responsibilities exclusive or absent from AIS-OS.

This proposal abstracts an existing personal vault; AIS-OS is a starter kit requiring personalization. Comparing note count/topic breadth would not measure architectural quality.

### Comparison conclusions

| Dimension | Vault and derived proposal | Inspected AIS-OS | Conclusion |
|---|---|---|---|
| Focus | Preserve knowledge, connect lessons and resume work streams. | Personalize an assistant for operational priorities/useful capabilities. | Different design centers with substantial shared architecture. |
| Organization | Explicit capture, application, knowledge, history and resource layers; hubs/typed relations. | Small context, reference, decision and connection base expanded as needed. | Preserve semantic distinctions without replicating the full hierarchy per project. |
| Capture | Selective processing through vault workflow/skills. | Onboarding/interviews with per-answer saving, traceable corrections and confirmed-fact promotion. | Guided entry would reduce dependence on Manu's prior knowledge. |
| Navigation | Activation Map and meaningful connections. | `/link` records when to use sources and verifies manual-to-source paths. | Distinguish conceptual relationships from retrieval routes; both matter. |
| Evaluation | Reviewed local skills focus on connections, duplicates, hubs and continuity. | `/audit` defines retrieval tests, scored criteria, evidence and coverage limits. | AIS-OS operational auditing is more specified than those particular vault skills. |
| Evolution | Synthesis and maintenance proposals. | Audit → selected improvement → later verification, with finding history. | Add a closed improvement cycle without unnecessary capabilities. |
| Portability | Manifest enters vault context; full portability unaudited. | Two manuals and skill packages with declared origins/transformation. | Define canonical sources and check generated copies for multiple environments. |

### Concrete evidence and limits

- [Audit skill](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/audit/SKILL.md) requires five retrieval tests and separates defects, missing verification and opportunities. [History rules](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/audit/history.md) preserve IDs and require fresh evidence for closure.
- [Grill Me](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/grill-me/SKILL.md) distinguishes capture, confirmed facts, proposals and canonical information, matching the vault's layer separation.
- [Connection registry](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/connections.md) has personalization placeholders. The downloaded kit proves neither real user-system access nor recurring execution.
- All 40 files in the six canonical skills were compared with their copies after applying the [synchronization script's](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/scripts/sync-codex-skills.sh) declared path substitution in memory. Every file matched, with no extras. Root manuals matched too. This is static checking, not cross-runtime behavioral proof.
- Skills express control rules in text. A frontmatter phase label alone does not prove a technical autonomy block; effective permissions/controls also depend on the runtime.

### What to adopt and adapt

**Proposed future principles:** guided entry, verifiable retrieval routes, concrete tests, persistent findings and one verified improvement per cycle. These are proposals; no skills were installed or vault operating behavior changed.

**Adapt success criteria:** the [rubric](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/audit/rubric.md) caps Cadence at 10/25 for manual-only systems and the total at 69/100 without required automation evidence. This fits recurrent-operation goals but is not a universal quality measure for research/personal knowledge.

**Adapt utility criteria:** [Level Up](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/level-up/SKILL.md) requires a business-impact category/metric. This vault can also value evidence retrieval, answering questions, error reduction and continuity without translating everything to revenue.

**Adapt structure:** [Expansions](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/EXPANSIONS.md) avoids an inbox and speculative folders. This vault legitimately captures unprocessed material; the transferable principle is controlling accumulation/processing, not deleting it to adopt another convention.

### Resulting foundation for projects and agents

Preserve the six responsibilities and add a usage/testing interface: guided setup, minimum useful case, tested retrieval/reentry, verified limits and one concrete improvement per cycle. Depth should grow with project needs.

Status: proposal pending practical application. This comparison proves neither system globally superior in operation.

## Main references

**Origin review — 2026-09-08:** [Original installer review and Second Brain / AI OS proposal](installer-review.md) adds Manu's identified repository. The proposal becomes one shared core, two usage cycles and create/adopt/update/repair modes. Prioritize manual/skill drift, reuse the installer framework and validate behavior before expanding structure. Still a proposal without operational migration.

- Information Flow (historical vault reference; not required for implementation).
- Project States and continuity hubs (historical vault reference; not required for implementation).
- Neural Vault Protocol (historical vault reference; not required for implementation).
- Agent Components Taxonomy (historical vault reference; not required for implementation).
- Agent Anatomy (historical vault reference; not required for implementation).
- Compiled Truth + Timeline (historical vault reference; not required for implementation).
- Second Brain (historical vault reference; not required for implementation).

[Back to the project](../README.md)
