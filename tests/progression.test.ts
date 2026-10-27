import { describe, it, expect } from 'vitest';
import { progression, xpLedger } from '../src/domain/progression';
import type { Attempt } from '../src/domain/types';
const attempt = (id: string, questionId: string, correct = true, selected = 0): Attempt => ({
  id,
  questionId,
  correct,
  selected,
  sessionId: 'session',
  seconds: 20,
  date: '2026-10-27T12:00:00Z',
});
describe('study XP', () => {
  it('awards effort and a first-correct bonus without repeat farming', () => {
    const attempts = [
      attempt('1', 'q', false),
      attempt('2', 'q', false),
      attempt('3', 'q'),
      attempt('4', 'q'),
    ];
    expect(xpLedger(attempts).map((a) => a.xp)).toEqual([10, 0, 20, 0]);
    expect(progression(attempts).xp).toBe(30);
  });
  it('ignores unanswered questions and duplicate attempt IDs', () => {
    expect(
      progression([attempt('1', 'a', false, -1), attempt('2', 'b'), attempt('2', 'c')]).xp,
    ).toBe(30);
  });
  it('unlocks ranks at the threshold and uses the local calendar for daily goals', () => {
    const attempts = Array.from({ length: 7 }, (_, i) => attempt(String(i), String(i)));
    const p = progression(attempts, new Date('2026-10-27T13:00:00Z'));
    expect(p.xp).toBe(210);
    expect(p.rank.name).toBe('Silver');
    expect(p.dailyXP).toBe(210);
    expect(progression(attempts, new Date('2026-10-28T13:00:00Z')).dailyXP).toBe(0);
  });
});
