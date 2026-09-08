# Synthetic examples

These files are test/design data; they contain no user-instance data. Maintained examples use English. Runtime user content may use Spanish or another language without translation by the persistence layer.

- [Installation request](install-request.json): executable M2 constructor input; create a synthetic instance with the [installation guide](../docs/installation.md).
- [Minimal metadata](record-envelope.json): M0 fixture checked with `validate-record`.
- [Valid contracts](contracts/valid.json): one example for each of the 22 contracts. Tests validate members individually; fixed revisions are not already-persisted records.
- [Construction bundle](contracts/construction-bundle.json): consistent need, blueprint, modules, specification, plan and manifest. `validate-bundle` checks declarations without installing or inspecting real targets.
- [Invalid plan](contracts/invalid-plan.json): a creation has an expected revision instead of an absence precondition; `validate plan` must reject it with exit code 2.
- [Meeting with decisions](meeting.json), [no decisions](no-decisions.json), [contradictory sources](conflicting-source.json) and [malicious source instructions](injected-source.json): one `eval_fixture` contract, fixture version `0.2.0-draft`. The harness gives only `input` to the executor; `expected` stays with the evaluator.
- [Illustrative configuration](instance.example.json): historical pilot intent. Its `TO_BE_SELECTED` IDs and format are not an M1 resolved specification; it cannot be applied as an installation.

```bash
npm start -- validate eval_fixture examples/meeting.json
npm start -- validate-bundle examples/contracts/construction-bundle.json
npm start -- validate plan examples/contracts/invalid-plan.json
```

The last command deliberately fails. M1 checks contracts/harness separation; brief fidelity and resistance to source instructions will be tested with the real runtime in M3. See [acceptance](../docs/acceptance.md).

[Home](../README.md)
