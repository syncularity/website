import { writeFileSync } from 'node:fs';
import { createArtwork, directions } from '../lib/directions.ts';

for (const kind of directions) {
  const { marks, strokes } = createArtwork(kind);
  const paths = strokes.map(s => `<path fill="none" stroke="${s.color}" stroke-width="${s.width}" opacity="${s.alpha.toFixed(2)}" d="${s.points.map(([x,y],i) => `${i?'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('')}"/>`).join('');
  const dots = marks.map(m => m.glyph
    ? `<text x="${m.x}" y="${m.y}" fill="${m.color}" opacity="${m.alpha.toFixed(2)}">${m.glyph}</text>`
    : `<rect x="${m.x.toFixed(1)}" y="${m.y.toFixed(1)}" width="${(m.size*1.6).toFixed(1)}" height="${(m.size*1.6).toFixed(1)}" fill="${m.color}" opacity="${m.alpha.toFixed(2)}"/>`).join('');
  writeFileSync(new URL(`../public/directions/${kind}.svg`, import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800" font-family="monospace" font-size="8">${paths}${dots}</svg>`);
}
