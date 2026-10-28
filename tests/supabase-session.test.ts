import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { claims } = vi.hoisted(() => ({ claims: vi.fn() }));
vi.mock('../src/utils/supabase/config', () => ({
  supabaseConfig: () => ({ url: 'https://example.supabase.co', key: 'test-public-key' }),
}));
vi.mock('@supabase/ssr', () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: {
      cookies: {
        setAll: (
          items: { name: string; value: string; options: { httpOnly: boolean } }[],
          headers: Record<string, string>,
        ) => void;
      };
    },
  ) => {
    claims.mockImplementation(async () => {
      options.cookies.setAll(
        [{ name: 'test-session', value: 'refreshed', options: { httpOnly: true } }],
        {
          'Cache-Control': 'private, no-store',
          Pragma: 'no-cache',
          Expires: '0',
        },
      );
      return { data: { claims: { sub: 'test-user' } }, error: null };
    });
    return { auth: { getClaims: claims } };
  },
}));
import { updateSession } from '../src/utils/supabase/middleware';

describe('Supabase session refresh proxy', () => {
  it('passes refreshed cookies to the request and browser, with cache protection', async () => {
    const request = new NextRequest('https://example.com/dashboard/');
    const response = await updateSession(request);
    expect(claims).toHaveBeenCalledOnce();
    expect(request.cookies.get('test-session')?.value).toBe('refreshed');
    expect(response.cookies.get('test-session')?.value).toBe('refreshed');
    expect(response.cookies.get('test-session')?.httpOnly).toBe(true);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('pragma')).toBe('no-cache');
    expect(response.headers.get('expires')).toBe('0');
  });
});
