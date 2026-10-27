import { describe, expect, it } from 'vitest';
import {
  adaptiveQuestions,
  generatePlan,
  mastery,
  remainingSeconds,
  score,
  validateAnswer,
} from '../src/domain/learning';
import { questions } from '../src/data/questions';
import { defaultProfile } from '../src/data/demo';
import { loadDemo } from '../src/services/storage';
import { profileSchema, type Attempt } from '../src/domain/types';
describe('answer validation and scoring', () => {
  it('scores only correct answers and safely handles no answers', () => {
    expect(score([])).toEqual({ correct: 0, total: 0, accuracy: 0 });
    expect(score([{ correct: true }, { correct: false }, { correct: true }])).toEqual({
      correct: 2,
      total: 3,
      accuracy: 67,
    });
  });
  it('rejects out-of-range, fractional and non-finite answers', () => {
    for (const n of [-1, 5, 0.5, NaN, Infinity])
      expect(() => validateAnswer(questions[0], n)).toThrow();
    expect(validateAnswer(questions[0], 1)).toBe(true);
    expect(validateAnswer(questions[0], 0)).toBe(false);
  });
  it('checks original numeric question answers with independent calculations', () => {
    const checks: Record<string, string> = {
      'tmua-001': String(6 ** 2 - 2 * 7),
      'tmua-002': String((10 / 2) * (3 + 39)),
      'tmua-003': String(Math.sqrt(12 / 3)),
      'tmua-005': '3/7',
      'tmua-006': `${3 ** 2 + 4 ** 2}π`,
      'tmua-007': String(1 + Math.sqrt(9)),
      'tmua-008': String(Math.round(6 / (1 - 1 / 3))),
      'esat-001': String(4 * 3),
      'esat-002': String(2 ** 3 + 2),
      'esat-003': `${0.5 * (12 / 3) * 2 ** 2} m`,
      'esat-004': `${12 / (1 / (1 / 6 + 1 / 3))} A`,
      'esat-005': `${(5.85 / 58.5).toFixed(2)} mol`,
      'esat-006': '3+',
      'esat-007': '×2,000',
      'esat-008': '1/2',
    };
    for (const q of questions) {
      expect(q.hints).toHaveLength(3);
      expect(q.options.length).toBe(5);
      expect(new Set(q.options).size).toBe(5);
      if (checks[q.id]) expect(q.options[q.correct], q.id).toBe(checks[q.id]);
    }
    expect(questions.find((q) => q.id === 'tmua-004')?.options[2]).toBe(
      'If n is odd, then n² is odd.',
    );
  });
});
describe('study planner', () => {
  it('allocates exactly 96 hours across a 12-week, 8h/week plan', () => {
    const p = { ...defaultProfile(), examDate: '2027-03-26', weeklyHours: 8 };
    const tasks = generatePlan(p, questions, [], new Date('2027-01-01T12:00:00'));
    expect(tasks).toHaveLength(48);
    expect(tasks.reduce((n, t) => n + t.minutes, 0)).toBe(96 * 60);
    expect(tasks.every((t) => t.date < p.examDate)).toBe(true);
    expect(new Set(tasks.map((t) => t.id)).size).toBe(tasks.length);
  });
  it('rejects past dates and unsupported modules', () => {
    expect(() => generatePlan({ ...defaultProfile(), examDate: '2020-01-01' }, questions)).toThrow(
      'future',
    );
    expect(() =>
      generatePlan({ ...defaultProfile(), exam: 'ESAT', modules: ['Other'] }, questions),
    ).toThrow('module');
  });
  it('limits a partial final week to available study time', () => {
    const tasks = generatePlan(
      { ...defaultProfile(), examDate: '2027-01-03', weeklyHours: 7 },
      questions,
      [],
      new Date('2027-01-01T12:00:00'),
    );
    expect(tasks).toHaveLength(2);
    expect(tasks.reduce((n, t) => n + t.minutes, 0)).toBe(120);
  });
});
describe('timers, uncertainty, storage and validation boundaries', () => {
  it('never reports negative remaining time', () => {
    expect(remainingSeconds(10000, 9001)).toBe(1);
    expect(remainingSeconds(10000, 10000)).toBe(0);
    expect(remainingSeconds(10000, 11000)).toBe(0);
  });
  it('does not call one correct answer mastery', () => {
    const attempt = { questionId: 'tmua-001', correct: true } as Attempt;
    const m = mastery('Algebra', [attempt], questions);
    expect(m.percent).toBe(60);
    expect(m.confidence).toBe('Insufficient data');
  });
  it('recovers safely from corrupt or wrong-version local data', () => {
    expect(loadDemo('broken').attempts).toEqual([]);
    expect(loadDemo('{"version":2}').version).toBe(1);
    expect(loadDemo(null).profile.exam).toBe('TMUA');
  });
  it('rejects invalid profile inputs', () => {
    expect(profileSchema.safeParse({ ...defaultProfile(), weeklyHours: 0 }).success).toBe(false);
    expect(profileSchema.safeParse({ ...defaultProfile(), modules: [] }).success).toBe(false);
  });
  it('prefers unseen questions at an appropriate difficulty', () => {
    const selected = adaptiveQuestions(
      questions.filter((q) => q.exam === 'TMUA'),
      [],
      3,
    );
    expect(selected[0].difficulty).toBe('Intermediate');
    expect(selected).toHaveLength(3);
  });
});
