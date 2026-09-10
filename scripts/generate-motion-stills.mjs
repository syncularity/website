import { mkdirSync, writeFileSync } from 'node:fs';
import { createMotionArtwork, motionStudies } from '../lib/resonance-motion.ts';

mkdirSync(new URL('../public/resonance/', import.meta.url), { recursive: true });
for (const study of motionStudies) {
  const { marks } = createMotionArtwork(study);
  const glyphs = marks.map(m => `<text x="${m.x}" y="${m.y}" fill="${m.color}" opacity="${m.alpha.toFixed(2)}">${m.glyph}</text>`).join('');
  writeFileSync(new URL(`../public/resonance/${study}.svg`, import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800" font-family="monospace" font-size="8">${glyphs}</svg>`);
}
