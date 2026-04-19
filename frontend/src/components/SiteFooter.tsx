'use client';

import Link from 'next/link';
import BrandMark from '@/components/BrandMark';
import { Reveal } from '@/components/Reveal';

const groups = [
  {
    title: 'Core Systems',
    links: [
      { label: 'URL Analyzer', href: '/url-analyzer' },
      { label: 'Email Analyzer', href: '/email-analyzer' },
      { label: 'Attachment Analyzer', href: '/attachment-analyzer' },
      { label: 'QR Detector', href: '/qr-analyzer' },
    ],
  },
  {
    title: 'Observability',
    links: [
      { label: 'Live Dashboard', href: '/dashboard' },
      { label: 'Detection Grid', href: '/#analytics-grid' },
      { label: 'AI Surface Coverage', href: '/#coverage' },
      { label: 'Threat Workflow', href: '/#resources' },
    ],
  },
  {
    title: 'Access',
    links: [
      { label: 'Sign In', href: '/login' },
      { label: 'Create Account', href: '/register' },
      { label: 'Launch Console', href: '/dashboard' },
      { label: 'Start Scanning', href: '/url-analyzer' },
    ],
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-white/10 bg-slate-950/70">
      <div className="app-container py-14">
        <Reveal className="grid gap-12 xl:grid-cols-[1.15fr_repeat(3,minmax(0,1fr))]">
          <div className="space-y-5">
            <BrandMark showTagline />
            <p className="max-w-md text-sm leading-7 text-slate-300/70">
              Multi-layer phishing defense for links, inboxes, documents, and QR payloads.
              Built to feel like a security observatory instead of a utility page.
            </p>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">
              Author // Anas TAGUI
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="app-chip">Realtime heuristics</span>
              <span className="app-chip">ML scoring</span>
              <span className="app-chip">Threat intel</span>
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.title}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-100/70">
                {group.title}
              </p>
              <ul className="space-y-3 text-sm text-slate-300/[0.72]">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link className="transition hover:text-white" href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs uppercase tracking-[0.22em] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>PhishGuard Network // {year}</p>
          <p>Black ice interface. Human-centered defense.</p>
        </div>
      </div>
    </footer>
  );
}
