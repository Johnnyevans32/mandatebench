import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MandateBench — do payment agents stay within their mandate?',
  description:
    'A cross-model benchmark of mandate faithfulness and pre-signature monitorability for agentic-payment LLM agents.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <a href="/" className="brand">
            Mandate<b>Bench</b>
          </a>
          <div className="links">
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
