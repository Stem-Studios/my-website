import { questions } from '../src/data/questions.ts';
import { writeFileSync } from 'node:fs';
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const statements = [
  '-- Optional original demo seed. Run after 0001_foundation.sql using a trusted database role.',
  'begin;',
];
const topics = new Map(questions.map((q) => [`${q.exam}-${q.module}-${q.topic}`, q]));
for (const [id, q] of topics)
  statements.push(
    `insert into public.syllabus_topics(id,exam,module,name) values(${[id, q.exam, q.module, q.topic].map(quote).join(',')}) on conflict do nothing;`,
  );
for (const q of questions) {
  const content = {
    text: q.text,
    math: q.math,
    subtopic: q.subtopic,
    tags: q.tags,
    seconds: q.seconds,
  };
  statements.push(
    `insert into public.questions(id,topic_id,exam,module,difficulty,content,provenance,verified,version) values(${[q.id, `${q.exam}-${q.module}-${q.topic}`, q.exam, q.module, q.difficulty, JSON.stringify(content), q.source].map(quote).join(',')},true,${q.version}) on conflict do nothing;`,
  );
  for (const [position, option] of q.options.entries())
    statements.push(
      `insert into public.question_options(question_id,position,content) values(${quote(q.id)},${position},${quote(option)}) on conflict do nothing;`,
    );
  statements.push(
    `insert into public.question_solutions(question_id,correct_index,solution,hints) values(${quote(q.id)},${q.correct},${quote(q.solution)},${quote(JSON.stringify(q.hints))}) on conflict do nothing;`,
  );
}
statements.push('commit;');
writeFileSync(new URL('../migrations/seed.sql', import.meta.url), `${statements.join('\n')}\n`);
console.log(
  `Prepared ${questions.length} original demo questions in migrations/seed.sql. No database connection was opened.`,
);
