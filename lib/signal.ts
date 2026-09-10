const width = 100;
const height = 40;
const shades = ' .,:;=+*#%@';

export function renderSignal(time: number): string {
    const cells = Array(width * height).fill(' ');
    const depth = new Float32Array(width * height).fill(-Infinity);
    const tilt = .70 + .12 * Math.sin(time * .23);
    const turn = -.32 + .12 * Math.sin(time * .19);
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    const cr = Math.cos(turn), sr = Math.sin(turn);
    for (let ring = 0; ring < 47; ring++) {
      const radius = .23 + ring * .018;
      for (let segment = 0; segment < 290; segment++) {
        const angle = segment / 290 * Math.PI * 2;
        const wave = Math.sin(angle * 6 + time * .8 + radius * 7) * .065 * Math.sin(radius * Math.PI);
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        const z = wave + .025 * Math.sin(ring * 1.4);
        const yy = y * ct - z * st;
        const zz = y * st + z * ct;
        const xx = x * cr - yy * sr;
        const ry = x * sr + yy * cr;
        const col = Math.round(width / 2 + xx * 42);
        const row = Math.round(height / 2 + ry * 19);
        if (col < 0 || col >= width || row < 0 || row >= height) continue;
        const index = row * width + col;
        if (zz <= depth[index]) continue;
        depth[index] = zz;
        const groove = .5 + .5 * Math.sin(ring * 1.6 + angle * 2 - time * .32);
        const light = .26 + .34 * (Math.sin(angle - .8) + 1) / 2 + groove * .36;
        cells[index] = shades[Math.min(shades.length - 1, Math.floor(light * shades.length))];
      }
    }
    return Array.from({length: height}, (_, row) => cells.slice(row * width, (row + 1) * width).join('')).join('\n');
  }


export function attachSignal(root: HTMLElement): () => void {
  const output = root.querySelector<HTMLPreElement>('#signal')!;
  const button = root.querySelector<HTMLButtonElement>('#motion')!;
  const label = root.querySelector<HTMLElement>('#motion-label')!;
  const icon = button.querySelector<HTMLElement>('.motion-icon')!;
  const document = root.ownerDocument;
  const view = document.defaultView!;
  const preference = view.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches;
  let frame = 0;
  let elapsed = 0;
  let lastTime: number | null = null;
  let lastPaint = -Infinity;

  function tick(now: number) {
    frame = 0;
    if (paused || document.hidden) return;
    if (lastTime !== null) elapsed += Math.min(now - lastTime, 100);
    lastTime = now;
    if (now - lastPaint >= 1000 / 24) {
      output.textContent = renderSignal(elapsed / 1000);
      lastPaint = now;
    }
    frame = view.requestAnimationFrame(tick);
  }

  function syncMotion() {
    view.cancelAnimationFrame(frame);
    frame = 0;
    lastTime = null;
    label.textContent = paused ? 'Resume motion' : 'Pause motion';
    icon.textContent = paused ? '▷' : 'Ⅱ';
    if (!paused && !document.hidden) frame = view.requestAnimationFrame(tick);
  }

  const toggle = () => { paused = !paused; syncMotion(); };
  const updatePreference = (event: MediaQueryListEvent) => { paused = event.matches; syncMotion(); };
  button.hidden = false;
  button.addEventListener('click', toggle);
  preference.addEventListener('change', updatePreference);
  document.addEventListener('visibilitychange', syncMotion);
  output.textContent = renderSignal(0);
  syncMotion();
  return () => {
    view.cancelAnimationFrame(frame);
    button.removeEventListener('click', toggle);
    preference.removeEventListener('change', updatePreference);
    document.removeEventListener('visibilitychange', syncMotion);
    button.hidden = true;
  };
}
