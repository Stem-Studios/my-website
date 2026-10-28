import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import {
  questionSchema,
  validatePack,
  contentHash,
  reviewTemplate,
  approveSelection,
  compileImport,
} from '../scripts/lib/arena-content.mjs';
import { questions as publicQuestions } from '../src/data/questions';

// Public, synthetic test fixture. Never part of the private question pool.
const q = {
  id: '12345678-1234-4123-8123-123456789012',
  slug: 'synthetic-test-only',
  version: 1,
  exam: 'TMUA',
  difficulty: 'Intermediate',
  module: 'Mathematics',
  topic: 'Synthetic test',
  syllabus: { url: 'https://example.com/test-fixture', section: 'Test only' },
  text: 'Synthetic fixture only: what is 2 + 3?',
  options: ['1', '2', '3', '4', '5'],
  correctIndex: 4,
  solution: 'Test-only fixture: counting two objects and three further objects gives five objects.',
  author: 'Synthetic fixture author',
  publication: 'private-draft',
  status: 'pending-independent-review',
};
function reviewed(question = q) {
  return {
    id: question.id,
    contentHash: contentHash(question),
    status: 'approved',
    reviewer: { name: 'Synthetic Human Fixture', kind: 'human', independent: true },
    reviewedAt: '2026-01-01T00:00:00Z',
    answerIndex: question.correctIndex,
    independentWorking:
      'Test-only attestation: count five objects, confirming that exactly the last option is correct. This is not a real human review.',
    checks: {
      uniqueAnswer: true,
      solution: true,
      syllabus: true,
      difficulty: true,
      wording: true,
      privateOriginal: true,
    },
  };
}
describe('Arena content approval boundary', () => {
  it('requires five distinct options, an in-range integer key, a solution and valid metadata', () => {
    expect(questionSchema.safeParse(q).success).toBe(true);
    for (const change of [
      { options: ['1', '2', '3', '4'] },
      { options: ['1', ' 1 ', '3', '4', '5'] },
      { correctIndex: 5 },
      { correctIndex: 1.5 },
      { solution: 'short' },
      { exam: 'ESAT' },
      { status: 'verified' },
    ])
      expect(questionSchema.safeParse({ ...q, ...change }).success).toBe(false);
  });
  it('rejects duplicate questions and public practice stems; demo verification is not assumed', () => {
    expect(() => validatePack({ schemaVersion: 1, questions: [q, q] })).toThrow(/Duplicate/);
    expect(() =>
      validatePack(
        { schemaVersion: 1, questions: [{ ...q, text: publicQuestions[0].text }] },
        publicQuestions,
      ),
    ).toThrow(/ineligible/);
    expect(publicQuestions.every((question) => !question.verified)).toBe(true);
  });
  it('creates pending reviews with no pre-filled approvals or answer keys', () => {
    const review = reviewTemplate([q]).reviews[0];
    expect(review.status).toBe('pending');
    expect(review.answerIndex).toBeNull();
    expect(Object.values(review.checks).every((v) => v === false)).toBe(true);
    expect(() => approveSelection([q], { reviews: [review] })).toThrow();
  });
  it('requires a named independent human, matching answer and all review checks', () => {
    const base = reviewed();
    for (const review of [
      { ...base, reviewer: { ...base.reviewer, kind: 'AI' } },
      { ...base, reviewer: { ...base.reviewer, independent: false } },
      { ...base, reviewer: { ...base.reviewer, name: q.author } },
      { ...base, answerIndex: 0 },
      { ...base, checks: { ...base.checks, uniqueAnswer: false } },
      { ...base, independentWorking: 'Approved' },
    ])
      expect(() => approveSelection([q], { reviews: [review] })).toThrow();
    expect(approveSelection([q], { reviews: [base] })).toHaveLength(1);
  });
  it('invalidates approval after changes to wording, options, answer, solution or metadata', () => {
    for (const change of [
      { text: q.text + ' Revised.' },
      { options: ['0', '2', '3', '4', '5'] },
      { correctIndex: 3 },
      { solution: q.solution + ' Revision.' },
      { difficulty: 'Challenge' },
      { version: 2 },
    ])
      expect(() => approveSelection([{ ...q, ...change }], { reviews: [reviewed()] })).toThrow(
        /changed/,
      );
    expect(contentHash({ ...q })).toBe(
      contentHash(Object.fromEntries(Object.entries(q).reverse())),
    );
  });
  it('records explicit human confirmation without fabricating independent working', () => {
    const { independentWorking, ...base } = reviewed();
    expect(independentWorking).toBeTruthy();
    const review = {
      ...base,
      attestation: {
        kind: 'human-chat-confirmation',
        statement:
          'Synthetic test-only confirmation: I checked all sixty questions; no corrections required.',
        scope: 'all-60-questions',
        noCorrectionsRequired: true,
        recordedAt: '2026-01-01T00:00:00Z',
      },
    };
    const result = approveSelection([q], { reviews: [review] });
    expect(result[0].review.independentWorking).toBeUndefined();
    expect(result[0].review.attestation.statement).toBe(review.attestation.statement);
    expect(() => approveSelection([q], { reviews: [base] })).toThrow();
    expect(() =>
      approveSelection([q], {
        reviews: [
          { ...review, attestation: { ...review.attestation, noCorrectionsRequired: false } },
        ],
      }),
    ).toThrow();
    expect(() =>
      approveSelection([q], {
        reviews: [{ ...review, reviewer: { ...review.reviewer, kind: 'AI' } }],
      }),
    ).toThrow();
  });
  it('revalidates approvals when compiling SQL, including direct library calls', () => {
    expect(() =>
      compileImport([{ q, review: { ...reviewed(), status: 'pending' } }], 'zyhemkntpqqymfpuulid'),
    ).toThrow();
    expect(() => compileImport([{ q, review: reviewed() }], 'wrong-project')).toThrow();
  });
  it('imports transactionally and repeatably; conflicts roll back without touching records', async () => {
    const db = new PGlite();
    try {
      await db.exec(
        'create role anon; create role authenticated; create schema private; create table private.arena_bank(id uuid primary key,exam text,difficulty text,content jsonb,correct_index integer,solution text,verified boolean);',
      );
      await db.exec(
        readFileSync(
          new URL(
            '../supabase/migrations/20261028224827_arena_content_review_ledger.sql',
            import.meta.url,
          ),
          'utf8',
        ),
      );
      const approved = approveSelection([q], { reviews: [reviewed()] });
      const sql = compileImport(approved, 'zyhemkntpqqymfpuulid');
      await db.exec(sql);
      await db.exec(sql);
      expect((await db.query('select count(*)::int n from private.arena_bank')).rows).toEqual([
        { n: 1 },
      ]);
      expect(
        (await db.query('select count(*)::int n from private.arena_content_reviews')).rows,
      ).toEqual([{ n: 1 }]);
      await db.exec('set role authenticated');
      await expect(db.query('select * from private.arena_content_reviews')).rejects.toThrow();
      await db.exec('reset role');
      const fresh = {
        ...q,
        id: '12345678-1234-4123-8123-123456789013',
        slug: 'second-test-fixture',
        text: q.text + ' Another fixture.',
      };
      const revised = { ...q, solution: q.solution + ' Unapproved replacement.' };
      const conflicting = compileImport(
        approveSelection([fresh, revised], { reviews: [reviewed(fresh), reviewed(revised)] }),
        'zyhemkntpqqymfpuulid',
      );
      await expect(db.exec(conflicting)).rejects.toThrow(/nothing overwritten/);
      await db.exec('rollback');
      expect((await db.query('select count(*)::int n from private.arena_bank')).rows).toEqual([
        { n: 1 },
      ]);
      expect(
        (await db.query<{ solution: string }>('select solution from private.arena_bank')).rows[0]
          .solution,
      ).toBe(q.solution);
    } finally {
      await db.close();
    }
  }, 30000);
});
