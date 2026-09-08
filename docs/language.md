# Repository language and runtime localization

The repository is maintained in English, following Manu's instruction on 2026-09-08. This includes documentation and historical reviews, comments, development messages, schemas, synthetic examples, package metadata and new GitHub descriptions/commits. This change does not advance M3 or rewrite Git history.

## Spanish CLI interaction

The CLI defaults to English. Select Spanish explicitly:

```bash
node dist/cli/main.js --lang es --help
MANU_CONTROL_CENTER_LANG=es node dist/cli/main.js --help
```

`--lang en|es` may appear before or after a command and takes precedence over `MANU_CONTROL_CENTER_LANG`. Unsupported languages, missing values and repeated flags fail before command dispatch. No system locale is inferred, so scripts have a predictable default.

Help, invalid-command guidance and an additive `display_message` on structured errors are localized. Canonical diagnostic `message`, details, JSON keys, enums, command names, exit codes and successful machine output remain unchanged. Localization resources live in `cli/locales/`; it is intentional for the Spanish resource to contain Spanish. This is deterministic CLI localization, not an LLM translation service. Conversational runtime behavior remains M3 work.

Requests and knowledge may contain Spanish or any other Unicode text. The language option never translates a request, source, project purpose, plan, identifier, revision or stored artifact. Plans generated from the same request and observation have the same digest in either CLI language.

## Existing plans and instances

M2 shipped three Spanish catalog descriptions inside hashed installation plans. New plans use English descriptions. The executable definitions, versions, capabilities and instance specifications are unchanged.

The builder recognizes exactly two trusted catalog metadata variants: the current English catalog and the original M2 catalog reconstructed from immutable labels in `builder/locales/es.ts`. This compatibility resource is another intentional language exception. Plan validation still reconstructs the entire plan and checks its digest; arbitrary descriptions, changed capabilities or forged operations are rejected even if a caller recomputes the digest.

Replanning an existing instance preserves its catalog variant when the observed catalog hash matches the original M2 catalog. Applying or resuming an original plan preserves that plan and its hash. This is metadata compatibility, not a migration mechanism or permission to overwrite an existing catalog. Manu's private request, original plan and foundation instance remain outside the repository and retain their original content.

## Historical sources and evidence

The English documents are translations of the repository at `f8902560b379202ef216a19806e3b822356a7e15`, with current status and this language decision recorded separately. Original Spanish documents remain available in Git history. Translation preserves the design, identifiers, attribution and limitations; it does not turn historical proposals into current decisions.

Exact historical source paths in `references/source-map.json`, proper names and external URLs retain their spelling so provenance remains resolvable. Historical source hashes, inventory hashes and M0–M2 verification records still refer to the original bytes and releases. They are not regenerated to claim verification of translated files. The root documentation inventory describes the current files.

[Decisions](decisions.md) · [Development](development.md) · [Home](../README.md)
