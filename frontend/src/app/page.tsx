'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FloatingPanel, Reveal } from '@/components/Reveal';

const summaryItems = [
  {
    title: 'Multi-layer verdicts',
    copy: 'Every scan blends heuristics, ML confidence, domain age, and live reputation.',
  },
  {
    title: 'Inbox-grade context',
    copy: 'Email, links, QR payloads, and attachments share one decision surface.',
  },
  {
    title: 'Operator clarity',
    copy: 'Scores explain themselves through reason trails, evidence cards, and status glyphs.',
  },
  {
    title: 'Dark-room presence',
    copy: 'The interface reads like an observatory instead of a plain form stack.',
  },
];

const telemetrySources = ['VirusTotal', 'Safe Browsing', 'WHOIS Age', 'ML Heuristics', 'QR Parsing', 'LLM Verdicts'];

const coveragePlatforms = [
  'ChatGPT',
  'Perplexity',
  'Claude',
  'Gemini',
  'Google AI Overview',
  'Copilot',
  'Grok',
  'Amazon Rufus',
  'Meta AI',
  'DeepSeek',
];

const faqItems = [
  {
    question: 'How does PhishGuard score a threat?',
    answer:
      'The score aggregates structural URL signals, sender and language cues, live reputation lookups, model probability, and context like redirects or homograph attacks.',
  },
  {
    question: 'Can I use the tools separately?',
    answer:
      'Yes. Each analyzer works independently, but the visual system and dashboard make them feel like one surveillance stack instead of disconnected utilities.',
  },
  {
    question: 'What makes the attachment and QR flows useful?',
    answer:
      'They extract hidden URLs and risky behaviors from files or image payloads, then immediately pass those artifacts into the same risk engine used for direct URL analysis.',
  },
  {
    question: 'Is the dashboard only for signed-in users?',
    answer:
      'Live history and aggregate stats are tied to an account. Guests can still scan content, but persistence and longitudinal visibility live in the authenticated dashboard.',
  },
];

const stories = [
  {
    name: 'SOC Relay',
    headline: 'Cut triage time by turning ambiguous warnings into evidence-backed decisions.',
    copy:
      'Operators stopped bouncing between scanners and reputation tools. The interface surfaces the verdict, the reason trail, and the corroborating telemetry in one pass.',
  },
  {
    name: 'Trust Ops',
    headline: 'Gave phishing review a premium command-center feel without losing usability.',
    copy:
      'The dark product shell, motion system, and structured cards make the app feel intentional while keeping the scan journey fast enough for daily use.',
  },
];

const resources = [
  {
    eyebrow: 'Threat workflow',
    title: 'Start with a suspicious URL and pivot through every supporting signal.',
    copy:
      'Investigators can move from a raw link to domain age, model confidence, safe browsing status, and redirect ancestry without leaving the product.',
    href: '/url-analyzer',
    label: 'Inspect URLs',
  },
  {
    eyebrow: 'Analyst console',
    title: 'Track scans over time through a dashboard built like an ambient watch floor.',
    copy:
      'The dashboard keeps the strongest visual hierarchy from the landing page while exposing historical scans, risk classes, and recent activity.',
    href: '/dashboard',
    label: 'Open Dashboard',
  },
];

function PulseDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-200" />
    </span>
  );
}

