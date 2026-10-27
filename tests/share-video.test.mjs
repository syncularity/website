import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGrooveField, drawGrooveCard, grooveGrid, shareVideo, shareVideoFrames, shareVideoLabels, shareVideoPaths, shareVideoTargets,
} from '../lib/share-video.ts';

const key = cell => `${cell.col}:${cell.row}:${cell.glyph}:${cell.mint}`;

test('loop closes on itself and moves in between', () => {
  const start = createGrooveField(0);
  // Unwrapped time: the end of the loop must land on frame 0 by geometry, not by modulo.
  const end = createGrooveField(shareVideo.seconds);
  const startKeys = new Set(start.map(key));
  const matching = end.filter(cell => startKeys.has(key(cell))).length;
  assert.equal(end.length, start.length);
  assert.ok(matching / start.length > .999, `only ${matching} of ${start.length} cells match`);
  const middle = new Set(createGrooveField(shareVideo.seconds / 2).map(key));
  assert.ok(start.filter(cell => middle.has(key(cell))).length / start.length < .9);
  assert.equal(shareVideoFrames, 180);
});

test('disc stays ASCII, inside the card grid and below the wordmark', () => {
  for (let frame = 0; frame < shareVideoFrames; frame += 15) {
    const cells = createGrooveField(frame / shareVideo.fps);
    assert.ok(cells.length > 2000);
    for (const cell of cells) {
      assert.match(cell.glyph, /^[.:;=+*#%@]$/);
      assert.ok(cell.col >= 0 && cell.col < grooveGrid.columns && cell.row >= 0 && cell.row < grooveGrid.rows);
      assert.ok(cell.alpha > 0 && cell.alpha <= 1);
    }
    // The "y" descender ends near y 295; a 9px glyph's ink starts about 7px above its baseline.
    assert.ok(Math.min(...cells.map(cell => cell.row)) * grooveGrid.cellHeight - 7 > 295);
  }
});

test('mint playhead travels a full turn per loop', () => {
  const meanColumn = time => {
    const mint = createGrooveField(time).filter(cell => cell.mint);
    assert.ok(mint.length > 20, `playhead missing at ${time}s`);
    return mint.reduce((sum, cell) => sum + cell.col, 0) / mint.length;
  };
  // The head starts at 0.55 rad; these times put it at the right edge, then half a loop later the left.
  const right = shareVideo.seconds * (1 - .55 / (Math.PI * 2));
  const left = right - shareVideo.seconds / 2;
  assert.ok(meanColumn(right) - meanColumn(left) > 80);
});

function recordingContext() {
  const text = [];
  const ctx = new Proxy({}, {
    get(target, name) {
      if (name === 'fillText') return value => text.push(value);
      if (name === 'measureText') return value => ({ width: value.length * 60, actualBoundingBoxRight: value.length * 60 });
      return name in target ? target[name] : () => {};
    },
    set(target, name, value) { target[name] = value; return true; },
  });
  return { ctx, words: () => text.filter(value => value.length > 1) };
}

test('each card shows only the wordmark and its public entrance label', () => {
  for (const target of shareVideoTargets) {
    const { ctx, words } = recordingContext();
    drawGrooveCard(ctx, target, 1.25);
    assert.deepEqual(words(), ['Syncularity', ...(shareVideoLabels[target] ? [shareVideoLabels[target]] : [])]);
  }
  assert.deepEqual(Object.values(shareVideoLabels), [null, 'Backstage', 'Investor overview']);
});

test('video paths are versioned public MP4s', () => {
  for (const path of Object.values(shareVideoPaths)) assert.match(path, /^\/share\/groove(-[a-z]+)?-v\d+\.mp4$/);
  assert.equal(new Set(Object.values(shareVideoPaths)).size, shareVideoTargets.length);
});
