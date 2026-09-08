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

doctor checks SQLite using temporary data and shows the intended data location.
validate-record checks RecordEnvelope metadata only (0.1.0-draft).
The local constructor is available. Planning does not write to the destination.
Agents and workflows: M3.
Language: --lang en|es or MANU_CONTROL_CENTER_LANG (default: en).
Language affects help and error summaries; JSON keys, diagnostics and user data stay unchanged.
`;
export const invalidArguments = 'Invalid arguments. Run manu-control-center --help.';