function PreviewChart({
  path,
  className,
  stroke,
}: {
  path: string;
  className?: string;
  stroke: string;
}) {
  return (
    <svg className={className} viewBox="0 0 320 170" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path d="M20 20H300" stroke="rgba(148,163,184,0.14)" />
      <path d="M20 85H300" stroke="rgba(148,163,184,0.14)" />
      <path d="M20 150H300" stroke="rgba(148,163,184,0.14)" />
      <motion.path
        d={path}
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.2 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div>
      <section className="app-section pt-8 md:pt-14">
        <div className="app-container grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-center">
          <Reveal className="space-y-8">
            <span className="app-eyebrow">
              <PulseDot />
              Another-world phishing defense
            </span>

            <div className="space-y-6">
              <h1 className="app-title max-w-4xl">
                A cinematic AI security console for links, inboxes, files, and QR traps.
              </h1>
              <p className="app-copy">
                The frontend now leans fully into a premium dark analytics language: deep contrast,
                generous structure, glowing telemetry, and motion-led feedback that still serves real
                security tasks.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/url-analyzer" className="app-primary-btn">
                Launch URL Scan
              </Link>
              <Link href="/dashboard" className="app-secondary-btn">
                Enter Monitoring Deck
              </Link>
            </div>

            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-slate-400">
              <span className="app-chip">Live risk scoring</span>
              <span className="app-chip">Explainable results</span>
              <span className="app-chip">Frictionless analyst flow</span>
            </div>
          </Reveal>

          <FloatingPanel delay={0.08} className="app-panel p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_44%)]" />
            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/[0.72]">Threat stream</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Orbital telemetry</p>
                </div>
                <span className="rounded-full border border-emerald-300/24 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-emerald-100">
                  98.4% uptime
                </span>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
                <PreviewChart
                  className="h-40 w-full"
                  stroke="#67e8f9"
                  path="M20 118C48 110 61 96 92 99C122 102 132 76 160 78C190 81 198 60 224 58C250 56 267 30 300 20"
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Blocked', value: '412' },
                    { label: 'Under review', value: '29' },
                    { label: 'Safe clears', value: '1.4k' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                      <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { title: 'Homograph sweep', copy: 'Unicode lookalikes decoded before users ever click through.' },
                  { title: 'Redirect memory', copy: 'Shorteners unwind into a visible chain with final-destination emphasis.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300/70">{item.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </FloatingPanel>
        </div>
      </section>

      <section className="pb-10">
        <div className="app-container">
          <Reveal className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
            <div className="grid gap-px bg-white/10 md:grid-cols-4">
              {summaryItems.map((item) => (
                <div key={item.title} className="bg-slate-950/[0.72] p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/18 bg-cyan-300/10 text-cyan-100">
                    <div className="h-2.5 w-2.5 rounded-full bg-cyan-200" />
                  </div>
                  <p className="text-lg font-semibold text-white">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300/70">{item.copy}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="app-section pt-6">
        <div className="app-container">
          <FloatingPanel className="app-panel overflow-hidden p-0">
            <div className="grid gap-px bg-white/10 xl:grid-cols-[220px_minmax(0,1fr)]">
              <div className="bg-slate-950/90 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/70">Command map</p>
                <div className="mt-8 space-y-3">
                  {['Overview', 'Signals', 'Inbox', 'Attachments', 'QR Routes', 'Escalations'].map((item, index) => (
                    <div
                      key={item}
                      className={`rounded-[18px] border px-4 py-3 text-sm ${
                        index === 1
                          ? 'border-cyan-200/24 bg-cyan-300/12 text-white'
                          : 'border-white/8 bg-white/[0.03] text-slate-300/75'
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/[0.72] p-6 md:p-8">
                <div className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Live observatory</p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">Dashboard preview block</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Realtime', 'Threat feed', 'High confidence'].map((chip) => (
                      <span key={chip} className="app-chip">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      {[
                        { label: 'Scans today', value: '1,248', tone: 'text-cyan-100' },
                        { label: 'Threat rate', value: '12.7%', tone: 'text-rose-100' },
                        { label: 'False-positive drift', value: '0.8%', tone: 'text-emerald-100' },
                      ].map((item) => (
                        <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                          <p className={`mt-4 text-2xl font-semibold ${item.tone}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-medium text-white">Suspicious entity velocity</p>
                        <span className="text-xs uppercase tracking-[0.24em] text-slate-400">last 24h</span>
                      </div>
                      <PreviewChart
                        className="h-48 w-full"
                        stroke="#93c5fd"
                        path="M20 132C44 132 50 116 72 116C96 116 105 96 125 95C151 94 157 70 180 70C208 70 213 48 239 48C264 48 277 35 300 26"
                      />
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-medium text-white">Priority queue</p>
                      <span className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">13 targets</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        ['xn--paypa1-7ve.com', 'Homograph + new domain', 'High Risk'],
                        ['giftcard-payments.support', 'Redirect chain', 'Medium Risk'],
                        ['internal-update-login.net', 'Urgency wording', 'High Risk'],
                        ['drive-qr-verify.co', 'QR payload', 'Medium Risk'],
                      ].map(([target, reason, severity]) => (
                        <div key={target} className="grid gap-2 rounded-[20px] border border-white/10 bg-slate-950/75 px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-mono text-xs text-slate-200">{target}</p>
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                              {severity}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300/70">{reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FloatingPanel>
        </div>
      </section>

      <section className="py-8">
        <div className="app-container">
          <Reveal className="space-y-6 text-center">
            <p className="app-kicker">Signal sources powering the interface</p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium uppercase tracking-[0.28em] text-slate-300/[0.62]">
              {telemetrySources.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="analytics-grid" className="app-section">
        <div className="app-container">
          <Reveal className="mb-10 text-center">
            <p className="app-kicker">Analytics feature showcase</p>
            <h2 className="app-subtitle mt-4">A four-panel grid tuned for observability, not ornament.</h2>
            <p className="app-copy mx-auto mt-4">
              The design extraction emphasized chart-heavy cards, subtle borders, and deliberate pacing. Each
              cell below mirrors that pattern while staying product-specific.
            </p>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-2">
            <FloatingPanel className="app-panel p-6">
              <p className="app-label">Escalation velocity</p>
              <PreviewChart
                className="h-48 w-full"
                stroke="#67e8f9"
                path="M20 138C42 132 55 120 82 121C108 122 118 110 142 93C170 72 177 78 207 74C236 70 257 52 300 28"
              />
              <p className="mt-4 text-sm leading-7 text-slate-300/70">
                Threat spikes climb with purpose and finish in a steep ascent, echoing the visual language from the extracted reference.
              </p>
            </FloatingPanel>

            <FloatingPanel delay={0.04} className="app-panel p-6">
              <p className="app-label">Investigation depth</p>
              <PreviewChart
                className="h-48 w-full"
                stroke="#93c5fd"
                path="M20 118L70 102L110 112L150 88L190 94L230 62L270 70L300 42"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {['Redirect chain', 'Sender mismatch', 'Domain age', 'Embedded object'].map((chip) => (
                  <span key={chip} className="app-chip">
                    {chip}
                  </span>
                ))}
              </div>
            </FloatingPanel>

            <FloatingPanel delay={0.08} className="app-panel p-6">
              <p className="app-label">Signal shaping</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {['Homograph sweep', 'Safe browsing', 'WHOIS age', 'Regex heuristics'].map((item, index) => (
                  <div key={item} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-white">{item}</span>
                      <span className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">0{index + 1}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/8">
                      <motion.div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-sky-400"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${72 + index * 6}%` }}
                        viewport={{ once: true, amount: 0.35 }}
                        transition={{ duration: 1, delay: index * 0.08 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300/70">
                Rounded control blocks replace plain settings forms, keeping the product closer to an AI operations suite.
              </p>
            </FloatingPanel>

            <FloatingPanel delay={0.12} className="app-panel p-6">
              <p className="app-label">Disposition matrix</p>
              <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                <div className="grid grid-cols-4 gap-3 text-xs uppercase tracking-[0.22em] text-slate-400">
                  {['Low', 'Watch', 'Review', 'Block'].map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-4 gap-3">
                  {[28, 44, 71, 92].map((height, index) => (
                    <motion.div
                      key={height}
                      className={`rounded-t-[18px] ${
                        index < 2 ? 'bg-sky-400/65' : index === 2 ? 'bg-amber-300/75' : 'bg-rose-400/75'
                      }`}
                      initial={{ height: 0, opacity: 0.35 }}
                      whileInView={{ height, opacity: 1 }}
                      viewport={{ once: true, amount: 0.45 }}
                      transition={{ duration: 0.9, delay: index * 0.08 }}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300/70">
                The lower-right card pivots from chips to compact bar output, preserving the mixed analytics grammar described in the brief.
              </p>
            </FloatingPanel>
          </div>
        </div>
      </section>

      <section id="coverage" className="app-section pt-6">
        <div className="app-container grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Reveal className="space-y-6">
            <p className="app-kicker">Benefits + supported AI platforms</p>
            <h2 className="app-subtitle">Security posture and AI-surface visibility in the same composition.</h2>
            <p className="app-copy">
              The left column stays typography-led and spacious. The right column becomes a compatibility wall,
              using thin dividers and monochrome rows like the extracted reference.
            </p>

            <div className="space-y-5">
              {[
                {
                  title: 'Explainable output by default',
                  copy: 'Risk factors, verdicts, and telemetry modules land in a readable hierarchy so security teams can act instead of reinterpret.',
                },
                {
                  title: 'Coverage across modern AI surfaces',
                  copy: 'The aesthetic now feels native to an AI tools ecosystem while remaining anchored to phishing detection workflows.',
                },
                {
                  title: 'Consistent shell across the app',
                  copy: 'Landing page, analyzers, auth screens, and dashboard now speak one visual language rather than separate mini-products.',
                },
              ].map((block) => (
                <div key={block.title} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xl font-semibold text-white">{block.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300/70">{block.copy}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <FloatingPanel className="app-panel p-0">
            <div className="divide-y divide-white/10">
              {coveragePlatforms.map((platform, index) => (
                <div key={platform} className="flex items-center justify-between px-6 py-5">
                  <div className="flex items-center gap-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs uppercase tracking-[0.22em] text-cyan-100/70">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-lg font-medium text-white">{platform}</span>
                  </div>
                  <span className="text-xs uppercase tracking-[0.22em] text-slate-400">supported</span>
                </div>
              ))}
            </div>
          </FloatingPanel>
        </div>
      </section>

      <section className="app-section pt-4">
        <div className="app-container grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="space-y-4">
            <p className="app-kicker">FAQ</p>
            <h2 className="app-subtitle">Minimal accordion, premium spacing, no visual noise.</h2>
            <p className="app-copy">
              Thin dividers, compact rows, and motion-controlled reveals keep the interaction aligned with the source design.
            </p>
          </Reveal>

          <Reveal delay={0.08} className="app-panel divide-y divide-white/10">
            {faqItems.map((item, index) => {
              const open = openFaq === index;
              return (
                <div key={item.question} className="px-6 py-5">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? -1 : index)}
                    aria-expanded={open}
                    aria-controls={`faq-answer-${index}`}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <span className="text-lg font-medium text-white">{item.question}</span>
                    <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-100">
                      {open ? '−' : '+'}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        id={`faq-answer-${index}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pt-4 text-sm leading-7 text-slate-300/72">{item.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>

      <section className="app-section pt-4">
        <div className="app-container">
          <Reveal className="mb-10 text-center">
            <p className="app-kicker">Customer stories</p>
            <h2 className="app-subtitle mt-4">Proof content without dropping into generic testimonial cards.</h2>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-2">
            {stories.map((story, index) => (
              <FloatingPanel key={story.name} delay={index * 0.06} className="app-panel p-6">
                <p className="app-kicker">{story.name}</p>
                <p className="mt-4 text-2xl font-semibold text-white">{story.headline}</p>
                <p className="mt-4 text-sm leading-7 text-slate-300/70">{story.copy}</p>
              </FloatingPanel>
            ))}
          </div>
        </div>
      </section>

      <section id="resources" className="app-section pt-2">
        <div className="app-container">
          <Reveal className="mb-10 text-center">
            <p className="app-kicker">Secondary call to action</p>
            <h2 className="app-subtitle mt-4">Two feature cards, strong contrast, small decisive actions.</h2>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-2">
            {resources.map((resource, index) => (
              <FloatingPanel key={resource.title} delay={index * 0.08} className="app-panel p-6">
                <div className="flex h-full flex-col justify-between gap-6">
                  <div>
                    <p className="app-kicker text-cyan-100/70">{resource.eyebrow}</p>
                    <p className="mt-4 text-2xl font-semibold text-white">{resource.title}</p>
                    <p className="mt-4 text-sm leading-7 text-slate-300/70">{resource.copy}</p>
                  </div>
                  <div>
                    <Link href={resource.href} className="app-secondary-btn">
                      {resource.label}
                    </Link>
                  </div>
                </div>
              </FloatingPanel>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
