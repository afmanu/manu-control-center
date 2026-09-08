import type { ExpectedBrief } from '../core/models.js';
import type { MeetingCategory } from '../core/workflows.js';

/** Held-out category/segment oracle. It does not judge meanings or certify semantic truth. */
export function evaluateMeetingCategories(output: { segment_id: string; category: MeetingCategory }[], expected: ExpectedBrief) {
  const failures: { criterion: string; segment_id: string }[] = [];
  for (const [key, category] of [['decisions', 'agreement'], ['proposals', 'proposal'], ['open_questions', 'open_question']] as const) {
    const wanted = new Set(expected[key].map(item => item.source_segment));
    const actual = new Set(output.filter(item => item.category === category).map(item => item.segment_id));
    for (const segment_id of wanted) if (!actual.has(segment_id)) failures.push({ criterion: `missing_${category}`, segment_id });
    for (const segment_id of actual) if (!wanted.has(segment_id)) failures.push({ criterion: `unexpected_${category}`, segment_id });
  }
  return { scope: 'fixture_category_and_segment_only', passed: failures.length === 0, failures, semantic_review_required: true, review_material: { expected_meanings: expected, must_not_assert: expected.must_not_assert } };
}
