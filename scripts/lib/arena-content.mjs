import { createHash } from 'node:crypto';
import { z } from 'zod';

export const exams = ['TMUA', 'ESAT'];
export const difficulties = ['Foundation', 'Intermediate', 'Challenge'];
const text = z.string().trim().min(1);
export const questionSchema = z
  .object({
    id: z.uuid(),
    slug: text.regex(/^[a-z0-9-]+$/),
    version: z.number().int().positive(),
    exam: z.enum(exams),
    difficulty: z.enum(difficulties),
    module: z.enum([
      'Mathematics',
      'Mathematics 1',
      'Mathematics 2',
      'Physics',
      'Chemistry',
      'Biology',
    ]),
    topic: text,
    syllabus: z.object({ url: z.url(), section: text }).strict(),
    text,
    math: text.optional(),
    options: z.array(text).length(5),
    correctIndex: z.number().int().min(0).max(4),
    solution: text.min(30),
    author: text,
    publication: z.literal('private-draft'),
    status: z.literal('pending-independent-review'),
  })
  .strict()
  .superRefine((q, ctx) => {
    if (new Set(q.options.map(normalize)).size !== 5)
      ctx.addIssue({ code: 'custom', message: 'Five distinct options required' });
    if ((q.exam === 'TMUA') !== (q.module === 'Mathematics'))
      ctx.addIssue({ code: 'custom', message: 'Exam/module mismatch' });
  });
const checks = z
  .object({
    uniqueAnswer: z.literal(true),
    solution: z.literal(true),
    syllabus: z.literal(true),
    difficulty: z.literal(true),
    wording: z.literal(true),
    privateOriginal: z.literal(true),
  })
  .strict();
export const approvalSchema = z
  .object({
    id: z.uuid(),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    status: z.literal('approved'),
    reviewer: z
      .object({ name: text.min(3), kind: z.literal('human'), independent: z.literal(true) })
      .strict(),
    reviewedAt: z.iso.datetime(),
    answerIndex: z.number().int().min(0).max(4),
    independentWorking: text.min(60).optional(),
    attestation: z
      .object({
        kind: z.literal('human-chat-confirmation'),
        statement: text.min(20),
        scope: z.literal('all-60-questions'),
        noCorrectionsRequired: z.literal(true),
        recordedAt: z.iso.datetime(),
      })
      .strict()
      .optional(),
    checks,
  })
  .strict()
  .refine((review) => Boolean(review.independentWorking || review.attestation), {
    message: 'Independent working or an explicit human confirmation is required',
  });
