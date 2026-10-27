# Supabase foundation

Public connection variables are in ignored `.env.local`. The browser client is ready to import from `@/utils/supabase/client`. Existing study data still uses local storage; no migration or database writes have been performed.

The server helper is async: `const supabase = await createClient()`. It requires a server deployment. Do not replace the revision homepage with the unrelated example todos query.

The current static export cannot run middleware/proxy. After migrating hosting to a Next.js server and removing `output: 'export'`, add `src/proxy.ts`:

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

The refresh helper actually calls `auth.getClaims()`; constructing a client alone does not refresh a session. Add authentication screens and review/apply database RLS policies before migrating study records. Never place a service-role key in public environment variables.
