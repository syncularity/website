import { notFound } from 'next/navigation';
import { DirectionPage } from '../../../components/directions/direction-page';
import { motionStudies, motionNames, isMotionStudy } from '../../../lib/resonance-motion';

export function generateStaticParams() { return motionStudies.map(study => ({ study })); }
export async function generateMetadata({ params }: { params: Promise<{ study: string }> }) {
  const { study } = await params;
  return { title: `${isMotionStudy(study) ? motionNames[study] : 'Motion'} — Resonance / Syncularity`,
    robots: { index: false, follow: false }, alternates: { canonical: null } };
}
export default async function Page({ params }: { params: Promise<{ study: string }> }) {
  const { study } = await params;
  if (!isMotionStudy(study)) notFound();
  return <DirectionPage kind="resonance" motionStudy={study} />;
}
