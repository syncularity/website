# Syncularity website

The public placeholder for Syncularity: an animated ASCII disc, waveform mark and company wordmark. Built with Next.js 15 and React 19, preserving the existing site's framework and the approved local design.

## Development

Use Node 24:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. To verify and serve a production build:

```sh
npm run check
npm start
```

`check` runs TypeScript, the Node animation tests and `next build`. Tests cover animation progression, pause/resume, reduced motion, hidden tabs and effect cleanup. All artwork and fonts are local; no forms, analytics, external APIs, or audio playback are included. The page remains readable without JavaScript.

## Deployment

The Vercel project is `syncularity-website` in Rudy's personal account, connected to the public `syncularity/website` repository. The company site uses `www.syncularity.io`, with `syncularity.io` redirecting to it. The `main` branch is the production source; feature branches should receive preview deployments. Update this project for subsequent releases; preserve the domain's email records.

Before release, run the checks and review the preview at desktop/mobile widths with keyboard and reduced-motion settings. After release, verify both domains and the served deployment's commit. Use the previous ready production deployment for rollback after future releases.

No environment variables are needed. Never commit `.vercel`, environment files, credentials or private company records.

## Design review

`/directions` compares three proposed visual directions, with individual animated pages at `/directions/resonance`, `/directions/groove`, and `/directions/bloom`. The existing homepage remains at `/`. These review routes are marked noindex and carry a separate concept navigation bar; selecting a final homepage is a subsequent change.

The artwork is original procedural geometry with no external assets or added runtime dependencies. Each design has its own fixed palette: near-black, warm paper, and electric blue. Run `node scripts/generate-direction-stills.mjs` under Node 24 after changing the geometry to regenerate the complete SVG fallbacks. Motion runs at a capped frame rate, stops when paused, offscreen or in hidden tabs, and respects reduced-motion settings. Pointer response is limited to fine pointers. Static artwork and navigation remain available without JavaScript.

### Resonance motion studies

`/resonance` compares three ASCII sculptures inside the unchanged Resonance composition: `/resonance/mercury`, `/resonance/strange-loop`, and `/resonance/chorus`. Mercury deforms a liquid ring, Strange Loop rotates a continuous trefoil tube, and Chorus opens and folds a harmonic membrane. The studies share the original palette, wordmark, copy, spacing, motion controls, and renderer lifecycle. The earlier `/directions` review remains available for comparison.

After modifying these surfaces, run `node scripts/generate-motion-stills.mjs` to regenerate their local SVG fallbacks. Geometry tests cover a minute of motion, pointer extremes, ASCII-only output, depth-cell uniqueness, and bounds. Choosing a study does not publish it as the homepage.

PostCSS is overridden to a patched 8.x release because the pinned Next.js 15 release otherwise installs an older vulnerable parser. Keep the dependency audit clean when updating the lockfile.
