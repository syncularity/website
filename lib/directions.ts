export const directions = ['resonance', 'groove', 'bloom'] as const;
export type Direction = typeof directions[number];
export const directionNames: Record<Direction, string> = {
  resonance: 'Resonance', groove: 'Groove Theory', bloom: 'Signal Bloom',
};
export function isDirection(value: string): value is Direction {
  return directions.some(direction => direction === value);
}

export type Mark = { x: number; y: number; alpha: number; size: number; glyph?: string; color: string };
export type Stroke = { points: [number, number][]; alpha: number; color: string; width: number };
export type Artwork = { marks: Mark[]; strokes: Stroke[] };
const tau = Math.PI * 2;

// All three sculptures are original, deterministic geometry. Coordinates use a
// fixed view box so the static SVG and animated canvas share one composition.
export function createArtwork(kind: Direction, time = 0, pointerX = 0, pointerY = 0): Artwork {
  const marks: Mark[] = [], strokes: Stroke[] = [];
  if (kind === 'resonance') {
    const cells = new Map<string, Mark & { depth: number }>();
    const tilt = .57 + Math.sin(time * .2) * .1 + pointerY * .07;
    const turn = -.36 + pointerX * .09;
    for (let ring = 0; ring < 76; ring++) {
      const v = ring / 76 * tau;
      for (let segment = 0; segment < 240; segment++) {
        const u = segment / 240 * tau;
        const tube = 102 + Math.sin(u * 3 + time * .42) * 9;
        const radius = 220 + tube * Math.cos(v);
        const x = radius * Math.cos(u), y = radius * Math.sin(u);
        const z = tube * Math.sin(v);
        const yy = y * Math.cos(tilt) - z * Math.sin(tilt);
        const depth = y * Math.sin(tilt) + z * Math.cos(tilt);
        const px = 500 + (x * Math.cos(turn) - yy * Math.sin(turn)) * 1.15;
        const py = 390 + (x * Math.sin(turn) + yy * Math.cos(turn)) * 1.15;
        const col = Math.round(px / 6), row = Math.round(py / 8);
        const key = `${col}:${row}`;
        if ((cells.get(key)?.depth ?? -Infinity) > depth) continue;
        const light = Math.max(.09, Math.min(1, .43 + .32 * Math.cos(v - 1.3) + .25 * Math.sin(u - .6)));
        const groove = .6 + .4 * Math.pow(.5 + .5 * Math.sin(v * 23 + u * 2 - time * .4), 2);
        const luminance = light * groove;
        cells.set(key, { x: col * 6, y: row * 8, depth, size: 8,
          alpha: .2 + luminance * .8, glyph: '.:+=*#%@'[Math.min(7, Math.floor(luminance * 8))],
          color: Math.sin(u + v * .35 - time * .13) > .91 ? '#b0f2db' : '#e1e8e4' });
      }
    }
    marks.push(...cells.values());
  } else if (kind === 'groove') {
    for (let line = 0; line < 68; line++) {
      const v = line / 67;
      const points: [number, number][] = [];
      for (let step = 0; step <= 240; step++) {
        const u = step / 240 * tau;
        const wave = Math.sin(u * 2 + time * .28) * 36;
        const radius = 235 + (v - .5) * 162;
        const x = radius * Math.cos(u) + (v - .5) * 58 * Math.sin(u * 2 + time * .18);
        const y = radius * Math.sin(u) * .64;
        const z = Math.sin(u * 2 + .7 + time * .22) * 120 + wave * (v - .5);
        points.push([500 + x * 1.27 + y * .22 + pointerX * 4,
          395 + y * .87 - z * .92 + x * -.36 + pointerY * 4]);
      }
      strokes.push({ points, alpha: .56 + .32 * Math.sin(v * Math.PI), color: '#24261f', width: .85 });
    }
  } else {
    const tilt = -.25 + pointerY * .05;
    for (let row = 1; row < 88; row++) {
      const latitude = row / 88 * Math.PI;
      for (let col = 0; col < 150; col++) {
        const longitude = col / 150 * tau;
        const ripple = Math.cos(longitude * 7 + time * .35) * Math.pow(Math.sin(latitude), 2);
        const radius = 238 + ripple * 42 + Math.cos(latitude * 8 + time * .4) * 13;
        const angle = longitude + time * .035 + pointerX * .05;
        const x = radius * Math.sin(latitude) * Math.cos(angle);
        const y = radius * Math.cos(latitude);
        const z = radius * Math.sin(latitude) * Math.sin(angle);
        const yy = y * Math.cos(tilt) - z * Math.sin(tilt);
        const zz = y * Math.sin(tilt) + z * Math.cos(tilt);
        marks.push({ x: 500 + x * 1.22, y: 395 + yy * 1.22,
          size: zz > 0 ? 1.05 : .65, alpha: zz > 0 ? .36 + zz / 470 : .1,
          color: row > 46 && col % 13 < 3 ? '#affffa' : '#f0f5ff' });
      }
    }
  }
  return { marks, strokes };
}

export function paintArtwork(ctx: CanvasRenderingContext2D, art: Artwork) {
  ctx.clearRect(0, 0, 1000, 800);
  ctx.font = '8px monospace';
  let fontSize = 8;
  for (const line of art.strokes) {
    ctx.beginPath(); ctx.globalAlpha = line.alpha; ctx.strokeStyle = line.color; ctx.lineWidth = line.width;
    line.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
  }
  for (const mark of art.marks) {
    ctx.globalAlpha = mark.alpha; ctx.fillStyle = mark.color;
    if (mark.glyph) {
      if (mark.size !== fontSize) { fontSize = mark.size; ctx.font = `${fontSize}px monospace`; }
      ctx.fillText(mark.glyph, mark.x, mark.y);
    }
    else ctx.fillRect(mark.x, mark.y, mark.size * 1.6, mark.size * 1.6);
  }
  ctx.globalAlpha = 1;
}
