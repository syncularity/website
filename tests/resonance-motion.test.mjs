import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMotionArtwork, motionStudies, isMotionStudy } from '../lib/resonance-motion.ts';

test('motion review routes accept only the three sculptures', () => {
  for (const study of motionStudies) assert.equal(isMotionStudy(study), true);
  for (const study of ['', 'resonance', '../mercury', 'constructor']) assert.equal(isMotionStudy(study), false);
});

for (const study of motionStudies) {
  test(`${study} remains ASCII-only, finite, and inside the original art field through a full motion cycle`, () => {
    const initial = createMotionArtwork(study);
    assert.deepEqual(createMotionArtwork(study), initial);
    assert.notDeepEqual(createMotionArtwork(study, 3), initial);
    assert.notDeepEqual(createMotionArtwork(study, 0, 1, -1), initial);
    for (let t = 0; t <= 60; t += 2) {
      const { marks, strokes } = createMotionArtwork(study, t, Math.sin(t), Math.cos(t));
      assert.equal(strokes.length, 0);
      assert.ok(marks.length > 1500 && marks.length < 12000, `${study} at ${t}: bounded density`);
      const positions = new Set();
      for (const mark of marks) {
        assert.match(mark.glyph, /^[.:;=+*#%@]$/);
        assert.ok(mark.x > 0 && mark.x < 1000 && mark.y > 0 && mark.y < 800);
        assert.ok(Number.isFinite(mark.alpha) && mark.alpha >= 0 && mark.alpha <= 1);
        positions.add(`${mark.x}:${mark.y}`);
      }
      assert.equal(positions.size, marks.length, 'one glyph per depth-tested cell');
    }
  });
  test(`${study} has a complete deterministic fallback made from the same sculpture`, () => {
    const svg = readFileSync(new URL(`../public/resonance/${study}.svg`, import.meta.url), 'utf8');
    assert.equal((svg.match(/<text /g) || []).length, createMotionArtwork(study).marks.length);
    assert.match(svg, /viewBox="0 0 1000 800"/);
    assert.doesNotMatch(svg, /NaN|Infinity|<script|<image|<foreignObject/);
  });
}

test('compact Mercury keeps its silhouette with fewer, larger glyphs', () => {
  for (const time of [0, 4, 12, 30, 60]) {
    const full = createMotionArtwork('mercury', time);
    const compact = createMotionArtwork('mercury', time, 0, 0, true);
    assert.ok(compact.marks.length < full.marks.length * .8);
    assert.ok(compact.marks.length > 1200);
    assert.ok(compact.marks.every(mark => mark.size === 10));
    const bounds = art => [Math.min(...art.marks.map(m => m.x)), Math.max(...art.marks.map(m => m.x)), Math.min(...art.marks.map(m => m.y)), Math.max(...art.marks.map(m => m.y))];
    bounds(full).forEach((value, i) => assert.ok(Math.abs(value - bounds(compact)[i]) <= 12));
  }
});
