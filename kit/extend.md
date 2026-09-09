# Extend an AI OS capability

Use this recipe for a user-selected workflow, not unsolicited skill proliferation. Read the workspace instructions and relevant existing skill definitions/resources. Search installed core and personal skills before proposing a new name. Reuse a matching capability for an overlapping request; adapt it when the requested difference is real.

For the selected capability, establish purpose/trigger, input and source routes, output location, necessary tools, scope/authorization, failure behavior and one useful example. Reuse supplied information. Add a small script only when repeated deterministic work needs it; ordinary agent reasoning does not require a new runner or API wrapper.

## One maintained definition

Core product skills are maintained in the distribution's `kit/skills/`; do not edit a generated core mirror as the only source. In a personal workspace, user-created skills belong in `.mcc/skills/<name>/`, separate from the installed product snapshot. This is the canonical personal source shared with host entries, not a second independently maintained copy. Include `SKILL.md` with YAML `name` and `description`; keep automatic selection enabled. Put needed templates/scripts beside the definition and use resolvable resource paths.

For the verified Codex host, expose a personal skill through `.agents/skills/<name>` pointing to the canonical folder when symlinks are supported. Inspect the destination first; do not replace an existing directory, symlink or same-name definition silently. If the host/filesystem cannot use a symlink, record the limitation and generate a host copy with verified resource paths, documenting its canonical origin and transform. Never leave two conflicting discoverable identities under the same name. If the host protects its discovery directory, use its approved write/approval path or leave exposure pending; do not bypass the restriction. An exact canonical route in the workspace entry can support explicit use in the meantime, but is not proof of automatic discovery. Other hosts still need their own verification.

Use an available skill-authoring guide when useful; absence of an optional initializer is not a reason to stop writing a small valid skill. Keep instructions narrow, preserve existing conventions and do not install global skills unless requested.

## Verify useful behavior

Read the saved definition and resolve every required resource from its actual location. Check discovery separately from file existence: a fresh host session should identify and use the capability for its intended request. Execute one bounded example with permitted inputs and inspect the actual output against its sources and acceptance criteria. Record present/discovered/exercised evidence honestly; if a fresh session cannot be checked, leave discovery unverified.

Link the canonical skill and a concise trigger/example from the personal capability route. Save a reusable SOP after a successful workflow when requested or directly useful. A later overlapping request reuses that source and its resources. Do not claim approval, publication, due execution or universal reliability from one example.
