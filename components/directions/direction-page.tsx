import { brandAssets } from '../../lib/brand';
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
          <img className={`direction-mark${selected ? " ascii-play-mark" : ""}`} src={brandAssets.mark} width="36" height="36" alt="" draggable="false" />
          {kind !== 'bloom' && <span>Syncularity</span>}
        </a>
        <span className="making"><i aria-hidden="true" /> In the making</span>
      </header>
      <main className="direction-main" id="main">
        {kind === 'resonance' && <>
          <div className="art-caption"><span>Music, art & technology</span><span className="caption-line" /></div>
          <Artwork kind={kind} motionStudy={motionStudy} />
          <div className="direction-title"><p>A new frequency is taking shape.</p><h1>Syncularity<span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" focusable="false"><path d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5" /></svg></span></h1></div>
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
      <footer className="direction-footer">
        {!selected && <span>{kind === 'groove' ? 'Syncularity © 2026' : 'Independent by nature.'}</span>}
        {selected && !review ? <span>Stay tuned<span className="backstage-period">
          <span aria-hidden="true">.</span>
          <a className="backstage-link" href="https://www.syncularity.io/hq" aria-label="Go backstage" rel="nofollow" referrerPolicy="no-referrer">
            <span className="backstage-label" aria-hidden="true">Go backstage ↗</span>
          </a>
        </span></span> : <span>{kind === 'groove' ? 'Stay curious.' : 'Stay tuned.'}</span>}
      </footer>
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
