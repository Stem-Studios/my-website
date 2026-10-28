# Supabase foundation

For the selected Netlify deployment target and remaining authentication steps, see [NETLIFY.md](./NETLIFY.md). `/auth/callback/` exchanges PKCE codes for a cookie-backed session. The session proxy forwards both refreshed cookies and Supabase's cache headers to prevent refreshed tokens being cached across visitors.

Public connection variables are in ignored `.env.local`. Account and Arena status is documented in [ARENA.md](./ARENA.md) and [SUPABASE-ROLLOUT.md](./SUPABASE-ROLLOUT.md). The approved additive database setup is installed. The account provider uses the private cloud-progress API; legacy local-storage data is retained without automatic import. Existing student records have not been reset or deleted.

The server helper is async: `const supabase = await createClient()`. It requires a server deployment. Do not replace the revision homepage with the unrelated example todos query.

The app now runs in Next.js server mode, with `src/proxy.ts` calling the refresh helper on page requests. Run `pnpm dev`, or `pnpm build` followed by `pnpm start`. The previous hosted Sites preview is still a static deployment; publishing these server features requires server-capable hosting and both public environment variables configured there. Do not deploy a stale `out/` directory. The existing Sites manifest describes that previous static deployment.

The active proxy uses:

```ts
import type { NextRequest } from 'next/server';
import { updateSession } from './utils/supabase/middleware';
export async function proxy(request: NextRequest) {
  return updateSession(request);
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

The refresh helper calls `auth.getClaims()`; constructing a client alone does not refresh a session. Login, signup, password recovery and logout are wired to Supabase Auth. Use dedicated verified staging accounts and the acceptance checklist before release. The current project's baseline/recovery SQL is already installed: do not reapply it. Never place a service-role key in public environment variables.
