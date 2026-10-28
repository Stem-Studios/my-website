# Vercel deployment

Historical alternative: Netlify is now the selected deployment target. Follow [NETLIFY.md](./NETLIFY.md) instead. This file is retained for reference.

This checkout is a standard Next.js 16 server application. `next.config.ts` has no static export configuration. `vercel.json` selects the Next.js framework; Vercel handles server routes, prerendered pages and the session proxy together. No custom server or output-directory override is needed.

Nothing has been pushed or deployed as part of this preparation.

## Deployment steps

1. When ready, commit and push this checkout to the intended GitHub repository.
2. Import that repository into Vercel. Use the repository root, Next.js framework preset, Node 24.x and `pnpm build`. Keep the output-directory override disabled. Use the pnpm version declared by `packageManager`; enable Vercel's Corepack support if required by the selected build image.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your local environment to the desired Vercel Production and Preview environments. These values are required at build and runtime. Do not upload `.env.local`; do not add service-role keys to public variables.
4. In Supabase Auth URL Configuration, set the production Site URL and allow the exact production `/auth/callback/` URL. Add localhost for development and only the preview callback URLs you intend to test. Configure any selected authentication provider there.
5. Deploy when authorised, then test a real login, callback, expired-session refresh, reload and logout. Existing login/signup screens still offer local demo entry; real sign-in UI is a separate feature. The SSR helpers and PKCE callback are prepared, but a real user-session lifecycle has not been verified without signing in.

## Existing preview and study data

`.openai/hosting.json` records the older static Sites deployment. Vercel does not use that manifest. Do not serve the old `out/` directory or deploy it as the server build. The existing static preview has not been changed.

Question fixtures, resources, styling, all revision pages and the `axiom-demo-v1` local-storage key are preserved. Existing data is not deleted. Browser storage belongs to its origin: a new Vercel domain does not automatically inherit the old preview's local storage. Export from the existing preview before changing domains; retain that backup and the old origin. An import/cloud migration flow has not been implemented.

The optional database migrations have not been applied. Study progress is still local; review RLS and add authenticated persistence before storing multi-user study data in Supabase.

## Local verification

Use `pnpm build`, `pnpm test`, then `pnpm start`. Keep `.env.local` ignored. Authenticated server routes should validate identity with `getClaims()` or `getUser()` and avoid shared caching; never authorise from an unverified `getSession()` result.
