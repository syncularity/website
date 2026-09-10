import Link from 'next/link';
import { Artwork } from './artwork';
import { directions, directionNames, type Direction } from '../../lib/directions';
import { motionStudies, motionNames, type MotionStudy } from '../../lib/resonance-motion';
import './directions.css';

export function DirectionPage({ kind, motionStudy, review = true }: { kind: Direction; motionStudy?: MotionStudy; review?: boolean }) {
  const selected = motionStudy === 'mercury';
  return <div className={`direction ${kind}${selected ? ' mercury' : ''}${review ? '' : ' selected-home'}`}>
    <div className="direction-stage">
      <header className="direction-header">
        <a href="/" className="direction-brand" aria-label="Syncularity home">
          {selected ? <img className="direction-mark mercury-mark" src="/mercury-icon.svg" width="36" height="36" alt="" draggable="false" />
            : <svg className="direction-mark" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 16h3l3-8 7 16 3-8h4" /><path d="M6 23h3M23 9h3" opacity=".5" /></svg>}
          {kind !== 'bloom' && <span>Syncularity</span>}
        </a>
        <span className="making"><i aria-hidden="true" /> In the making</span>
      </header>
      <main className="direction-main" id="main">
        {kind === 'resonance' && <>
          <div className="art-caption"><span>Music, art & technology</span><span className="caption-line" /></div>
          <Artwork kind={kind} motionStudy={motionStudy} />
          <div className="direction-title"><p>A new frequency is taking shape.</p><h1>Syncularity<span>✳</span></h1></div>
          <span className="coordinate" aria-hidden="true">+<br /><br /><br />+</span>
        </>}
        {kind === 'groove' && <>
          <div className="groove-heading"><p>Music. Technology. Taste.</p><h1>A new<br /><em>frequency.</em></h1></div>
          <Artwork kind={kind} />
          <div className="groove-note"><span className="note-line" /><p>Something good is taking shape.</p></div>
          <span className="groove-index" aria-hidden="true">S—01</span>
        </>}
        {kind === 'bloom' && <>
          <div className="bloom-orbit" aria-hidden="true" />
          <Artwork kind={kind} />
          <div className="bloom-heading"><p>Music, art & the unexpected.</p><h1>Syncularity</h1><span>A new frequency is taking shape.</span></div>
          <span className="bloom-coordinate left" aria-hidden="true">+</span><span className="bloom-coordinate right" aria-hidden="true">+</span>
        </>}
      </main>
      <footer className="direction-footer">{!selected && <span>{kind === 'groove' ? 'Syncularity © 2026' : 'Independent by nature.'}</span>}<span>{kind === 'groove' ? 'Stay curious.': 'Stay tuned.'}</span></footer>
    </div>
    {review && (motionStudy ? <nav className="direction-review" aria-label="Resonance motion studies">
      <a href="/resonance" className="review-label">Resonance <span> / Motion studies</span></a>
      <div>{motionStudies.map((value, i) => <Link key={value} href={`/resonance/${value}`} aria-current={motionStudy === value ? 'page' : undefined}><span>0{i + 1}</span> {motionNames[value]}</Link>)}</div>
      <Link className="review-hint" href="/directions/resonance">Original Resonance ↗</Link>
    </nav> : <nav className="direction-review" aria-label="Design directions">
      <a href="/directions" className="review-label">Design study <span> / 2026</span></a>
      <div>{directions.map((value, i) => <Link key={value} href={`/directions/${value}`} aria-current={kind === value ? 'page' : undefined}><span>0{i + 1}</span> {directionNames[value]}</Link>)}</div>
      <span className="review-hint">Three directions. One frequency.</span>
    </nav>)}
  </div>;
}
