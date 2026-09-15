import { brandAssets, brandTagline } from '../lib/brand';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.syncularity.io'),
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
