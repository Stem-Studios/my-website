# Local Netlify packaging diagnosis — 28 October 2026

The `@npmcli/docs` failure was a **local tooling/layout issue**, not an application dependency failure.

Evidence:

- The npm log at `/Users/p2g/.npm/_logs/2026-10-28T13_08_49_369Z-debug-0.log` records Netlify installing `@netlify/plugin-nextjs@5.16.3` in `.netlify/plugins/`.
- A previous workaround had installed npm itself there using pnpm. The log shows npm traversing the linked `node_modules/.pnpm/npm@11.6.2/node_modules/npm` package and attempting to install npm's own development tooling, including `@npmcli/docs@^1.0.0`, which returned HTTP 404.
- Neither the application's `package.json` nor its lockfile requires `@npmcli/docs`. Installing or overriding it in the app would not address this cause.
- npm 11.6.2 was installed in a separate temporary tools directory. The old plugin directory was preserved as `.netlify/plugins-pnpm-backup-20261028`; Netlify created a clean plugin directory. No project files or study data were deleted.
- With isolated npm on PATH, **`netlify build --offline` completed successfully**, using `@netlify/build` 37.7.0 and Next.js Runtime 5.16.3. It ran the production application build, packaged `___netlify-server-handler` and packaged the session proxy as `___netlify-edge-handler-node-middleware`. Completion took approximately 2 minutes 34 seconds.

The local command was:

```sh
NETLIFY_AGENT=codex pnpm --package=netlify-cli dlx netlify build --offline
```

Its PATH included Node 24, pnpm and the external npm installation. For a normal developer machine, use a standard Node 24 installation that includes npm. Keep npm and its developer toolchain out of `.netlify/plugins/`. There is no need to add npm to this application's dependencies, modify study code, disable SSR or pin an invented `@npmcli/docs` replacement.

The clean plugin files, old backup and generated Netlify outputs remain ignored. The project still uses Netlify's automatically selected OpenNext adapter. This was a **local build only**, not `netlify deploy`, a GitHub push or a production release. Actual hosted email/session refresh and two-device Realtime connectivity still require an approved preview test.

References: [Netlify local build command](https://cli.netlify.com/commands/build/), [Next.js support on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/).
