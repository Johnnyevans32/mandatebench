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
  title: 'MandateBench · do payment agents stay within their mandate?',
  description:
    'A cross-model benchmark of mandate faithfulness and pre-signature monitorability for agentic-payment LLM agents.',
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
