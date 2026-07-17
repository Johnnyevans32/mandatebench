import type { Metadata } from 'next';
import { IBM_Plex_Mono, Newsreader } from 'next/font/google';
import './globals.css';

const serif = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mandatebench.xyz'),
  title: 'MandateBench · do payment agents stay within their mandate?',
  description:
    'A cross-model benchmark of mandate faithfulness and pre-signature monitorability for agentic-payment LLM agents. 9 frontier models, judge-free ground truth, open data.',
  alternates: { canonical: './' },
  keywords: [
    'AI safety',
    'agentic payments',
    'AP2',
    'x402',
    'LLM agents',
    'benchmark',
    'chain-of-thought monitoring',
    'AI agent security',
    'signed mandate',
  ],
  openGraph: {
    type: 'website',
    siteName: 'MandateBench',
    title: 'MandateBench: do AI payment agents stay within their mandate?',
    description:
      'Nine frontier models, a signed spending mandate, and adversarial pressure. No model catches every violation only a model can catch.',
    url: 'https://mandatebench.xyz',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'MandateBench' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MandateBench: do AI payment agents stay within their mandate?',
    description:
      'Nine frontier models, a signed spending mandate, and adversarial pressure. Telling the agent to hide its reasoning makes everything worse.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable}`}>
      <body>
        <nav className="nav">
          <a href="/" className="brand">
            Mandate<b>Bench</b>
          </a>
          <div className="links">
            <a href="/paper">Paper</a>
            <a href="/dashboard">Dashboard</a>
            <a href="https://github.com/Johnnyevans32/mandatebench">GitHub</a>
          </div>
        </nav>
        {children}
        <footer>
          <div className="wrap">
            MandateBench · MIT · an open benchmark of agentic-payment safety
          </div>
        </footer>
      </body>
    </html>
  );
}
