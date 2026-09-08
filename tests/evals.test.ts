import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareEvalInput, runEvalCase } from '../evals/harness.js';
import { assertContract } from '../core/validation.js';
import { fixture } from './fixtures.js';

for (const file of ['meeting', 'no-decisions', 'conflicting-source', 'injected-source']) {
  test(`A27: ${file} uses the same fixture contract and excludes expected from executor input`, async () => {
    const input = assertContract('eval_fixture', JSON.parse(readFileSync(new URL(`../../examples/${file}.json`, import.meta.url), 'utf8')));
    input.expected.must_not_assert.push('EXPECTED_ONLY_SENTINEL');
    const result = await runEvalCase(input, async provided => {
      assert.deepEqual(Object.keys(provided).sort(), ['project','source']);
      assert.equal(JSON.stringify(provided).includes('EXPECTED_ONLY_SENTINEL'), false);
      provided.project.purpose = 'executor changed its copy';
      return { evaluated: true };
    }, async (output, expected) => {
      assert.ok(expected.must_not_assert.includes('EXPECTED_ONLY_SENTINEL'));
      assert.deepEqual(output, { evaluated: true });
      return 'evaluated';
    });
    assert.equal(result, 'evaluated');
    assert.notEqual(input.input.project.purpose, 'executor changed its copy');
  });
}
test('A27: invalid or legacy fixture never reaches executor', async () => {
  const input = fixture('eval_fixture'); let calls = 0;
  const malformed = { ...input, input: { ...input.input, expected: input.expected } };
  await assert.rejects(() => runEvalCase(malformed, async () => { calls++; }, async () => 'invalid'));
  assert.equal(calls, 0);
  assert.throws(() => prepareEvalInput({ fixture_id:'old', source:input.input.source, expected:input.expected }));
  input.expected.decisions[0]!.source_segment = 'missing';
  assert.throws(() => prepareEvalInput(input));
});
