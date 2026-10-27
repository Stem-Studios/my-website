import type { Attempt, Profile, Question, Task } from './types';
export function validateAnswer(question: Question, selected: number) {
  if (!Number.isInteger(selected) || selected < 0 || selected >= question.options.length)
    throw new Error('Choose a valid answer.');
  return selected === question.correct;
}
export function score(answers: { correct: boolean }[]) {
  const correct = answers.filter((a) => a.correct).length;
  return {
    correct,
    total: answers.length,
    accuracy: answers.length ? Math.round((correct / answers.length) * 100) : 0,
  };
}
export const remainingSeconds = (deadline: number, now: number) =>
  Math.max(0, Math.ceil((deadline - now) / 1000));
export function revisionStreak(attempts: Attempt[], now: Date) {
  const days = new Set(
    attempts
      .filter((a) => a.selected >= 0)
      .map((a) => new Date(a.date).toLocaleDateString('en-CA')),
  );
  const day = new Date(now);
  let count = 0;
  if (!days.has(day.toLocaleDateString('en-CA'))) day.setDate(day.getDate() - 1);
  while (days.has(day.toLocaleDateString('en-CA'))) {
    count++;
    day.setDate(day.getDate() - 1);
  }
  return count;
}
export function mastery(topic: string, attempts: Attempt[], bank: Question[]) {
  const relevant = attempts.filter(
    (a) => a.selected >= 0 && bank.find((q) => q.id === a.questionId)?.topic === topic,
  );
  const correct = relevant.filter((a) => a.correct).length;
  // Beta(2,2) prior keeps small samples uncertain.
  return {
    percent: Math.round(((correct + 2) / (relevant.length + 4)) * 100),
    count: relevant.length,
    confidence:
      relevant.length < 5
        ? 'Insufficient data'
        : relevant.length < 15
          ? 'Developing estimate'
          : 'Established estimate',
  };
}
export function generatePlan(
  profile: Profile,
  bank: Question[],
  attempts: Attempt[] = [],
  now = new Date(),
): Task[] {
  const start = new Date(now);
  start.setHours(12, 0, 0, 0);
  const end = new Date(`${profile.examDate}T12:00:00`);
  if (!Number.isFinite(end.getTime()) || end < start)
    throw new Error('Choose a future exam date to generate your plan.');
  // Count calendar dates rather than elapsed hours so daylight-saving changes do not add a day.
  const calendarDay = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.max(1, (calendarDay(end) - calendarDay(start)) / 86400000);
  const topics = [
    ...new Set(
      bank
        .filter(
          (q) =>
            q.exam === profile.exam &&
            (profile.exam === 'TMUA' || profile.modules.includes(q.module)),
        )
        .map((q) => q.topic),
    ),
  ];
  if (!topics.length) throw new Error('Select at least one supported module.');
  topics.sort((a, b) => mastery(a, attempts, bank).percent - mastery(b, attempts, bank).percent);
  const tasks: Task[] = [];
  const totalWeeks = Math.min(52, Math.ceil(days / 7));
  for (let w = 0; w < totalWeeks; w++) {
    const remainingDays = Math.min(7, days - w * 7);
    const sessionCount = Math.min(4, remainingDays);
    const weeklyMinutes = Math.round((profile.weeklyHours * 60 * remainingDays) / 7);
    for (let s = 0; s < sessionCount; s++) {
      const date = new Date(start);
      date.setDate(date.getDate() + w * 7 + Math.floor((s * remainingDays) / sessionCount));
      const topic = topics[(w + s) % topics.length];
      const kind =
        s === sessionCount - 1 ? 'Checkpoint' : s === sessionCount - 2 ? 'Review' : 'Practice';
      tasks.push({
        id: `w${w}-s${s}`,
        title:
          kind === 'Checkpoint'
            ? 'Weekly mixed checkpoint'
            : kind === 'Review'
              ? `${topic}: error review`
              : `${topic} focused practice`,
        topic,
        minutes:
          Math.floor(weeklyMinutes / sessionCount) + (s < weeklyMinutes % sessionCount ? 1 : 0),
        date: date.toLocaleDateString('en-CA'),
        done: false,
        kind,
      });
    }
  }
  return tasks;
}
export function adaptiveQuestions(bank: Question[], attempts: Attempt[], count: number) {
  const recent = attempts.slice(-5);
  const accuracy = score(recent).accuracy;
  const desired =
    recent.length < 3
      ? 'Intermediate'
      : accuracy >= 80
        ? 'Challenge'
        : accuracy < 40
          ? 'Foundation'
          : 'Intermediate';
  const answered = new Set(attempts.map((a) => a.questionId));
  return [...bank]
    .sort(
      (a, b) =>
        Number(answered.has(a.id)) - Number(answered.has(b.id)) ||
        Number(b.difficulty === desired) - Number(a.difficulty === desired),
    )
    .slice(0, count);
}
