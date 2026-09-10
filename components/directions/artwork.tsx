'use client';

import { useEffect, useRef } from 'react';
import { createArtwork, paintArtwork, type Direction } from '../../lib/directions';
import { createMotionArtwork, type MotionStudy } from '../../lib/resonance-motion';

export function Artwork({ kind, motionStudy }: { kind: Direction; motionStudy?: MotionStudy }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const host = hostRef.current, canvas = canvasRef.current, button = buttonRef.current;
    if (!host || !canvas || !button) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    let paused = false, visible = true, disposed = false;
    let frame = 0, last = 0, elapsed = 0;
    let compact = matchMedia('(max-width: 700px)').matches;
    let slowFrames = 0;
    let targetX = 0, targetY = 0, pointerX = 0, pointerY = 0;
    const canRun = () => !disposed && !paused && visible && !document.hidden;
    const draw = () => {
      const start = performance.now();
      paintArtwork(ctx, motionStudy ? createMotionArtwork(motionStudy, elapsed, pointerX, pointerY, compact)
        : createArtwork(kind, elapsed, pointerX, pointerY));
      // A sustained expensive render lowers density once, without oscillation.
      if (motionStudy && !compact) {
        slowFrames = performance.now() - start > 18 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
        if (slowFrames >= 8) compact = true;
      }
      host.dataset.detail = compact ? 'compact' : 'full';
      host.dataset.ready = 'true';
    };
    const tick = (now: number) => {
      frame = 0;
      if (!canRun()) return;
      if (!last || now - last >= 1000 / 24) {
        elapsed += last ? Math.min(now - last, 100) / 1000 : 0;
        last = now;
        pointerX += (targetX - pointerX) * .08;
        pointerY += (targetY - pointerY) * .08;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame); frame = 0; last = 0;
      host.dataset.motion = paused ? 'paused' : 'playing';
      const stage = host.closest<HTMLElement>('.direction-stage');
      if (stage) stage.dataset.motion = canRun() ? 'playing' : 'stopped';
      button.setAttribute('aria-pressed', String(paused));
      button.textContent = paused ? 'Play motion ↗' : 'Pause motion Ⅱ';
      if (canRun()) frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      if (matchMedia('(max-width: 700px)').matches) compact = true;
      const width = Math.min(compact ? 1100 : 1800, Math.round(host.clientWidth * Math.min(devicePixelRatio, compact ? 1.5 : 2)));
      if (!width) return;
      canvas.width = width; canvas.height = width * .8;
      ctx.setTransform(width / 1000, 0, 0, width / 1000, 0, 0);
      draw();
    };
    const toggle = () => { paused = !paused; sync(); };
    const move = (event: PointerEvent) => {
      if (!fine.matches || !canRun()) return;
      const box = host.getBoundingClientRect();
      targetX = (event.clientX - box.left) / box.width * 2 - 1;
      targetY = (event.clientY - box.top) / box.height * 2 - 1;
    };
    const leave = () => { targetX = targetY = 0; };
    const observer = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(host); intersection.observe(host);
    host.addEventListener('pointermove', move); host.addEventListener('pointerleave', leave);
    button.addEventListener('click', toggle);
    document.addEventListener('visibilitychange', sync);
    button.hidden = false; resize(); sync();
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect();
      host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave);
      button.removeEventListener('click', toggle);
      document.removeEventListener('visibilitychange', sync);
      button.hidden = true; delete host.dataset.ready;
    };
  }, [kind, motionStudy]);

  return <div className="direction-art" ref={hostRef} data-study={motionStudy}>
    <img src={motionStudy ? `/resonance/${motionStudy}.svg` : `/directions/${kind}.svg`} width="1000" height="800" alt="" className="art-still" fetchPriority="high" draggable="false" />
    <canvas ref={canvasRef} aria-hidden="true" />
    <button className="direction-motion" ref={buttonRef} type="button" hidden>Pause motion Ⅱ</button>
  </div>;
}
