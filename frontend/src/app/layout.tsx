import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import AnimatedBackdrop from '@/components/AnimatedBackdrop';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'PhishGuard | AI Threat Observatory',
  description: 'A dark-mode phishing defense console for URLs, emails, QR payloads, and malicious attachments.',
  authors: [{ name: 'Anas TAGUI' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>
          <AnimatedBackdrop />
          <div className="relative z-10 flex min-h-screen flex-col">
            <Nav />
            <main className="flex-1 pb-16">{children}</main>
            <SiteFooter />
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
