import Link from 'next/link';
import { directions, directionNames } from '../../lib/directions';
import '../../components/directions/directions.css';

export const metadata = { title: 'Three directions — Syncularity', robots: { index: false, follow: false }, alternates: { canonical: null } };
const descriptions = ['An ASCII sculpture. Quiet, tactile, after dark.', 'Flowing grooves. Warm, editorial, a little unexpected.', 'A living signal. Electric, luminous, otherworldly.'];
export default function Directions() {
  return <div className="study"><header className="study-header"><span>Syncularity</span><span>Design studies / 2026</span></header>
    <main className="study-main"><p className="study-kicker">Music. Technology. Taste.</p><h1>One frequency.<br /><em>Three directions.</em></h1>
      <div className="study-grid">{directions.map((direction, index) => <Link className={`study-card ${direction}`} href={`/directions/${direction}`} key={direction}>
        <div className="study-image"><img src={`/directions/${direction}.svg`} alt="" width="1000" height="800" /></div>
        <div className="study-card-title"><span>0{index + 1} / {directionNames[direction]}</span><span aria-hidden="true">↗</span></div><p>{descriptions[index]}</p>
      </Link>)}</div>
    </main><footer className="study-footer">Choose a direction to experience the motion.</footer></div>;
}
