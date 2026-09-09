# K1 practical verification

Date: 2026-09-09. Kit version: `0.1.0-k1`. Host: Codex CLI `0.146.0` on macOS. Status: **K1 passed these bounded cases**; K2–K4 remain pending.

## Delivered surface

[The kit entry](../kit/START-HERE.md) routes to four canonical skills: [setup](../kit/skills/mcc-setup/SKILL.md), [context](../kit/skills/mcc-context/SKILL.md), [capture](../kit/skills/mcc-capture/SKILL.md) and [project work](../kit/skills/mcc-project/SKILL.md). Shared guidance, templates and a small copy helper support them. No application runtime is part of this delivery.

## Method and bounded cases

Actual `codex exec` processes used the existing host login, `--ignore-user-config`, `--ephemeral`, `--sandbox workspace-write`, `--skip-git-repo-check`, JSON event output and separate final-answer files. Continuation/adoption checks used medium reasoning effort. Each invocation started fresh; no previous conversation or resume identifier was supplied. Prompts and logs lived outside the personal test folders. The kit was copied into a standalone temporary distribution, separate from both test workspaces and this repository.

| Case | Request and observation |
|---|---|
| New setup and useful work | From the kit entry, set up a new folder for synthetic user Alex, capture the Harbor planning source and prepare a sourced status/action brief. Codex installed and read the setup/capture/project procedures, personalized the workspace and saved the source, project hub, draft and session continuity. |
| Unavailable source and authority | The supplied local planning source was read and registered. The synthetic external task board was recorded as unavailable without a network check. The output does not claim live task status. |
| Source meaning and scoped context | The captured substantive source paragraphs match the input. The draft retains the six-person pilot and Riley's feedback responsibility, leaves the date and budget unresolved, and labels public registration as an unaccepted proposal. Project/team facts were absent from global context. |
| Fresh-session continuation | In a new process, use context/project skills to find the existing work and prioritize the exercise-success check in a revision. The session read `mcc-context` and `mcc-project`, found the source and prior draft, created a linked revision, and updated the hub and workspace entry. Before/after SHA-256 checks confirmed the prior draft, captured source and global context were unchanged; one revision was added and no files were removed. |
| Customized adoption | An existing fixture has `Contexto.md`, `Proyectos/Harbor/Inicio.md`, `Fuentes/harbor-planning.md`, Spanish metadata keys, custom AGENTS.md rules and an unrelated note. Setup mapped these routes, reused the existing source and wrote the brief in `Proyectos/Harbor/Entregables/`. Context, source and unrelated-note hashes were unchanged. The custom AGENTS.md prefix and hub metadata were preserved; only an entry route and useful hub content were added. There was one source and no duplicate default `projects/` or `sources/` folder. |
| Repeat and no-save | In another fresh process, verify completed setup and provide a hypothetical alternative only in chat. The agent recognized completed setup, used the installed helper in preview mode and returned the hypothetical only in chat. All 34 workspace files had identical before/after SHA-256 hashes; no source/output was duplicated, and the temporary marker was absent from every workspace file. |

The fixture input is [project-source.md](../kit/examples/project-source.md). A starting prompt is in [the example guide](../kit/examples/README.md). For continuity, ask to find Harbor's previous brief and create a linked revision that moves the exercise success check first, explicitly stating that this is a proposed action-order change rather than a team decision. For adoption, create the custom routes above and ask to adopt them, reuse the existing source and preserve custom metadata. For no-save, request a hypothetical nine-person alternative in chat while keeping the confirmed six-person pilot unchanged.

## File-level checks

Seven standard-library tests in [test_kit.py](../scripts/test_kit.py) pass: preview without writes, adoption and repeated copy, conflicting kit-owned files, symlink redirection, partial-copy recovery, generated skill resource routes, and refusal to use the distribution as the personal destination. The repeated-copy check also runs the installed helper without requiring the original distribution.

The skill creator's frontmatter validator accepted all four canonical SKILL.md files. This is a development check, not an added kit dependency. [Documentation checks](development.md) validate repository links and fences; their success is separate from observed agent behavior.

Independent final inspection resolved 51 Markdown links/anchors in the new workspace and 39 in the adopted workspace, with no missing targets or headings. The first brief and captured source stayed byte-identical across continuation; only the workspace map/hub changed and a revision was added. The adopted canonical context, original source and unrelated note also remained byte-identical. The generated kit resources matched the canonical distribution.

The final staged tree also passed the documentation check (29 Markdown files, 101 local links), all seven helper checks and whitespace checks in a clean export. This confirms the checks do not depend on ignored files from the working checkout; it is not the full K4 release verification.

The first restricted attempt to start Codex failed before running the workflow because the surrounding sandbox prevented initialization of the host app-server/state. The run was repeated with execution permission for the existing host while keeping the nested agent's workspace-write sandbox. The kit creates no database; Codex maintains its own host state. This host launch issue is not counted as a successful kit run. The agent attempted `git diff` during continuation (exit 129) and `git status` during the repeated-setup check (exit 128). The synthetic workspaces were deliberately not Git repositories; direct file readback, independent link checks and before/after hashes verified the results. Personal workspaces do not require Git.

## Limits

These are bounded synthetic local-file cases, not a broad reliability benchmark. Skill files were made available and the relevant procedures/resources were exercised; this does not establish all UI discovery, duplicate-identity or cross-host cases reserved for K4. No real accounts, personal schedules, original vault or installed application were changed. No-save evidence concerns the workspace files; the host's own prompt/log retention is separate.

K2–K4 remain required. Advanced memory correction/relationships/synthesis, richer workflows, public-output scope cases, audit/improvement, custom skill building, upgrades, second-host support, URL intake, explorer and scheduling are not established by K1. See [the delivery mapping](kit-conversion.md#quality-coverage-and-delivery-mapping).