export function normalize(s) {
  return s.normalize('NFKC').replaceAll('−', '-').replace(/\s+/g, ' ').trim().toLowerCase();
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonical(value[k])]),
    );
  return value;
}
export function contentHash(q) {
  return createHash('sha256')
    .update(JSON.stringify(canonical(q)))
    .digest('hex');
}
export function validatePack(input, publicQuestions = []) {
  const pack = z
    .object({ schemaVersion: z.literal(1), questions: z.array(questionSchema).min(1) })
    .strict()
    .parse(input);
  const ids = new Set(),
    slugs = new Set(),
    stems = new Set();
  const publicStems = new Set(publicQuestions.map((q) => normalize(q.text)));
  for (const q of pack.questions) {
    const stem = normalize(q.text);
    if (ids.has(q.id) || slugs.has(q.slug) || stems.has(stem))
      throw Error(`Duplicate question: ${q.slug}`);
    if (publicStems.has(stem) || publicQuestions.some((p) => p.id === q.id))
      throw Error(`Public practice question is ineligible: ${q.slug}`);
    ids.add(q.id);
    slugs.add(q.slug);
    stems.add(stem);
  }
  return pack;
}
export function approveSelection(questions, input) {
  if (!Array.isArray(input?.reviews)) throw Error('A review document with reviews[] is required');
  const ids = new Set();
  for (const review of input.reviews) {
    if (ids.has(review.id)) throw Error('Duplicate review ID');
    ids.add(review.id);
  }
  return questions.map((q) => {
    const parsed = approvalSchema.safeParse(input.reviews.find((r) => r.id === q.id));
    if (!parsed.success)
      throw Error(
        `Review missing, pending or incomplete: ${q.slug}. Complete independent human review before importing.`,
      );
    const review = parsed.data;
    if (review.contentHash !== contentHash(q))
      throw Error(`Question changed since review: ${q.slug}`);
    if (review.answerIndex !== q.correctIndex) throw Error(`Reviewer answer differs: ${q.slug}`);
    if (
      normalize(review.reviewer.name) === normalize(q.author) ||
      /^(ai|chatgpt|codex|assistant|reviewer|your name|tbd|placeholder)$/i.test(
        review.reviewer.name,
      )
    )
      throw Error(`A named independent human reviewer is required: ${q.slug}`);
    if (new Date(review.reviewedAt).getTime() > Date.now() + 60000)
      throw Error('Review date cannot be in the future');
    return { q, review };
  });
}
export function reviewTemplate(questions) {
  return {
    schemaVersion: 1,
    reviews: questions.map((q) => ({
      id: q.id,
      contentHash: contentHash(q),
      status: 'pending',
      reviewer: { name: '', kind: 'human', independent: false },
      reviewedAt: '',
      answerIndex: null,
      independentWorking: '',
      checks: {
        uniqueAnswer: false,
        solution: false,
        syllabus: false,
        difficulty: false,
        wording: false,
        privateOriginal: false,
      },
    })),
  };
}
export function compileImport(approved, projectRef) {
  if (!/^[a-z]{20}$/.test(projectRef))
    throw Error('An explicit Supabase project reference is required');
  if (!approved.length) throw Error('No approved questions');
  const pack = validatePack({ schemaVersion: 1, questions: approved.map(({ q }) => q) });
  approved = approveSelection(pack.questions, { reviews: approved.map(({ review }) => review) });
  const payload = approved.map(({ q, review }) => ({
    id: q.id,
    slug: q.slug,
    version: q.version,
    exam: q.exam,
    difficulty: q.difficulty,
    content: {
      text: q.text,
      topic: q.topic,
      module: q.module,
      ...(q.math ? { math: q.math } : {}),
      options: q.options,
    },
    correct_index: q.correctIndex,
    solution: q.solution,
    hash: contentHash(q),
    review,
  }));
  const literal = "'" + JSON.stringify(payload).replaceAll("'", "''") + "'::jsonb";
  return `-- APPROVED PRIVATE CONTENT. Do not commit, publish or put in browser assets.
-- Intended project: ${projectRef}. Verify this in SQL Editor before running.
-- Generated only from independent human review attestations, not AI approval.
begin;
set local standard_conforming_strings=on;
set local lock_timeout='5s';
set local statement_timeout='30s';
select pg_advisory_xact_lock(7190053);
do $arena_import$
declare item jsonb; existing private.arena_bank; receipt private.arena_content_reviews;
begin
  for item in select value from jsonb_array_elements(${literal}) loop
    select * into existing from private.arena_bank where id=(item->>'id')::uuid for update;
    if found then
      if existing.exam is distinct from item->>'exam' or existing.difficulty is distinct from item->>'difficulty'
        or existing.content is distinct from item->'content' or existing.correct_index is distinct from (item->>'correct_index')::integer
        or existing.solution is distinct from item->>'solution' or not existing.verified then
        raise exception 'Existing question differs; nothing overwritten: %',item->>'slug';
      end if;
      select * into receipt from private.arena_content_reviews where question_id=existing.id;
      if not found or receipt.content_hash is distinct from item->>'hash' or receipt.review is distinct from item->'review' then
        raise exception 'Review receipt mismatch; nothing overwritten: %',item->>'slug';
      end if;
    else
      insert into private.arena_bank(id,exam,difficulty,content,correct_index,solution,verified)
      values((item->>'id')::uuid,item->>'exam',item->>'difficulty',item->'content',(item->>'correct_index')::integer,item->>'solution',true);
      insert into private.arena_content_reviews(question_id,source_slug,version,content_hash,review)
      values((item->>'id')::uuid,item->>'slug',(item->>'version')::integer,item->>'hash',item->'review');
    end if;
  end loop;
end $arena_import$;
commit;
`;
}
