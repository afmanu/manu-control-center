# Background and provenance

Optional reference material. Current architecture and product decisions prevail over these historical proposals. Migrated texts preserve conceptual content, remove vault metadata and convert links; historical targets not included here are contextual references, not implementation dependencies. The English translation retains design meaning and attribution; original Spanish text remains in Git history at `f8902560b379202ef216a19806e3b822356a7e15`. See [translation provenance](../docs/language.md).

| Document | Role |
|---|---|
| [Memory and control analysis](memory-and-control-analysis.md) | Initial synthesis of the vault pattern and comparison with AIS-OS. |
| [Installer review](installer-review.md) | Findings on construction, adoption, updates and decoupling. |
| [Architecture v0.2](architecture-v0.2.md) | Background for backend/runtime-independent scope. |
| [Shared conversation review](shared-conversation-review.md) | Coverage of sixty sections, thirteen adjustments and limits. |
| [Backend model](backend-model.md) | Entities before representation. |
| [Installer framework](installer-framework.md) | Earlier architecture for guided installation. |

## Original sources consulted in prior work

- [Original installer](https://github.com/afmanu/claude-obsidian-second-brain-installer), inspected snapshot `9cb05973a04b6e2b945fac591ccec8bf6f43f85c`.
- [AIS-OS](https://github.com/nateherkai/AIS-OS), inspected snapshot `ce9cb93a1145da5daba84ea37208ec35fd03606e`.
- [Shared conversation](https://chatgpt.com/share/6a9fb953-4dd4-83eb-82da-79510772401c): this package contains its review, not the complete transcript.

In the 2026-09-08 session, Manu supplied [another conversation link](https://chatgpt.com/share/6a9fb943-0ab4-83eb-ae6d-715dcafc3e98), read and compared with both repositories. Its title/structure match the retained review; byte-for-byte identity between links is not certified. Inspected repository snapshots match the commits above. This consultation reinforces context; current instructions and local design retain authority.

These commits identify the inspected analysis snapshots, not the latest commits. Code observations were static and do not prove operational installations. Recheck external-product claims against official documentation when implementing each adapter.

The user-supplied Three Ms and Four Cs example informed methodological clarity. Names/attributions belong to their author and are not adopted as this product's branding. Useful conclusions are recorded in the analyses. No code or complete skills were copied from the original repositories.

[Source and transformation map](source-map.json). The full old hub is omitted because it mixes May status from another repository with this project; it does not establish current implementation. Current continuity lives in the [handoff](../docs/handoff.md).

The [original handoff manifest](package-manifest-handoff-2026-09-08.json) preserves the inventory/checks before the roadmap. The [roadmap manifest](package-manifest-roadmap-2026-09-08.json) preserves the following documentation delivery before M0. Both are historical and do not validate later file changes. Their file hashes still identify original snapshot bytes, not translated files. The [root manifest](../package-manifest.json) records current documentation/schemas; verify/regenerate it with the [development commands](../docs/development.md).

[Home](../README.md)
