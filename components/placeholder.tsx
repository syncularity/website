"use client";

import { useEffect, useRef } from 'react';
import { attachSignal } from '../lib/signal';

const fallback = `                        . : : : : .
                  . : = + * # # * + = : .
              . : = * # # + : : + # # * = : .
           . : + # # = .          . = # # + : .
              . : = * # # + : : + # # * = : .
                  . : = + * # # * + = : .
                        . : : : : .`;

export function Placeholder() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (root.current) return attachSignal(root.current);
  }, []);
  return (
<div className="page" ref={root}>
    <header>
      <a className="brand" href="/" aria-label="Syncularity home"><img src="/mark.svg" width="28" height="28" alt="" /><span>Syncularity</span></a>
      <span className="edition">IN THE MAKING</span>
    </header>
    <main>
      <div className="sculpture" aria-hidden="true">
        <div className="crosshair crosshair-left">+</div>
        <pre id="signal">{fallback}</pre>
        <div className="crosshair crosshair-right">+</div>
      </div>
      <div className="identity">
        <p className="eyebrow"><span className="status-dot"></span> UNDER DEVELOPMENT</p>
        <h1>Syncularity<span className="period">.</span></h1>
        <p className="tagline">A new frequency is taking shape.</p>
      </div>
    </main>
    <footer>
      <span className="signature">MUSIC <span className="divider">/</span> CULTURE <span className="divider">/</span> WHAT'S NEXT</span>
      <button id="motion" type="button" hidden><span className="motion-icon" aria-hidden="true">Ⅱ</span><span id="motion-label">Pause motion</span></button>
    </footer>
  </div>
  );
}
