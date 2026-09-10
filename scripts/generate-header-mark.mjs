import { writeFileSync } from 'node:fs';

// A right-facing play silhouette sampled as a small ASCII field. Keep the
// coarse grid readable at the header's 32–36px size, with a mint leading edge.
const glyphs = [];
for (let row = 0; row <= 12; row++) {
  const width = Math.round((1 - Math.abs(row - 6) / 6) * 11) + 1;
  for (let col = 0; col < width; col++) {
    const edge = col === width - 1;
    const glyph = edge ? '+' : col < 2 ? '#' : ['+', '*', ':', '='][(row + col * 3) % 4];
    const opacity = edge ? .95 : col < 2 ? .9 : .55 + (row % 3) * .12;
    glyphs.push(`<text x="${23 + col * 7}" y="${16 + row * 8}" fill="${edge ? '#b3f2d2' : '#e1e8e4'}" opacity="${opacity.toFixed(2)}">${glyph}</text>`);
  }
}
writeFileSync(new URL('../public/ascii-play.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><g font-family="monospace" font-size="9" font-weight="700" text-anchor="middle" dominant-baseline="central">${glyphs.join('')}</g></svg>\n`);
