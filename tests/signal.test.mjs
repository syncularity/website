import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attachSignal, renderSignal } from '../lib/signal.ts';

function setup(reduced = false) {
  const frames = new Map();
  const listeners = new Map();
  const target = (name) => ({
    addEventListener: (event, callback) => listeners.set(`${name}:${event}`, callback),
    removeEventListener: (event, callback) => {
      const key = `${name}:${event}`;
      if (listeners.get(key) === callback) listeners.delete(key);
    },
  });
  const output = { textContent: '' };
  const label = {};
  const icon = {};
  const button = { ...target('button'), hidden: true, querySelector: () => icon };
  const media = { ...target('media'), matches: reduced };
  let frameId = 0;
  const view = {
    matchMedia: () => media,
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
  };
  const document = { ...target('document'), hidden: false, defaultView: view };
  const root = { ownerDocument: document, querySelector: selector => ({ '#signal': output, '#motion': button, '#motion-label': label }[selector]) };
  const cleanup = attachSignal(root);
  const emit = (key, event) => listeners.get(key)?.(event);
  const step = time => {
    const [id, callback] = frames.entries().next().value;
    frames.delete(id);
    callback(time);
  };
  return { frames, listeners, root, output, label, button, document, cleanup, emit, step };
}

test('disc stays in a fixed grid and changes over time', () => {
  const initial = renderSignal(0);
  assert.equal(initial.split('\n').length, 40);
  assert.ok(initial.split('\n').every(line => line.length === 100));
  assert.match(initial, /[#%@]/);
  assert.notEqual(initial, renderSignal(1));
  assert.equal(initial, renderSignal(0));
});

test('pause/resume and hidden tabs preserve a single loop', () => {
  const s = setup();
  const initial = s.output.textContent;
  s.step(0); s.step(100);
  assert.notEqual(s.output.textContent, initial);
  s.emit('button:click');
  assert.equal(s.frames.size, 0);
  assert.equal(s.label.textContent, 'Resume motion');
  s.emit('button:click');
  assert.equal(s.frames.size, 1);
  s.document.hidden = true; s.emit('document:visibilitychange');
  assert.equal(s.frames.size, 0);
  s.document.hidden = false; s.emit('document:visibilitychange'); s.emit('document:visibilitychange');
  assert.equal(s.frames.size, 1);
  s.cleanup();
});

test('reduced motion renders a static frame and responds to changes', () => {
  const s = setup(true);
  assert.ok(s.output.textContent.trim());
  assert.equal(s.frames.size, 0);
  assert.equal(s.button.hidden, false);
  s.emit('media:change', { matches: false });
  assert.equal(s.frames.size, 1);
  s.emit('media:change', { matches: true });
  assert.equal(s.frames.size, 0);
  assert.equal(s.label.textContent, 'Resume motion');
  s.cleanup();
});

test('unmount and React effect remount leave no leaked listeners or frames', () => {
  const s = setup();
  assert.equal(s.listeners.size, 3);
  s.cleanup();
  assert.equal(s.listeners.size, 0);
  assert.equal(s.frames.size, 0);
  assert.equal(s.button.hidden, true);
  const disposeAgain = attachSignal(s.root);
  assert.equal(s.listeners.size, 3);
  assert.equal(s.frames.size, 1);
  disposeAgain();
  assert.equal(s.frames.size, 0);
  assert.equal(s.listeners.size, 0);
});
