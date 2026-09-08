export const help = (version: string) => `Manu Control Center ${version}

Usage:
  manu-control-center [--lang en|es] <command>
  manu-control-center --help
  manu-control-center --version
  manu-control-center doctor
  manu-control-center validate-record <file.json>
  manu-control-center contracts
  manu-control-center validate <kind> <file.json>
  manu-control-center validate-bundle <file.json>
  manu-control-center resolve <request.json> <absolute-directory>
  manu-control-center plan <request.json> <absolute-directory>
  manu-control-center inspect <request.json> <absolute-directory>
  manu-control-center apply <plan.json> --actor <id>
  manu-control-center verify <request.json> <absolute-directory>
  manu-control-center create <request.json> <absolute-directory> --actor <id>
  manu-control-center adopt <request.json> <absolute-directory> --actor <id>
  manu-control-center resume <request.json> <absolute-directory> --actor <id>
  manu-control-center capture <request.json> <absolute-directory> <source-id> --actor <id> --key <key> (--file <path> | --text <text>) [--expected-revision <revision>]
  manu-control-center source <request.json> <absolute-directory> <source-id> --actor <id> [--revision <revision> | --as-of <timestamp>]
  manu-control-center source-history <request.json> <absolute-directory> <source-id> --actor <id> [--limit <n>] [--after-revision <revision>]
  manu-control-center search <request.json> <absolute-directory> <text> --actor <id> [--limit <n>] [--after <source-id>] [--valid-at <timestamp>] [--as-of <timestamp>]
  manu-control-center context <request.json> <absolute-directory> --actor <id> [--limit <n>] [--after <source-id>] [--valid-at <timestamp>] [--as-of <timestamp>]
  manu-control-center claim <request.json> <absolute-directory> <operation.json> --actor <id>
  manu-control-center decision-propose <request.json> <absolute-directory> <operation.json> --actor <id>
  manu-control-center decision-grant <request.json> <absolute-directory> <operation.json> --actor <id>
  manu-control-center decision-revoke-grant <request.json> <absolute-directory> <operation.json> --actor <id>
  manu-control-center decision-set <request.json> <absolute-directory> <operation.json> --actor <id>
  manu-control-center artifact-draft <request.json> <absolute-directory> <operation.json> --actor <id>
  manu-control-center artifact-approve <request.json> <absolute-directory> <operation.json> --actor <id>
  manu-control-center artifact-fork <request.json> <absolute-directory> <operation.json> --actor <id>
  manu-control-center sources-check <request.json> <absolute-directory> <operation.json> --actor <id>
  manu-control-center knowledge <request.json> <absolute-directory> <claim|decision|artifact> --actor <id> [--as-of <timestamp>] [--text <text>] [--limit <n>] [--after <id>] [--valid-at <timestamp>]
  manu-control-center coordinator-<submit|claim|renew|pause|advance|review|revise|authorize|cancel|reconcile|retry> <request.json> <absolute-directory> <operation.json> --actor <id>
  manu-control-center coordinator-read <request.json> <absolute-directory> <run-id> --actor <id>
  manu-control-center workflow-prepare <request.json> <absolute-directory> <operation.json> --actor <id>
  manu-control-center workflow-read <request.json> <absolute-directory> <run-id> --actor <id>
  manu-control-center workflow-complete <request.json> <absolute-directory> <review.json> --actor <id>
  manu-control-center knowledge-record <request.json> <absolute-directory> <id> --actor <id> --kind <claim|decision|artifact> [--revision <revision> | --as-of <timestamp>]

doctor checks SQLite using temporary data and shows the intended data location.
validate-record checks RecordEnvelope metadata only (0.1.0-draft).
The local constructor is available. Planning does not write to the destination.
Local UTF-8 capture and provenance-aware queries are available. Agent invocation is pending in M3.5.
Review commands record explicit owner decisions; source text never grants approval.
Temporal flags: --as-of <UTC-timestamp> selects recorded history; --valid-at filters explicit claim validity or declared source availability.
Local human-reviewed meeting-to-brief and project-status workflows are available. Real runtime invocation remains pending.
The coordinator persists steps, leases and effect receipts. Delivery is simulator-only; --simulate confirm|lose_response|no_effect|unavailable applies to advance/reconcile.
Language: --lang en|es or MANU_CONTROL_CENTER_LANG (default: en).
Language affects help and error summaries; JSON keys, diagnostics and user data stay unchanged.
`;
export const invalidArguments = 'Invalid arguments. Run manu-control-center --help.';
