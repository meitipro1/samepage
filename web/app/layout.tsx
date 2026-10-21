import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata, Viewport } from 'next';

import './global.css';

/*
 * Outfit, Geist Mono and IBM Plex Serif, loaded by the browser from
 * Google Fonts rather than downloaded at build time, so a build never depends
 * on reaching the font CDN.
 */
const FONTS =
  'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=IBM+Plex+Serif:ital,wght@0,400;0,500;1,400&family=Outfit:wght@400;500;600;700&display=swap';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://usesamepage.vercel.app'),
  title: { default: 'Samepage: agree on the deal before the work starts', template: '%s · Samepage' },
  description:
    'Two accounts of one deal, checked before anyone signs. Both sides write the deal in their own words, sealed so neither can copy the other; GenLayer validators compare the two accounts on six terms and name every difference, and the deal is signed only when both are on the same page.',
  openGraph: { siteName: 'Samepage', type: 'website' },
};

export const viewport: Viewport = { themeColor: '#0b0b0e', colorScheme: 'dark' };

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider theme={{ forcedTheme: 'dark', defaultTheme: 'dark', enableSystem: false }}>{children}</RootProvider>
      </body>
    </html>
  );
}
