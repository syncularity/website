// Groove share loop, the og:video direction approved on 2026-10-27.
// Signal rings (lib/signal.ts) laid flat under the wordmark, with a mint playhead.
// The static og:image stays public/share/mercury-v1.png; this only feeds the MP4s
// that scripts/export-share-video.mjs renders in Chromium. Keep this module free of
// runtime imports so the exporter can serve it to the browser after type stripping.

export const shareVideoTargets = ['landing', 'backstage', 'investors'] as const;
export type ShareVideoTarget = typeof shareVideoTargets[number];

export const shareVideo = { width: 1200, height: 630, fps: 30, seconds: 6, type: 'video/mp4' } as const;
export const shareVideoFrames = shareVideo.fps * shareVideo.seconds;

// Versioned filenames: messaging services cache by URL, so a revision needs a new name.
export const shareVideoPaths: Record<ShareVideoTarget, string> = {
  landing: '/share/groove-v1.mp4',
  backstage: '/share/groove-backstage-v1.mp4',
  investors: '/share/groove-investors-v1.mp4',
};

// Public entrance labels only; the card never carries account or investor data.
export const shareVideoLabels: Record<ShareVideoTarget, string | null> = {
  landing: null,
  backstage: 'Backstage',
  investors: 'Investor overview',
};

const tau = Math.PI * 2;
const ramp = '.:;=+*#%@';
const color = { paper: '#090d0c', ink: '#edf1eb', mint: '#b3f2d2', glyphMint: '#b0f2db', glyphSilver: '#e1e8e4' };
const sans = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const mono = '"SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace';

export const grooveGrid = { cellWidth: 6, cellHeight: 9, columns: 200, rows: 70 } as const;
export type GrooveCell = { col: number; row: number; glyph: string; alpha: number; mint: boolean };

// One frame of the disc. Every time term is a whole number of turns per loop, so
// time 0 and time `shareVideo.seconds` describe the same frame.
export function createGrooveField(time: number): GrooveCell[] {
  const phase = tau * time / shareVideo.seconds;
  const { cellWidth, cellHeight, columns, rows } = grooveGrid;
  const depth = new Float32Array(columns * rows).fill(-Infinity);
  const light = new Float32Array(columns * rows);
  const mint = new Uint8Array(columns * rows);
  const tilt = 1.18, ct = Math.cos(tilt), st = Math.sin(tilt);
  const centerX = 600, centerY = 500, scaleX = 600, scaleY = 430;
  const rings = 58, segments = 720;
  const head = .55 + phase; // The playhead makes one full turn per loop.
  for (let ring = 0; ring < rings; ring++) {
    const radius = .23 + ring * (.83 / (rings - 1));
    const envelope = .065 * Math.sin(radius * Math.PI);
    for (let segment = 0; segment < segments; segment++) {
      const angle = segment / segments * tau;
      // Six lobes travelling one sixth of a turn per loop read as a slow rotation.
      const wave = Math.sin(angle * 6 - phase + radius * 7) * envelope;
      const x = radius * Math.cos(angle), y = radius * Math.sin(angle);
      const z = wave + .025 * Math.sin(ring * 1.4);
      const yy = y * ct - z * st, zz = y * st + z * ct;
      const col = Math.round((centerX + x * scaleX) / cellWidth);
      const row = Math.round((centerY + yy * scaleY) / cellHeight);
      if (col < 0 || col >= columns || row < 0 || row >= rows) continue;
      const index = row * columns + col;
      if (zz <= depth[index]) continue;
      depth[index] = zz;
      const groove = .5 + .5 * Math.sin(ring * 1.6 + angle * 2 - phase);
      const lit = .26 + .34 * (Math.sin(angle - .8) + 1) / 2 + groove * .36;
      const behind = ((angle - head) % tau + tau * 1.5) % tau - Math.PI;
      const trail = behind <= 0 && behind > -.5 ? 1 + behind / .5 : 0;
      // Near rows read brighter than far rows, a quiet depth cue on a flat disc.
      const near = .5 + .5 * (y + 1.06) / 2.12;
      light[index] = Math.min(1, lit + trail * .3) * near;
      mint[index] = trail > .62 && ring > 6 ? 1 : 0;
    }
  }
  const cells: GrooveCell[] = [];
  for (let index = 0; index < depth.length; index++) {
    if (depth[index] === -Infinity) continue;
    const value = light[index];
    cells.push({
      col: index % columns, row: Math.floor(index / columns),
      glyph: ramp[Math.min(ramp.length - 1, Math.floor(value * ramp.length))],
      alpha: .18 + value * .82, mint: mint[index] === 1,
    });
  }
  return cells;
}

