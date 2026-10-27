import type { Attempt } from './types';

export const ranks = [
  { name: 'Bronze', xp: 0 },
  { name: 'Silver', xp: 200 },
  { name: 'Gold', xp: 600 },
  { name: 'Platinum', xp: 1400 },
  { name: 'Diamond', xp: 3000 },
  { name: 'Master', xp: 6000 },
];

// XP rewards learning effort, not exam ability. Each question earns XP once;
// a later correct answer adds the remaining mastery bonus, never duplicate XP.
export function xpLedger(attempts: Attempt[]) {
  const earned = new Map<string, number>();
  const seen = new Set<string>();
  return attempts.map((a) => {
    if (seen.has(a.id) || a.selected < 0) return { ...a, xp: 0 };
    seen.add(a.id);
    const previous = earned.get(a.questionId) ?? 0;
    const total = Math.max(previous, a.correct ? 30 : 10);
    earned.set(a.questionId, total);
    return { ...a, xp: total - previous };
  });
}

export function progression(attempts: Attempt[], now = new Date()) {
  const ledger = xpLedger(attempts);
  const xp = ledger.reduce((sum, a) => sum + a.xp, 0);
  const index = ranks.findLastIndex((r) => xp >= r.xp);
  const rank = ranks[index];
  const next = ranks[index + 1];
  const today = ledger.filter((a) => new Date(a.date).toDateString() === now.toDateString());
  return {
    xp,
    rank,
    next,
    percent: next ? ((xp - rank.xp) / (next.xp - rank.xp)) * 100 : 100,
    dailyXP: today.reduce((sum, a) => sum + a.xp, 0),
    dailyAnswers: today.filter((a) => a.selected >= 0).length,
    ledger,
  };
}
