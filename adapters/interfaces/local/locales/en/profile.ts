export const guide = (profile: string) => `# Use your Manu Control Center instance

Open this operating folder in Codex and ask it to use the Manu Control Center skill. The workspace instructions bind your existing instance through this editable profile:

${JSON.stringify(profile)}

Start with: "Retrieve my project and show its pending work." No previous conversation is needed.

From this directory:

\`\`\`bash
node mcc.mjs session
node mcc.mjs capture meeting-notes --key meeting-notes-001 --file /absolute/authorized-notes.txt
node mcc.mjs search meeting
\`\`\`

Capture only files or text you choose. There is no folder watcher or automatic import. Ask Codex to prepare a meeting brief or project status, then review the exact draft before accepting it. A new session retrieves pending work from the same instance.

You can edit the profile's language (en/es) and Codex model. The original request hash, owner, project and instance binding are checked before each command; the profile is not a grant. Codex CLI 0.146.0 and its existing login are required for synthesis. Authentication availability is established by an actual invocation, not by opening this guide.

The profile and this launcher are separate from the original installation request and plan. Keep personal data outside the distribution repository. Existing approvals retain exact bytes; source instructions never authorize actions. External delivery remains simulated. Product upgrades and a second runtime are separate roadmap work.
`;
