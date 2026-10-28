import { describe, it, expect } from 'vitest';
import { keepLatestMatch } from '../src/domain/arena-state';
describe('Arena network ordering', () => {
  it('does not let delayed polling undo a Realtime answer or reopen results', () => {
    const playing = { id: 'one', status: 'playing', positions: { a: 3, b: 2 } };
    expect(keepLatestMatch(playing, { ...playing, positions: { a: 2, b: 2 } })).toBe(playing);
    const finished = { ...playing, status: 'finished' };
    expect(keepLatestMatch(finished, playing)).toBe(finished);
    expect(keepLatestMatch(playing, { ...playing, status: 'countdown' })).toBe(playing);
  });
  it('accepts new progress and a different match', () => {
    const previous = { id: 'one', status: 'playing', positions: { a: 3, b: 2 } };
    const next = { ...previous, positions: { a: 4, b: 2 } };
    expect(keepLatestMatch(previous, next)).toBe(next);
    const rematch = { id: 'two', status: 'lobby', positions: { a: 0, b: 0 } };
    expect(keepLatestMatch(previous, rematch)).toBe(rematch);
  });
});
