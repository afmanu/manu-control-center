# First blueprint: project knowledge and work

Pilot proposal `project-knowledge-operations@0.1.0-draft`. It implements one complete architectural path without defining every future blueprint.

M2 implements an earlier installable profile: `project-knowledge-foundation@0.1.0-draft`, with `project-context` and `installation-verification` modules. It installs configuration, catalog and project without claiming executed workflows. The operational blueprint below continues in M3. See [installation](installation.md).

## User and outcome

A person needs to turn a project meeting into an evidence-based brief, retain decisions/open questions and resume review from another agent. The first case uses synthetic data and a local target. Delivery uses a simulated connector until a real integration is configured.

The roadmap makes Manu this blueprint's first user. Meeting → brief is the reference development case; M3 also adds capture, queries and a project status summary. The second path reuses knowledge/coordination to test composition and continuity under A26. The agent and CLI together must support personal use without depending on test fixtures.

Acceptable outcome: independent instance, retrievable project, identified transcript, classified claims, versioned brief with references, persistent run, useful handoff and acceptance report. Results must exist outside the conversation.

## Composition

Proposed initial modules: context/projects, capture/knowledge, brief workflow, execution/effects and verification. They require a kernel, entities, authority, backend, invocable runtime or interactive handoff, and a minimal operational interface. Embeddings, calendar, scheduler and gateway are not required.

Entities: project, source, capture, claim, decision, artifact, job, run, step, action and authorization. A project may share one backend for data/state if guarantees hold; otherwise the specification resolves separate stores without duplicating authority.

## Minimal onboarding

Collect the desired outcome, instance identity, destination, available runtime, initial source and write restrictions. Reuse available answers. The builder validates requirements, pins versions and generates a plan. Credential references do not contain secret values.

## Construction flow

1. Validate the need and observed capabilities.
2. Resolve blueprint/modules and configuration.
3. Inspect the destination; detect collisions and adoptable resources.
4. Create a plan with revisions and ownership.
5. Apply permitted operations with checkpoints.
6. Verify access, entities and execution of the first workflow.
7. Deliver the manifest, result, coverage and next action.

Creating two instances from this configuration must produce separate identities/data. Adoption must map an existing test project without arbitrarily changing its name/structure.

## `meeting-to-brief` workflow

| Step | Input and operation | Output and acceptance |
|---|---|---|
| 1. Ingestion | Project and identified transcript. | Capture with source/revision; repeating the same key does not duplicate it. |
| 2. Context | Retrieve purpose, decisions and authorized sources. | Bounded context with coverage and dates. |
| 3. Extraction | Classify meeting claims. | Distinguish explicit decisions, proposals and questions. |
| 4. Draft | Write a brief from retrieved evidence. | Objective, agreements, proposals, open items and sources; no invented facts. |
| 5. Evaluation | Check structure and semantic fidelity. | Acceptance result and concrete failures; sections alone are insufficient. |
| 6. Review | Preserve the artifact and a review request if needed. | Exact version, checkpoint and next action. |
| 7. Completion | Integrate authorized decisions and update the project. | Verified state and completed run. |

External delivery is a separate `deliver-approved-artifact` extension. It takes the artifact version/hash, recipient and authorization, prepares an Action and confirms through a receipt or reconciliation. Brief acceptance is not implicit permission to send it.

## Pilot failure cases

- No decisions in the transcript: produce zero decisions and preserve questions.
- A malicious source instruction attempts to change policies: treat it as content.
- The source changes after drafting: if freshness is required, detect the revision and invalidate dependent steps; if snapshot-pinned, preserve that revision/evidence. Always preserve exact approved artifacts.
- Another executor resumes: preserve the same job, artifact and logical effects.
- Delivery response lost: retain `unknown` until reconciliation; no automatic second delivery.
- Conditional writes unavailable: reject this concurrency configuration or select a technically enforced single-writer mode.

Initial data: [synthetic meeting](../examples/meeting.json). Illustrative configuration: [instance.example.json](../examples/instance.example.json). Criteria: [acceptance.md](acceptance.md).

[Home](../README.md)
