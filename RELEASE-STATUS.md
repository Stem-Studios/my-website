# Release preparation — 28 October 2026

Target: https://magical-gumption-4ab4b2.netlify.app
Repository/production branch: `Stem-Studios/my-website`, `main`.

The owner authorised release. The release was stopped **before push/deployment** because essential Supabase production authentication settings are missing. No accounts, progress, questions or match records were modified during this release check.

## Completed locally

- Production build, TypeScript checks, lint and all 31 automated tests pass.
- `main` and fetched `origin/main` were equal before preparing the release commit; no merge or force push is needed.
- Netlify's project points at the expected GitHub repository and its current published version is `main@203323e`.
- Netlify has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, both shown as all scopes/all deploy contexts. Values were not exposed or changed during the browser check.
- Auth forms derive callbacks from the current browser origin. The server callback and protected-page redirects remain same-origin; there is no hardcoded localhost callback in the application auth code.
- `.env*`, private Arena content, Netlify output, credentials/private-key files and Supabase CLI temporary metadata are excluded from Git. The example env file contains placeholders only.

## Essential settings to configure before pushing

In [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/zyhemkntpqqymfpuulid/auth/url-configuration):

1. Change **Site URL** from the observed `http://localhost:3000` to `https://magical-gumption-4ab4b2.netlify.app`.
2. Add these exact **Redirect URLs**. The allowlist was empty during the check:
   - `https://magical-gumption-4ab4b2.netlify.app/auth/callback/`
   - `https://magical-gumption-4ab4b2.netlify.app/auth/callback/?recovery=1`
3. Keep explicitly required local development callbacks separately. Never use localhost as the production Site URL. Keep email confirmation and existing authentication security enabled.

In [Supabase Auth SMTP Settings](https://supabase.com/dashboard/project/zyhemkntpqqymfpuulid/auth/smtp):

4. Configure a production SMTP provider: verified sender address/name, SMTP host, port, username and password in Supabase's private settings. Custom SMTP was disabled during the check. Do not put its password in Git or any `NEXT_PUBLIC_` variable. Supabase's default email sender is restricted to project team addresses and is unsuitable for general public student signup. [Official SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp).

## After configuration

Re-check the saved settings, then push the reviewed local release commit to `origin/main`, allowing Netlify's connected Git deployment. Confirm the resulting deployment uses that commit and reaches a published state. Test landing/login/signup, email confirmation and recovery on the Netlify origin, private progress persistence and the TMUA Intermediate Arena with separate accounts. A successful local build does not establish that hosted authenticated flows have passed.

No production deployment or live authenticated acceptance test is claimed by this report.
