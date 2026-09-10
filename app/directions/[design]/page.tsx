import { notFound } from 'next/navigation';
import { DirectionPage } from '../../../components/directions/direction-page';
import { directions, directionNames, isDirection } from '../../../lib/directions';

export function generateStaticParams() { return directions.map(design => ({ design })); }
export async function generateMetadata({ params }: { params: Promise<{ design: string }> }) {
  const { design } = await params;
  return { title: `${isDirection(design) ? directionNames[design] : 'Design'} — Syncularity study`,
    robots: { index: false, follow: false }, alternates: { canonical: null } };
}
export default async function Page({ params }: { params: Promise<{ design: string }> }) {
  const { design } = await params;
  if (!isDirection(design)) notFound();
  return <DirectionPage kind={design} />;
}
