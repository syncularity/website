# Syncularity website

The public company placeholder is a small Next.js App Router application. Keep company operating data, credentials and account research out of this repository.

- Use Node 24 and `npm ci`.
- Run `npm run check` before deployment: typecheck, animation tests, one production build, and the Chromium smoke suite. Install its browser once with `npx playwright install --only-shell chromium`. `npm run test:browser` reuses an existing build on isolated port 3107 and refuses an occupied server.
- Preserve the reviewed design, keyboard motion control and hidden-tab suspension. The landing artwork, header mark and status dot intentionally run regardless of system reduced-motion preferences. Clean up browser listeners and animation frames on unmount.
- The Vercel project is `syncularity-website` in Rudy's personal account; verify account, Git connection and domains before deployment. Never infer that a local build changed the public site.
- Site and deployment changes require the user's authorization. Preserve the prior production deployment for rollback.

- Add tests for observable failures at the cheapest meaningful layer. Keep helper tests for combinatorial inputs and the small browser suite for hydration, assets, keyboard behavior and static fallback. Avoid duplicated source-text assertions and large overlapping browser matrices. Keep full verification logs in ignored `artifacts/` and report counts, failures and log paths.
