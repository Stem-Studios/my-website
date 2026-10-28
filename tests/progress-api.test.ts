import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initialState } from '../src/data/demo';
const { client } = vi.hoisted(() => ({
  client: { auth: { getUser: vi.fn() }, rpc: vi.fn(), from: vi.fn() },
}));
vi.mock('../src/utils/supabase/server', () => ({ createClient: async () => client }));
import { GET, PUT } from '../src/app/api/progress/route';
const uid = '11111111-1111-4111-8111-111111111111';
function put(userId = uid, origin = 'https://example.com') {
  return new Request('https://example.com/api/progress/', {
    method: 'PUT',
    headers: { origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, revision: 3, state: initialState() }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  client.auth.getUser.mockResolvedValue({
    data: { user: { id: uid, user_metadata: {} } },
    error: null,
  });
  client.rpc.mockResolvedValue({ data: 4, error: null });
});
describe('private progress API', () => {
  it('rejects unauthenticated reads before querying student data', async () => {
    client.auth.getUser.mockResolvedValue({ data: { user: null } });
    const response = await GET();
    expect(response.status).toBe(401);
    expect(client.from).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
  it('rejects cross-origin and switched-account saves without a database write', async () => {
    expect((await PUT(put(uid, 'https://attacker.example'))).status).toBe(403);
    expect((await PUT(put('22222222-2222-4222-8222-222222222222'))).status).toBe(409);
    expect(client.rpc).not.toHaveBeenCalled();
  });
  it('passes the expected revision to the atomic owner-scoped save RPC', async () => {
    const response = await PUT(put());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revision: 4 });
    expect(client.rpc).toHaveBeenCalledWith(
      'save_user_progress',
      expect.objectContaining({ expected_revision: 3 }),
    );
  });
  it('reports a revision conflict rather than overwriting server progress', async () => {
    client.rpc.mockResolvedValue({ data: null, error: { message: 'revision conflict' } });
    expect((await PUT(put())).status).toBe(409);
    expect(client.rpc).toHaveBeenCalledTimes(1);
  });
});
