import { brandAssets, brandTagline } from '../lib/brand';
import { shareVideo, shareVideoPaths } from '../lib/share-video';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const siteOrigin = new URL('https://www.syncularity.io');

export const metadata: Metadata = {
  metadataBase: siteOrigin,
  title: 'Syncularity',
  description: brandTagline,
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Syncularity',
    description: brandTagline,
    url: '/',
    siteName: 'Syncularity',
    type: 'website',
    images: [{
      url: '/share/mercury-v1.png',
      width: 1200,
      height: 630,
      type: 'image/png',
      alt: 'A silver and mint ASCII Mercury sculpture above the Syncularity wordmark.',
    }],
    // Clients that play og:video show the Groove loop; all others keep the image above.
    // Next 15 resolves metadataBase for images but emits video URLs as given, so pass it absolute.
    videos: [{
      url: new URL(shareVideoPaths.landing, siteOrigin).href,
      type: shareVideo.type,
      width: shareVideo.width,
      height: shareVideo.height,
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Syncularity',
    description: brandTagline,
    images: [{
      url: '/share/mercury-v1.png',
      alt: 'A silver and mint ASCII Mercury sculpture above the Syncularity wordmark.',
    }],
  },
  icons: { icon: { url: brandAssets.icon, type: 'image/svg+xml' } },
};

export const viewport: Viewport = { themeColor: '#08090b' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
