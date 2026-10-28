# Netlify deployment

Netlify is the selected production target. This is a Next.js server application, not a static export. `netlify.toml` sets the build configuration. Netlify automatically applies its current OpenNext adapter for SSR, route handlers and middleware; no adapter version is pinned.

## Exact settings

| Setting                 | Value                                                  |
| ----------------------- | ------------------------------------------------------ |
| Repository              | `Stem-Studios/my-website`                              |
| Production branch       | `main`                                                 |
| Base directory          | Repository root (leave blank)                          |
| Framework               | Next.js                                                |
| Build command           | `pnpm build`                                           |
| Publish directory       | `.next`                                                |
| Node version            | `24` (set in `netlify.toml`)                           |
| Package manager         | `pnpm@11.25.0` (from `package.json`)                   |
| pnpm installation flags | `--shamefully-hoist` (set in `netlify.toml`)           |
| Start command           | None; the adapter provisions server functions          |
| Functions directory     | Leave default; the adapter manages generated functions |

Do not use `out`, `next export`, a manual static upload, `NETLIFY_NEXT_PLUGIN_SKIP=true`, or a `/* /index.html 200` redirect. The previous `.openai/hosting.json`, `VERCEL.md` and `vercel.json` are historical/alternative hosting files; Netlify uses `netlify.toml`.

## Environment and authentication

In Netlify Project configuration → Environment variables, add the existing values from local `.env.local` for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Make both available for Builds and Functions (or all scopes), in Production and any Deploy Preview contexts that will use authentication. Public variables are compiled into browser assets at build time, so changing them requires a new build. Do not upload `.env.local` or add a service-role/database password to public variables. `.env.local` remains Git-ignored.

In Supabase Authentication → URL Configuration:

1. Set Site URL to `https://magical-gumption-4ab4b2.netlify.app` (or the chosen custom domain).
2. Add `https://magical-gumption-4ab4b2.netlify.app/auth/callback/` and `https://magical-gumption-4ab4b2.netlify.app/auth/callback/?recovery=1`. Add equivalent custom-domain callbacks if applicable.
3. For development, allow `http://127.0.0.1:3000/auth/callback/` and `http://127.0.0.1:3000/auth/callback/?recovery=1` (and localhost equivalents only if used).
4. Allow only preview callback URLs that should support sign-in. Configure the selected authentication provider before testing real sign-in.

The current local production preview uses port **3101**, not 3000. If registering or recovering passwords there, also allow `http://127.0.0.1:3101/auth/callback/` and `http://127.0.0.1:3101/auth/callback/?recovery=1`. Use callback URLs matching the browser's exact host and port; a different port is a different origin.

`src/proxy.ts` verifies/refreshes sessions with `getClaims()`, copies cookies to the request and response, and forwards Supabase's cache headers. `/auth/callback/` performs a PKCE code exchange and returns a private, non-cached redirect. No service credentials are embedded.

Login/signup now use Supabase Auth and workspace routes require a session. Cloud progress and Arena require the new reviewed migrations and server-only question pool. Follow [ARENA.md](./ARENA.md) before release. Hosted email, session and cross-device Realtime acceptance tests are still pending.

## Data preservation and release

The design, public practice question fixtures and revision tools are preserved. Approved additive account/Arena database setup is installed; no student records were reset or deleted. Authenticated progress now uses private per-user cloud storage with revision conflicts rather than the shared demo workspace. The old `axiom-demo-v1` browser data is left intact and is not automatically imported. Local storage belongs to its origin; export a backup from the old preview and keep that origin available. A cross-domain import is not yet implemented.

No changes from this implementation have been pushed or deployed. The Netlify project already exists. When separately approved and staging acceptance passes, enter its environment variables, check the settings above, and publish the prepared source. A push to the connected production branch may trigger deployment, so do not push before approval.

## Verification

`pnpm build`, `pnpm typecheck` and `pnpm lint` succeed. All 31 local tests pass. Production-server HTTP checks confirm login/signup return 200, signed-out dashboard/Arena requests redirect to login, and unauthenticated progress returns 401 with private/no-store headers.

The `@npmcli/docs` packaging failure is resolved locally: npm had been installed inside the pnpm-managed plugin directory, causing npm to traverse its own development dependencies. Isolating npm outside that directory and preserving the old plugin files as a backup allowed **`netlify build --offline` to complete successfully**, including the production build, server function and session-proxy edge function. No application dependency workaround was needed. See [NETLIFY-DIAGNOSIS.md](./NETLIFY-DIAGNOSIS.md) for evidence and reproduction details. No deployment was attempted.

Live cookie-refresh, email and two-device Realtime tests remain required in an approved preview deployment. Netlify's automatic OpenNext integration is the configured route for SSR; no static export or custom WebSocket server is present. Vercel/Railway settings are not required.

References: [Next.js on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [pnpm support](https://docs.netlify.com/snippets/frameworks/nextjs-pnpm-support/), [dependency versions](https://docs.netlify.com/build/configure-builds/manage-dependencies/).
