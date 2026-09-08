> HISTORICAL BACKGROUND. This does not establish current status or scope. [Current decisions](../docs/decisions.md) and [architecture](../docs/architecture.md) prevail. Earlier recommendations are retained as context. English translation; original text is preserved in Git history.

# Original installer review and Second Brain / AI OS proposal

## Scope and conclusion

Manu identified [claude-obsidian-second-brain-installer](https://github.com/afmanu/claude-obsidian-second-brain-installer) as the original installer from which his vault evolved. This review adds that origin to the earlier AIS-OS comparison. The goal is use from Codex, Claude Code, Cowork and other environments through verified capabilities.

**Proposal:** shared knowledge, an optional operating layer and an installer handling creation, adoption, updates and repair. Prioritize contract consolidation and behavioral tests. Recommendations are neither adopted decisions nor configuration changes.

Inspected versions:

- Original installer: commit `9cb05973a04b6e2b945fac591ccec8bf6f43f85c`, 2026-05-05; 31 tracked files. Static inspection of bootstrap, installation, commands, profiles, contracts, retrieval, example and MCP configuration.
- AIS-OS: commit `ce9cb93a1145da5daba84ea37208ec35fd03606e`, 2026-09-06; manuals, six skills, evaluation, history, synchronization and visual package.
- Local vault: manifests, protocols, local skills and related documentation. Targeted review, not an exhaustive audit of all notes.
- Official environment documentation consulted on 2026-09-08.

The installer clone is shallow; expanding history failed due to DNS resolution. Manu's stated origin is accepted, but complete commit genealogy was not reconstructed. No installers, services or automations were executed. Example transcripts are not execution evidence.

## Contributions from each source

| Source | Contribution to retain | Proposed evolution |
|---|---|---|
| Original installer | Guided entry, intent detection, customization, output contracts, retrieval and installer/final-vault separation. | Decouple runtime/transport; add persistent state, adoption and executable verification. |
| Evolved vault | Capture, projects, areas, temporal memory, distilled knowledge, continuity hubs and meaningful relationships. | Turn stable rules into a portable contract; keep personal inventory in the vault. |
| AIS-OS | Onboarding, saved interviews, retrieval routes, evidenced audits/history and one concrete improvement per cycle. | Adapt metrics to purpose; make recurrence optional. |
| Existing Agent-Guided Installer Framework | Blueprint, runtime/backend adapters, capabilities, verification and handoff. | Reuse minimal contracts for this case; validate implementation before assuming availability. |

Three Ms and Four Cs remain a useful operating framework attributed to Nate Herk. Here, Context relies on memory/retrieval; Connections on sources/adapters; Capabilities on workflows; Cadence on demonstrated recurring execution. Add cadence once the manual workflow works and the user needs recurrence.

## Priority findings

### 1. Environments receive different rules in the current vault

AGENTS.md (historical reference not included) declares an August update; CLAUDE.md (historical reference not included) retains April. Material differences concern apex-agent status, filename-date exceptions and system scope. Capture in `.agents/skills/second-brain-capture/` includes Activation Map; `.claude/skills/second-brain-capture/` does not. Local inventory contains four skills in `.agents/skills` and one in `.claude/skills`.

This proves documentation drift, not a failed Claude session. Global skill installations were not inspected.

**Proposed change:** one maintained policy source and one source per skill, with generated/checked environment-specific entry points. Declare intentional tool differences. Identical files do not guarantee identical behavior; environment tests are also needed.

### 2. The installer couples knowledge, tool and product

The [command contract](https://github.com/afmanu/claude-obsidian-second-brain-installer/blob/9cb05973a04b6e2b945fac591ccec8bf6f43f85c/specs/command-contracts.md) requires `.claude/vault-profile.md` and `obsidian-vault` MCP for notes. The profile mixes identity, language, structure and routes inside a Claude-specific folder.

**Proposed change:** move shared configuration to `_system/`. Define search, read, write and link-check operations. Initially implement local files; enable MCP when it supplies needed access/capabilities. Node/MCP configuration would be selected-adapter dependencies, not universal Second Brain requirements.

An authorized Markdown-writing runtime can operate without MCP. Chat without persistent access can only prepare content or hand off a package. Generating instructions must never justify declaring installation complete.

### 3. The evolved vault needs adoption

The [original output contract](https://github.com/afmanu/claude-obsidian-second-brain-installer/blob/9cb05973a04b6e2b945fac591ccec8bf6f43f85c/specs/vault-output-contract.md) expects `Home.md`, `00_START_HERE.md`, `.claude/vault-profile.md` and other files this vault does not use. It has `_system`, hubs and its own conventions. Missing those original files does not establish a broken installation.

The [original schema](https://github.com/afmanu/claude-obsidian-second-brain-installer/blob/9cb05973a04b6e2b945fac591ccec8bf6f43f85c/specs/frontmatter-schema.md) uses `type/created`; the current vault uses the Spanish field names `tipo/creado`. Legacy notes coexist. Adoption must read equivalents, detect conflicts and respect the chosen new-note format. Conflicting values in both fields must be reported.

**Proposed change:** inventory/map functions before proposing files. Do not reinstall the original template over personal evolution or mass-normalize names/properties.

### 4. Profiles should customize presentation and destination while preserving meaning

The [original capture procedure](https://github.com/afmanu/claude-obsidian-second-brain-installer/blob/9cb05973a04b6e2b945fac591ccec8bf6f43f85c/.claude/commands/second-brain-capture.md) turns a decision into a project/proposal for consulting, an argument for research or a goal/lesson for personal use. That makes decisions harder to retrieve as a stable category.

The [catalog](https://github.com/afmanu/claude-obsidian-second-brain-installer/blob/9cb05973a04b6e2b945fac591ccec8bf6f43f85c/docs/skills-catalog.md) proposes fixed routes such as `04_Daily` although some profiles use others. It also equates unchanged notes with unvisited notes and suggests inferring blocked projects from age. These are indirect signals, not usage/state facts.

**Proposed change:** stable semantic types and configurable logical routes such as `routes.logs`/`routes.projects`. Combine profiles through examples, templates and modules. Present heuristic connection scores as ranking, not calibrated probabilities. Selectively distill temporal reviews/captured sources before permanent knowledge promotion.

### 5. Documentation contracts need executable evidence

The [state machine](https://github.com/afmanu/claude-obsidian-second-brain-installer/blob/9cb05973a04b6e2b945fac591ccec8bf6f43f85c/specs/setup-state-machine.md) documents 26 states, but the snapshot contains no implemented installation engine, test suite, CI or persistent state file. It does contain assistant-executable instructions. MCP root listing does not prove writes, correct classification or continuity.

The contract allows replacing unchanged generated files but supplies no installed manifest with versions/hashes to reproducibly distinguish them from customized files.

**Proposed change:** record versions, completed/verified steps, managed files/hashes; revalidate dependencies on resumption. Produce change plans and preserve customization. Repeated updates must be idempotent. Recovery reverts its own changes without undoing later user edits. Checking read versions before writes reduces agent-to-agent overwrites.

### 6. Evaluation must measure the selected purpose

[AIS-OS audit](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/audit/SKILL.md) contributes retrieval tests and operational evidence; history distinguishes new, open, resolved and unreviewed findings. This discipline transfers well.

Its [rubric](https://github.com/nateherkai/AIS-OS/blob/ce9cb93a1145da5daba84ea37208ec35fd03606e/.claude/skills/audit/rubric.md) caps scores without demonstrated automated cadence. In a manual Second Brain that absence may be deliberate. Evaluate integrity/retrieval, continuity and workflows separately; recurrence applies only to enabled modules. Closing findings always needs new evidence.

## Proposed architecture

Subsequent development: [Second Brain and AI OS baseline architecture](architecture-v0.2.md) details the construction principles/contracts requested by Manu. This review preserves the supporting findings.

### One core, two usage cycles

The core retains purpose, confirmed preferences, rules, routes, reusable knowledge, decisions and provenance. Distinguish current state from explanatory history, following Compiled Truth + Timeline (historical vault reference; not required for implementation).

**Second Brain:** capture → contextualize → apply → distill → connect → review. Clear classification permits direct entry; one note per step is unnecessary.

**AI OS:** receive objective → retrieve context → execute workflow → validate deliverable → update state/learning → repeat if appropriate.

Both cycles share decisions, projects and preferences. Operational results may feed memory with selective promotion/evidence; not every output/hypothesis becomes a permanent rule. Recurrence requires a real scheduler, source access and run evidence.

### Public distribution and installed system

Illustrative distribution layout:

```text
README.md             entry: purpose and first result
core/                 shared contracts, schema and logical routes
skills/               canonical workflow sources
modules/              second-brain/ai-os definitions without duplicate skills
presets/              initial preferences and composable examples
adapters/             environment entry points and packaging
installer/            planning, application, state, adoption and updates
tests/                fixtures and behavioral checks
docs/                 design, use, compatibility and contribution
```

The installed vault retains its knowledge layers: here, `00_Inbox` through `06_Archive`, `_system` and `_templates`. The installer need not be copied in full into the vault. Public distribution contains contracts, synthetic examples and tools; personal data belongs to each installation.

Proposed common installed sources: `_system/system-contract.md` for rules, `_system/vault-config.yaml` for routes/modules/schema, and an installation manifest for managed files/version. These names are proposals; adoption should reuse equivalent sources without another truth copy. Entry manuals summarize essentials and refer to them; changing inventories live in their hubs.

### Capability-based portability

| Verified capability | Possible behavior |
|---|---|
| Authorized vault reads/writes | File-based capture, retrieval, links and continuity. |
| Read-only access | Analysis/change proposals. |
| Command execution | Necessary dependency installation/validators, subject to permissions. |
| Connector/MCP in the consuming session | Operations on the source actually exposed. |
| Scheduler and sources available during execution | Recurring workflows with verifiable traces. |
| No persistent access | Content preparation and explicit handoff. |

At review time, Codex discovers skills through `.agents/skills`; Claude Code documents `.claude/skills` and compatibility with `.claude/commands`; Cowork distributes plugins. Shared sources may therefore require different packages/entry points. Copying folders does not prove loading.

Cowork documentation consulted during the review covers web, desktop and mobile sessions with specific conditions for local-file access through desktop. The May installer should replace static classification with real-access detection. Declare compatibility by version, surface and tested capability, not universal product equivalence. Recheck these historical observations during implementation.

Official sources: [Codex skills](https://learn.chatgpt.com/docs/build-skills), [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Claude Code skills](https://code.claude.com/docs/en/skills), [Cowork plugins](https://claude.com/docs/cowork/guide/plugins), [Cowork surfaces](https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile).

## Proposed implementation sequence

1. **Consolidate the current contract.** Compare manuals, establish current rules, separate policies/inventories and generate equivalent entry points. Preserve history; no mass migration yet.
2. **Package a minimal version.** Local Markdown, Second Brain core, capture, retrieval and continuity. Reuse Agent-Guided Installer Framework (historical vault reference; not required for implementation); compare its documented design with code before incorporation.
3. **Test creation/adoption.** Use new fixtures and a test vault copy with synthetic/minimal data. Simulate interruption, resumption, updates and customization.
4. **Validate two local runtimes.** Run identical cases in Codex/Claude Code, then package/test Cowork against actual capabilities. Untested environments stay pending.
5. **Add a useful operational workflow.** For example, resume a project and produce a sourced brief. Audit, correct a failure and repeat. Add external connections/cadence when the case needs them.

This sequence matches the earlier stop-conceptual-expansion-and-package decision (historical vault reference; not required for implementation).

## Acceptance criteria

- New sessions find purpose, rules and next step without extensive manual reconstruction.
- Captured decisions retain meaning, origin and project regardless of profile.
- Resolving references does not duplicate notes and leaves valid links for useful relationships.
- Legacy notes remain retrievable without mass renaming/rewriting.
- Adoption recognizes vault equivalents without imposing old-contract files.
- Repeated installation/updates neither duplicate content nor overwrite customizations.
- Interrupt/resume checks requirements and continues from persisted evidence.
- Another runtime retrieves the same state and honors the same contract; tool differences are documented.
- Workflows produce verifiable artifacts and retain relevant learning only.
- Audits detect known defects, verify repairs and preserve history. Test cadence only when enabled.

## Activation Map

- **Activated regions:** AutoBrain/Second Brain (high); agent/installer design (high); operational evaluation (medium). No personal data from other areas is incorporated.
- **Reused notes:** Knowledge Flow, Project States, Neural Vault Protocol (historical vault references; not required for implementation), Compiled Truth + Timeline and Agent-Guided Installer Framework.
- **New note:** applied research within the existing project; no new framework/project.
- **Applied connections:** this review updates AutoBrain context and informs [the earlier architectural synthesis](memory-and-control-analysis.md).
- **Proposed connections:** reuse installer-framework contracts and AIS-OS evaluation. This implies neither installed code dependencies nor adoption of all their policies.
- **Interpretation risks:** stated origin versus unreconstructed Git history; design versus implementation; static parity versus behavior; system update versus content normalization.

[Back to the project](../README.md)
