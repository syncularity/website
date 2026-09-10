import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createArtwork, directions, isDirection } from '../lib/directions.ts';

test('direction routes accept only the three review designs', () => {
  for (const name of directions) assert.equal(isDirection(name), true);
  for (const name of ['', 'invalid', '../resonance', 'constructor']) assert.equal(isDirection(name), false);
});

for (const kind of directions) {
  test(`${kind} has deterministic, bounded artwork and changes with time`, () => {
    const initial = createArtwork(kind);
    assert.deepEqual(createArtwork(kind), initial);
    assert.notDeepEqual(createArtwork(kind, 3), initial);
    for (const time of [0, 3, 40, 200]) {
      const art = createArtwork(kind, time, 1, -1);
      assert.ok(art.marks.length + art.strokes.length > 50);
      assert.ok(art.marks.length < 14000);
      const coordinates = [...art.marks.map(m => [m.x, m.y]), ...art.strokes.flatMap(s => s.points)];
      assert.ok(coordinates.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && x > 0 && x < 1000 && y > 0 && y < 800));
    }
  });
  test(`${kind} ships a complete local SVG fallback`, () => {
    const svg = readFileSync(new URL(`../public/directions/${kind}.svg`, import.meta.url), 'utf8');
    assert.match(svg, /viewBox="0 0 1000 800"/);
    assert.match(svg, /<(text|rect|path) /);
    assert.doesNotMatch(svg, /NaN|Infinity|<script|<image|<foreignObject/);
  });
}
