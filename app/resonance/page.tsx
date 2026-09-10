import Link from 'next/link';
import { motionStudies, motionNames, motionDescriptions } from '../../lib/resonance-motion';
import '../../components/directions/directions.css';

export const metadata = { title: 'Resonance / Motion studies — Syncularity', robots: { index: false, follow: false }, alternates: { canonical: null } };
export default function ResonanceStudies() {
  return <div className="study"><header className="study-header"><span>Syncularity</span><span>Resonance / Motion studies</span></header>
    <main className="study-main"><p className="study-kicker">Same frequency. New forms.</p><h1>Resonance.<br /><em>In motion.</em></h1>
      <div className="study-grid">{motionStudies.map((study, index) => <Link className="study-card resonance" href={`/resonance/${study}`} key={study}>
        <div className="study-image"><img src={`/resonance/${study}.svg`} alt="" width="1000" height="800" /></div>
        <div className="study-card-title"><span>0{index + 1} / {motionNames[study]}</span><span aria-hidden="true">↗</span></div><p>{motionDescriptions[study]}</p>
      </Link>)}</div>
    </main><footer className="study-footer"><span>Choose a sculpture to experience the motion.</span><Link href="/directions/resonance">Original Resonance ↗</Link></footer></div>;
}
