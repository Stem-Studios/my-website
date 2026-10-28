import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// PKCE callback for future OAuth or email-link sign-in flows. Keep the
// destination fixed and same-origin; never trust an arbitrary redirect URL.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(
        new URL(
          request.nextUrl.searchParams.get('recovery') === '1'
            ? '/update-password/'
            : '/dashboard/',
          request.url,
        ),
        303,
      );
      response.headers.set('Cache-Control', 'private, no-store');
      return response;
    }
  }
  const response = NextResponse.redirect(new URL('/login/?error=auth_callback', request.url), 303);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
