# Netlify deployment

Netlify is the selected production target. This is a Next.js server application, not a static export. `netlify.toml` sets the build configuration. Netlify automatically applies its current OpenNext adapter for SSR, route handlers and middleware; no adapter version is pinned.

## Exact settings

| Setting | Value |
| --- | --- |
| Repository | `Stem-Studios/my-website` |
| Production branch | `main` |
| Base directory | Repository root (leave blank) |
| Framework | Next.js |
| Build command | `pnpm build` |
| Publish directory | `.next` |
| Node version | `24` (set in `netlify.toml`) |
| Package manager | `pnpm@11.25.0` (from `package.json`) |
| pnpm installation flags | `--shamefully-hoist` (set in `netlify.toml`) |
| Start command | None; the adapter provisions server functions |
| Functions directory | Leave default; the adapter manages generated functions |

Do not use `out`, `next export`, a manual static upload, `NETLIFY_NEXT_PLUGIN_SKIP=true`, or a `/* /index.html 200` redirect. The previous `.openai/hosting.json`, `VERCEL.md` and `vercel.json` are historical/alternative hosting files; Netlify uses `netlify.toml`.

## Environment and authentication

In Netlify Project configuration → Environment variables, add the existing values from local `.env.local` for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Make both available for Builds and Functions (or all scopes), in Production and any Deploy Preview contexts that will use authentication. Public variables are compiled into browser assets at build time, so changing them requires a new build. Do not upload `.env.local` or add a service-role/database password to public variables. `.env.local` remains Git-ignored.

In Supabase Authentication → URL Configuration:

1. Set Site URL to the actual production origin, for example `https://YOUR-SITE.netlify.app` (or the chosen custom domain).
2. Add the exact redirect URL `https://YOUR-SITE.netlify.app/auth/callback/`, using the real domain. Add the custom-domain callback as well if applicable.
3. For development, allow `http://127.0.0.1:3000/auth/callback/` and/or `http://localhost:3000/auth/callback/`, matching the origin actually used.
4. Allow only preview callback URLs that should support sign-in. Configure the selected authentication provider before testing real sign-in.

`src/proxy.ts` verifies/refreshes sessions with `getClaims()`, copies cookies to the request and response, and forwards Supabase's cache headers. `/auth/callback/` performs a PKCE code exchange and returns a private, non-cached redirect. No service credentials are embedded.

The existing login/signup pages still provide local demo entry. Real sign-in UI, protected study routes and database-backed study persistence are not implemented by the hosting change. Test actual sign-in, callback, expired-session refresh and logout after those flows are connected; the current tests exercise the refresh helper with mocked auth, not a live signed-in account.

## Data preservation and release

Design, question fixtures, revision features and the `axiom-demo-v1` storage key are unchanged. No data or database schema was deleted or migrated. Local storage belongs to its origin; a new Netlify domain will not automatically inherit progress from the old preview. Export a backup from the old preview and keep the old origin available. A cross-domain import is not yet implemented.

Nothing has been pushed or deployed. When approved, commit/push the prepared checkout, import the GitHub repository into Netlify, enter the environment variables and check the settings above before deploying. Creating/importing a Netlify project may trigger a build, so defer that action until deployment is authorised.

## Verification

`pnpm build` succeeds with the session proxy and dynamic callback. All 16 tests pass. A Netlify adapter build and live session test have not been run; those remain deployment-stage checks. Vercel/Railway settings are not required for this Netlify configuration.

References: [Next.js on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [pnpm support](https://docs.netlify.com/snippets/frameworks/nextjs-pnpm-support/), [dependency versions](https://docs.netlify.com/build/configure-builds/manage-dependencies/).