export type CardContext = Pick<CanvasRenderingContext2D,
  'fillRect' | 'fillText' | 'measureText' | 'beginPath' | 'arc' | 'fill' | 'moveTo' | 'lineTo' | 'stroke'
  | 'save' | 'restore' | 'font' | 'fillStyle' | 'strokeStyle' | 'lineWidth' | 'globalAlpha'
  | 'textAlign' | 'textBaseline' | 'letterSpacing'>;

function setType(ctx: CardContext, size: number, family: string, tracking: number) {
  ctx.font = `400 ${size}px ${family}`;
  ctx.letterSpacing = `${(tracking * size).toFixed(2)}px`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// The ✳ is stroked rather than set as text so it never falls back to another font.
function star(ctx: CardContext, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.strokeStyle = color.mint;
  ctx.lineWidth = r * .13;
  ctx.beginPath();
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 4, dx = Math.cos(a) * r, dy = Math.sin(a) * r;
    ctx.moveTo(cx - dx, cy - dy); ctx.lineTo(cx + dx, cy + dy);
  }
  ctx.stroke();
  ctx.restore();
}

function wordmark(ctx: CardContext) {
  const size = 156, baseline = 262;
  setType(ctx, size, sans, -.075);
  const metrics = ctx.measureText('Syncularity');
  const left = 600 - metrics.width / 2;
  ctx.globalAlpha = 1;
  ctx.fillStyle = color.ink;
  ctx.fillText('Syncularity', left, baseline);
  ctx.letterSpacing = '0px';
  star(ctx, left + metrics.actualBoundingBoxRight + size * .237, baseline - size * .64, size * .079);
}

// Mint dot plus label, the pairing the access pages use.
function label(ctx: CardContext, text: string) {
  const size = 40, baseline = 112;
  setType(ctx, size, sans, -.015);
  const width = ctx.measureText(text).width;
  const dot = size * .17, gap = size * .4;
  const left = 600 - (dot * 2 + gap + width) / 2;
  ctx.globalAlpha = 1;
  ctx.fillStyle = color.mint;
  ctx.beginPath(); ctx.arc(left + dot, baseline - size * .35, dot, 0, tau); ctx.fill();
  ctx.fillStyle = color.ink;
  ctx.fillText(text, left + dot * 2 + gap, baseline);
  ctx.letterSpacing = '0px';
}

// Draws one 1200x630 frame. `ctx` must map one unit to one output pixel.
export function drawGrooveCard(ctx: CardContext, target: ShareVideoTarget, time: number) {
  const loop = shareVideo.seconds;
  const cells = createGrooveField(((time % loop) + loop) % loop);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color.paper;
  ctx.fillRect(0, 0, shareVideo.width, shareVideo.height);
  ctx.font = `9px ${mono}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (const cell of cells) {
    ctx.globalAlpha = cell.alpha;
    ctx.fillStyle = cell.mint ? color.glyphMint : color.glyphSilver;
    ctx.fillText(cell.glyph, cell.col * grooveGrid.cellWidth, cell.row * grooveGrid.cellHeight);
  }
  wordmark(ctx);
  const text = shareVideoLabels[target];
  if (text) label(ctx, text);
  ctx.restore();
}
