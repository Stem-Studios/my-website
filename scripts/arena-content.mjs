import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { questions as publicQuestions } from '../src/data/questions.ts';
import {
  validatePack,
  contentHash,
  reviewTemplate,
  approveSelection,
  compileImport,
  exams,
  difficulties,
  normalize,
} from './lib/arena-content.mjs';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    pack: { type: 'string', default: 'arena-content/drafts.json' },
    exam: { type: 'string', default: 'TMUA' },
    difficulty: { type: 'string', default: 'Intermediate' },
    reviews: { type: 'string' },
    project: { type: 'string' },
    out: { type: 'string' },
    'all-modes': { type: 'boolean', default: false },
    checks: { type: 'string' },
  },
});
try {
  const command = positionals[0] ?? 'validate';
  const pack = validatePack(JSON.parse(readFileSync(values.pack, 'utf8')), publicQuestions);
  if (!exams.includes(values.exam) || !difficulties.includes(values.difficulty))
    throw Error('Invalid exam/difficulty');
  const selected = values['all-modes']
    ? pack.questions
    : pack.questions.filter((q) => q.exam === values.exam && q.difficulty === values.difficulty);
  const groups = values['all-modes']
    ? exams.flatMap((e) => difficulties.map((d) => [e, d]))
    : [[values.exam, values.difficulty]];
  for (const [e, d] of groups)
    if (selected.filter((q) => q.exam === e && q.difficulty === d).length < 10)
      throw Error(`${e}/${d} needs at least 10 questions`);
  function writePrivate(path, content) {
    const root = resolve('arena-content'),
      dest = resolve(path);
    if (!relative(root, dest) || relative(root, dest).startsWith('..'))
      throw Error('Outputs must stay inside ignored arena-content/');
    mkdirSync(root, { recursive: true });
    writeFileSync(dest, content, { flag: 'wx', mode: 0o600 });
    console.log(`Created ${path}; existing files are never overwritten.`);
  }
  if (command === 'validate') {
    if (values.checks) {
      const { checks } = await import(pathToFileURL(resolve(values.checks)).href);
      for (const q of selected) {
        const check = checks[q.slug];
        if (!check || normalize(q.options[q.correctIndex]) !== normalize(check()))
          throw Error(`Automated calculation failed: ${q.slug}`);
      }
      console.log(
        `${selected.length} draft-answer sanity checks passed (numeric checks and logical-answer regressions). These are not independent human verification.`,
      );
    }
    console.log(
      `${pack.questions.length} valid draft records; selected ${selected.length}. No verification or database import performed.`,
    );
  } else if (command === 'review') {
    const prefix =
      values.out ?? `arena-content/${values.exam.toLowerCase()}-${values.difficulty.toLowerCase()}`;
    writePrivate(
      prefix + '-blind.md',
      '# Independent question review\n\nSolve without looking at the answer key. Record your working and check every option.\n\n' +
        selected
          .map(
            (q) =>
              `## ${q.slug}\n\n${q.exam} · ${q.difficulty} (provisional) · ${q.module} · ${q.topic}\n\n${q.text}\n\n${q.math ?? ''}\n\n${q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n\n')}\n\nSyllabus: ${q.syllabus.url} (${q.syllabus.section})\n\nContent hash: ${contentHash(q)}\n`,
          )
          .join('\n'),
    );
    writePrivate(
      prefix + '-key.md',
      '# AI-assisted draft solutions — NOT VERIFIED\n\nOpen only after independent solving.\n\n' +
        selected
          .map(
            (q) =>
              `## ${q.slug}\n\nDraft answer: ${String.fromCharCode(65 + q.correctIndex)}\n\n${q.solution}\n`,
          )
          .join('\n'),
    );
    writePrivate(
      prefix + '-reviews.json',
      JSON.stringify(reviewTemplate(selected), null, 2) + '\n',
    );
  } else if (command === 'build-import') {
    if (!values.reviews || !values.project) throw Error('--reviews and --project are required');
    const approved = approveSelection(selected, JSON.parse(readFileSync(values.reviews, 'utf8')));
    const sql = compileImport(approved, values.project);
    writePrivate(values.out ?? 'arena-content/approved-import.sql', sql);
    console.log(
      `${approved.length} approved question receipts checked. SQL generated only; no database connection or import performed.`,
    );
  } else throw Error('Use validate, review or build-import');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
