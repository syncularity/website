import type { Artwork, Mark } from './directions';

export const motionStudies = ['mercury', 'strange-loop', 'chorus'] as const;
export type MotionStudy = typeof motionStudies[number];
export const motionNames: Record<MotionStudy, string> = {
  mercury: 'Mercury', 'strange-loop': 'Strange Loop', chorus: 'Chorus',
};
export const motionDescriptions: Record<MotionStudy, string> = {
  mercury: 'A molten ring. Stretching, flowing, never quite still.',
  'strange-loop': 'An impossible knot. Three loops, one continuous current.',
  chorus: 'A sound sculpture. Folding, opening, breathing in waves.',
};
export function isMotionStudy(value: string): value is MotionStudy {
  return motionStudies.some(study => study === value);
}

const tau = Math.PI * 2;
const columns = 168, rows = 84;
const glyphs = '.:;=+*#%@';
type Point = [number, number, number];
type Surface = (u: number, v: number) => Point;

function surfaceFor(study: MotionStudy, time: number): Surface {
  if (study === 'mercury') return (u, v) => {
    const flow = u * 3 - time * .83;
    const breath = Math.sin(time * .57);
    const radius = 202 + Math.sin(flow) * (23 + breath * 8) + Math.cos(u * 2 + time * .43) * 13;
    const tube = 80 + Math.sin(flow + 1.7) * 24 + Math.cos(u * 2 - time * .61) * 11;
    const skin = tube + 5 * Math.sin(v * 4 + u * 6 - time * 1.2);
    const stretch = 1 + breath * .12;
    return [(radius + skin * Math.cos(v)) * Math.cos(u) * stretch,
      (radius + skin * Math.cos(v)) * Math.sin(u) / stretch,
      skin * Math.sin(v) + 39 * Math.sin(u * 2 - time * .72)];
  };
  if (study === 'strange-loop') return (u, v) => {
    // A tube swept along a trefoil; the moving frame keeps every strand joined.
    const x = (Math.sin(u) + 2 * Math.sin(2 * u)) * 83;
    const y = (Math.cos(u) - 2 * Math.cos(2 * u)) * 83;
    const z = -Math.sin(3 * u) * 94;
    let tx = (Math.cos(u) + 4 * Math.cos(2 * u)) * 83;
    let ty = (-Math.sin(u) + 4 * Math.sin(2 * u)) * 83;
    let tz = -Math.cos(3 * u) * 282;
    const length = Math.hypot(tx, ty, tz);
    tx /= length; ty /= length; tz /= length;
    const planar = Math.hypot(tx, ty);
    const nx = -ty / planar, ny = tx / planar;
    const bx = -tz * ny, by = tz * nx, bz = tx * ny - ty * nx;
    const twist = v + u * 2 + time * .37;
    const thickness = 45 + Math.sin(u * 3 - time * .9) * 10;
    const a = Math.cos(twist) * thickness, b = Math.sin(twist) * thickness * .9;
    return [x + nx * a + bx * b, y + ny * a + by * b, z + bz * b];
  };
  return (u, v) => {
    // Traveling spherical harmonics turn a membrane into a deep, five-lobed bloom.
    const latitude = v / 2;
    const envelope = Math.sin(latitude);
    const openness = .5 + .5 * Math.sin(time * .62);
    const folds = Math.cos(u * 5 + latitude * 3 - time * .6);
    const radius = 191 + folds * (39 + openness * 42) * envelope * envelope
      + Math.cos(latitude * 6 - time * .84) * 23;
    const twist = u + Math.sin(latitude * 2 + time * .44) * .28;
    return [radius * envelope * Math.cos(twist),
      radius * Math.cos(latitude) * (1.08 - openness * .12),
      radius * envelope * Math.sin(twist)];
  };
}

export function createMotionArtwork(study: MotionStudy, time = 0, pointerX = 0, pointerY = 0): Artwork {
  const surface = surfaceFor(study, time);
  const tilt = study === 'mercury' ? .50 + Math.sin(time * .4) * .28
    : study === 'strange-loop' ? .36 + time * .12 : .22 + Math.sin(time * .3) * .23;
  const yaw = (study === 'strange-loop' ? time * .20 : study === 'chorus' ? time * .12 : .16) + pointerX * .16;
  const roll = -.32 + Math.sin(time * .23) * .13 + pointerY * .10;
  const cx = Math.cos(tilt), sx = Math.sin(tilt), cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cz = Math.cos(roll), sz = Math.sin(roll);
  const position = new Float32Array((columns + 1) * (rows + 1) * 3);
  const scale = study === 'chorus' ? 1.27 : 1.12;
  for (let i = 0; i <= columns; i++) {
    for (let j = 0; j <= rows; j++) {
      const [x, y, z] = surface(i / columns * tau, j / rows * tau);
      const y1 = y * cx - z * sx, z1 = y * sx + z * cx;
      const x1 = x * cy + z1 * sy, z2 = -x * sy + z1 * cy;
      const index = (i * (rows + 1) + j) * 3;
      position[index] = (x1 * cz - y1 * sz) * scale;
      position[index + 1] = (x1 * sz + y1 * cz) * scale;
      position[index + 2] = z2 * scale;
    }
  }
  const gridWidth = 168, gridHeight = 100;
  const depth = new Float32Array(gridWidth * gridHeight).fill(-Infinity);
  const cells: (Mark | undefined)[] = new Array(gridWidth * gridHeight);
  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      const p = (i * (rows + 1) + j) * 3;
      const nextU = p + (rows + 1) * 3, nextV = p + 3;
      const x = position[p], y = position[p + 1], z = position[p + 2];
      const col = Math.round((500 + x) / 6), row = Math.round((390 + y) / 8);
      if (col < 0 || col >= gridWidth || row < 0 || row >= gridHeight) continue;
      const index = row * gridWidth + col;
      if (depth[index] >= z) continue;
      depth[index] = z;
      const ax = position[nextU] - x, ay = position[nextU + 1] - y, az = position[nextU + 2] - z;
      const bx = position[nextV] - x, by = position[nextV + 1] - y, bz = position[nextV + 2] - z;
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      const length = Math.hypot(nx, ny, nz) || 1;
      nx /= length; ny /= length; nz /= length;
      // Two-sided light makes folds readable when the surface turns inside out.
      if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const diffuse = Math.max(0, nx * -.38 + ny * -.55 + nz * .74);
      const specular = Math.pow(Math.max(0, nx * -.2 + ny * -.35 + nz * .915), 18);
      const groove = .85 + .15 * Math.sin(j * 1.7 + i * .21 - time * .65);
      const light = Math.min(1, (.17 + diffuse * .62 + specular * .4) * groove);
      cells[index] = { x: col * 6, y: row * 8, size: 8,
        alpha: .24 + light * .76, glyph: glyphs[Math.min(glyphs.length - 1, Math.floor(light * glyphs.length))],
        color: nx > .4 && diffuse > .3 ? '#b0f2db' : '#e1e8e4' };
    }
  }
  return { marks: cells.filter((mark): mark is Mark => !!mark), strokes: [] };
}
