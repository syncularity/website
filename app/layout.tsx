import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.syncularity.io'),
  title: 'Syncularity',
  description: 'Syncularity. A new frequency is taking shape.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Syncularity',
    description: 'A new frequency is taking shape.',
    url: '/',
    siteName: 'Syncularity',
    type: 'website',
  },
  icons: { icon: '/mercury-icon.svg' },
};

export const viewport: Viewport = { themeColor: '#08090b' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
