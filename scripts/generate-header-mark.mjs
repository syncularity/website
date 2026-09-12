import { writeFileSync } from 'node:fs';

// The selected Signal Play study: seven rows with a sharp mint leading edge.
// Draw ASCII glyphs as paths so the mark never depends on a platform font.
const paths = {
  '+': 'M1 3H5M3 1V5',
  '#': 'M2 .5L1.5 5.5M4.5 .5L4 5.5M.5 2H5.5M.2 4H5.2',
  '=': 'M1 2H5M1 4H5',
  '*': 'M3 .5V5.5M.8 1.6L5.2 4.4M.8 4.4L5.2 1.6',
};
const glyphs = [];
for (const [row, width] of [1, 3, 5, 7, 5, 3, 1].entries()) {
  for (let col = 0; col < width; col++) {
    const edge = col === width - 1;
    const glyph = edge ? '+' : ['#', '*', '='][(row + col) % 3];
    const x = (12 + col * 10.7).toFixed(2);
    const y = (12 + row * 11.4).toFixed(2);
    glyphs.push(`<path d="${paths[glyph]}" transform="translate(${x} ${y}) scale(1.400)" stroke="${edge ? '#b3f2d2' : '#edf1eb'}" stroke-width="1.15" stroke-linecap="square" fill="none" opacity="${edge ? '1.00' : '0.88'}"/>`);
  }
}
const field = glyphs.join('');
const svg = (background = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><title>Syncularity Signal Play</title>${background}${field}</svg>\n`;
writeFileSync(new URL('../public/ascii-play.svg', import.meta.url), svg());
// A dark backing keeps the same mark visible on light and dark browser tabs.
writeFileSync(new URL('../public/ascii-play-icon.svg', import.meta.url), svg('<rect width="100" height="100" rx="20" fill="#090d0c"/>'));
