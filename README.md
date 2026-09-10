# Syncularity website

The public placeholder for Syncularity uses the selected Mercury ASCII sculpture in the Resonance composition, a matching ASCII header mark, and the company wordmark. Built with Next.js 15 and React 19.

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

`/` presents the selected Mercury design without review navigation. `/directions` retains the earlier visual directions at `/directions/resonance`, `/directions/groove`, and `/directions/bloom`. Review routes are marked noindex and carry a separate concept navigation bar.

The artwork is original procedural geometry with no external assets or added runtime dependencies. Each design has its own fixed palette: near-black, warm paper, and electric blue. Run `node scripts/generate-direction-stills.mjs` under Node 24 after changing the geometry to regenerate the complete SVG fallbacks. Motion runs at a capped frame rate, stops when paused, offscreen or in hidden tabs, and respects reduced-motion settings. Pointer response is limited to fine pointers. Static artwork and navigation remain available without JavaScript.

### Resonance motion studies

`/resonance` retains the three ASCII motion studies: `/resonance/mercury`, `/resonance/strange-loop`, and `/resonance/chorus`. Mercury is the selected design, with stronger liquid folds and traveling ripples. Its footer contains only “Stay tuned.” Its decorative status dot gently blinks while the artwork runs; this is not a backend health indicator. Pause, reduced motion, hidden tabs, and offscreen suspension also stop the blink.

Small screens use a coarser glyph grid and a capped 1.5 device-pixel ratio. Sustained rendering costs above 18 ms also reduce geometry and glyph density on larger screens. Detail only decreases during a mounted session, avoiding repeated visual switching. All artwork remains capped at 24 frames per second, with no React state updates in the frame loop.

The selected Mercury header reuses the favicon artwork with an 18-second CSS transform animation. It follows the artwork's shared motion state, including pause, hidden tabs and offscreen suspension, and remains static with reduced motion or without JavaScript.

After modifying these surfaces, run `node scripts/generate-motion-stills.mjs` to regenerate their local SVG fallbacks. Geometry tests cover a minute of motion, pointer extremes, ASCII-only output, depth-cell uniqueness, bounds, and compact-render silhouette preservation. The code must be released separately before it changes production.

PostCSS is overridden to a patched 8.x release because the pinned Next.js 15 release otherwise installs an older vulnerable parser. Keep the dependency audit clean when updating the lockfile.

### Share card

`public/share/mercury-v1.png` is the static 1200 × 630 share image used by Open Graph and large-image social cards. It embeds the selected ASCII artwork and the site's Helvetica Neue wordmark, so consumers need no JavaScript or fonts. `scripts/share-card.html` is its source composition: capture it in Chrome on macOS at 1200 × 630 with device scale factor 1 after its image loads. Commit the rendered PNG when updating the composition; use a new filename when replacing it to avoid reusing a cached image URL. Messaging services can still cache previously shared page metadata.
