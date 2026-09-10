import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(readFileSync(new URL('../components/directions/artwork.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function mount(reduce) {
  const frames = new Map(), listeners = new Map(), stage = { dataset: {} };
  let effect, frameId = 0, draws = 0, refIndex = 0, intersection;
  const events = name => ({
    addEventListener: (event, fn) => listeners.set(`${name}:${event}`, fn),
    removeEventListener: event => listeners.delete(`${name}:${event}`),
  });
  const host = { ...events('host'), dataset: {}, clientWidth: 390, closest: () => stage };
  const canvas = { getContext: () => ({ setTransform() {} }) };
  const button = { ...events('button'), hidden: true, setAttribute() {} };
  const refs = [host, canvas, button];
  const document = { ...events('document'), hidden: false };
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require: name => name === 'react' ? {
      useEffect: fn => { effect = fn; }, useRef: () => ({ current: refs[refIndex++] }),
    } : name === 'react/jsx-runtime' ? { jsx() {}, jsxs() {} } : {
      createArtwork() {}, createMotionArtwork() {}, paintArtwork: () => draws++,
    },
    document, performance: { now: () => 0 }, devicePixelRatio: 2,
    matchMedia: query => ({ matches: query.includes('reduced-motion') ? reduce : query.includes('max-width'), ...events(query) }),
    requestAnimationFrame: fn => { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
    ResizeObserver: class { observe() {} disconnect() {} },
    IntersectionObserver: class { constructor(fn) { intersection = fn; } observe() {} disconnect() {} },
  });
  exports.Artwork({ kind: 'resonance', motionStudy: 'mercury' });
  const cleanup = effect();
  const step = time => {
    const [id, fn] = frames.entries().next().value;
    frames.delete(id); fn(time);
  };
  return { frames, listeners, stage, button, document, cleanup, step, draws: () => draws,
    emit: key => listeners.get(key)?.(), visibility: visible => intersection([{ isIntersecting: visible }]) };
}

for (const reduce of [false, true]) {
  test(`landing motion starts with system reduced motion ${reduce ? 'on' : 'off'} and preserves manual/lifecycle controls`, () => {
    const s = mount(reduce);
    assert.equal(s.stage.dataset.motion, 'playing');
    assert.equal(s.button.textContent, 'Pause motion Ⅱ');
    assert.equal(s.frames.size, 1);
    const before = s.draws(); s.step(100); s.step(150);
    assert.ok(s.draws() > before);
    s.emit('button:click');
    assert.equal(s.frames.size, 0);
    assert.equal(s.stage.dataset.motion, 'stopped');
    assert.equal(s.button.textContent, 'Play motion ↗');
    s.emit('button:click');
    assert.equal(s.frames.size, 1);
    s.document.hidden = true; s.emit('document:visibilitychange');
    assert.equal(s.frames.size, 0);
    s.document.hidden = false; s.emit('document:visibilitychange');
    s.emit('document:visibilitychange');
    assert.equal(s.frames.size, 1);
    s.visibility(false); assert.equal(s.frames.size, 0);
    s.visibility(true); assert.equal(s.frames.size, 1);
    s.cleanup();
    assert.equal(s.frames.size, 0);
    assert.equal(s.listeners.size, 0);
  });
}
