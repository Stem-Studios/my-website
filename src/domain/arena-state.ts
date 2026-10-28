type Snapshot = { id: string; status: string; positions: Record<string, number> };
// RPC replies and Realtime events may arrive in different network order.
// Never let an older response reopen a result or roll player progress back.
export function keepLatestMatch<T extends Snapshot>(previous: T | null, next: T): T {
  if (!previous || previous.id !== next.id) return next;
  if (
    ['finished', 'cancelled'].includes(previous.status) &&
    !['finished', 'cancelled'].includes(next.status)
  )
    return previous;
  if (Object.entries(previous.positions).some(([id, index]) => (next.positions[id] ?? 0) < index))
    return previous;
  const phase: Record<string, number> = {
    lobby: 0,
    countdown: 1,
    playing: 2,
    finished: 3,
    cancelled: 3,
  };
  if ((phase[next.status] ?? 0) < (phase[previous.status] ?? 0)) return previous;
  return next;
}
