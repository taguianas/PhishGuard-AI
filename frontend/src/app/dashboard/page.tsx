'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import RiskBadge from '@/components/RiskBadge';
import ToolPageShell from '@/components/ToolPageShell';
import { EmptyState, Notice } from '@/components/Feedback';

interface Stats {
  total_scans: number;
  high_risk_count: number;
  flagged_urls: number;
}

interface ScanRecord {
  id: number;
  type: 'url' | 'email';
  url?: string;
  sender_domain?: string;
  risk_score: number;
  classification: string;
  reasons: string[];
  created_at: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch('/api/analyze/history?type=stats').then((r) => r.json()),
      fetch('/api/analyze/history?limit=20').then((r) => r.json()),
    ])
      .then(([summary, rows]) => {
        setStats(summary);
        setHistory(rows);
      })
      .catch(() => {
        setStats(null);
        setHistory([]);
        setFetchError(true);
      })
      .finally(() => setLoading(false));
  }, [session, status]);

  const metrics = useMemo(
    () => [
      { label: 'Total scans', value: loading ? '...' : String(stats?.total_scans ?? 0), hint: 'All recorded URL and email investigations.' },
      { label: 'High risk', value: loading ? '...' : String(stats?.high_risk_count ?? 0), hint: 'Threat score at or above 70.' },
      { label: 'Flagged URLs', value: loading ? '...' : String(stats?.flagged_urls ?? 0), hint: 'Medium and high-risk link detections.' },
    ],
    [loading, stats]
  );

  const sidebarRows: ScanRecord[] =
    history.slice(0, 4).length > 0
      ? history.slice(0, 4)
      : [
          {
            id: 0,
            type: 'url',
            url: 'awaiting-history.local',
            risk_score: 0,
            classification: 'Low Risk',
            reasons: [],
            created_at: new Date().toISOString(),
          },
        ];

  if (!session && status !== 'loading') {
    return (
      <ToolPageShell
        eyebrow="Monitoring Deck"
        title="A quick intelligence brief for what PhishGuard does before you enter the full watch floor."
        description="The dashboard should introduce the system first: what gets analyzed, how verdicts are formed, and what the signed-in experience unlocks. Authentication remains a separate step, not the page itself."
        metrics={[
          { label: 'Analysis surfaces', value: '4', hint: 'URLs, emails, attachments, and QR payloads are all covered.' },
          { label: 'Scoring layers', value: 'Multi', hint: 'Heuristics, reputation, ML, and narrative reasoning combine.' },
          { label: 'Signed-in value', value: 'History', hint: 'Accounts unlock persistent scans, stats, and recent activity.' },
        ]}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'URL Analyzer',
              copy: 'Scores suspicious links using redirect tracing, domain age, homograph detection, Safe Browsing, and ML probability.',
            },
            {
              title: 'Email Analyzer',
              copy: 'Reads sender context, urgency language, extracted URLs, and the LLM verdict in one response surface.',
            },
            {
              title: 'Attachment Analyzer',
              copy: 'Inspects documents for macros, active content, embedded files, and hidden links before they are opened.',
            },
            {
              title: 'QR Analyzer',
              copy: 'Decodes QR payloads, labels the content type, and forwards embedded URLs into the phishing engine.',
            },
          ].map((card) => (
            <div key={card.title} className="app-panel p-5">
              <p className="app-label mb-3">{card.title}</p>
              <p className="text-xl font-semibold text-white">{card.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-300/70">{card.copy}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="app-panel p-6 md:p-8">
            <p className="app-label mb-4">How the tool works</p>
            <div className="space-y-4">
              {[
                ['1', 'Collect the signal', 'Paste a URL, email, file, or QR image into the relevant analyzer.'],
                ['2', 'Fan out across layers', 'The backend blends heuristics, threat intel, domain context, and ML evidence.'],
                ['3', 'Explain the verdict', 'Results return with scores, reasons, extracted artifacts, and narrative support where relevant.'],
                ['4', 'Track over time', 'When signed in, those scans feed your dashboard history and aggregate stats.'],
              ].map(([step, title, copy]) => (
                <div key={step} className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/24 bg-cyan-300/12 text-sm font-semibold text-cyan-100">
                      {step}
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-white">{title}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-300/70">{copy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="app-panel p-6 md:p-8">
            <p className="app-label mb-4">What sign-in unlocks</p>
            <div className="space-y-3">
              {[
                'Recent scan history tied to your account',
                'Aggregate counts for total scans and high-risk detections',
                'A persistent watch floor instead of one-off checks',
                'A cleaner workflow for repeated investigation sessions',
              ].map((item) => (
                <div key={item} className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-slate-950/[0.55] p-5">
              <p className="text-lg font-semibold text-white">Ready to use the full dashboard?</p>
              <p className="mt-3 text-sm leading-7 text-slate-300/70">
                Authentication is still separate, but the dashboard page now acts like a real overview instead of a login gate.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className="app-primary-btn">
                  Sign In
                </Link>
                <Link href="/register" className="app-secondary-btn">
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ToolPageShell>
    );
  }

  return (
    <ToolPageShell
      eyebrow="Monitoring Deck"
      title="A persistent watch floor for every scan the user has executed."
      description="The dashboard inherits the landing page atmosphere but shifts into a denser, operator-friendly mode: concise stats, a strong table layout, and immediate risk labels."
      metrics={metrics}
      aside={
        <div className="flex h-full flex-col justify-between gap-6">
          <div>
            <p className="app-kicker">Session state</p>
            <p className="mt-4 text-2xl font-semibold text-white">
              {loading ? 'Syncing user memory...' : `Tracking ${history.length} recent decisions`}
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-300/[0.72]">
              This panel stays useful even before the table loads, which keeps the page feeling alive under network latency.
            </p>
          </div>
          <div className="space-y-3">
            {sidebarRows.map((row) => (
              <div key={`${row.type}-${row.id}`} className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.22em] text-slate-400">{row.type}</span>
                  <span className="text-sm font-semibold text-white">{row.risk_score}</span>
                </div>
                <p className="mt-2 truncate font-mono text-xs text-slate-200">{row.url || row.sender_domain || 'waiting...'}</p>
              </div>
            ))}
          </div>
        </div>
      }
    >
      {fetchError && <Notice tone="danger">Failed to load dashboard data. Please refresh the page.</Notice>}

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((card) => (
          <div key={card.label} className="app-panel p-5">
            <p className="app-label mb-3">{card.label}</p>
            <p className="text-4xl font-semibold text-white">{card.value}</p>
            <p className="mt-3 text-sm leading-7 text-slate-300/70">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="app-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
          <div>
            <p className="app-label mb-1">Recent scans</p>
            <p className="text-lg font-semibold text-white">Last 20 analysis events</p>
          </div>
          <span className="app-chip">{loading ? 'syncing' : `${history.length} loaded`}</span>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-slate-300/[0.68]">Synchronizing dashboard memory...</div>
        ) : history.length === 0 ? (
          <div className="px-6 py-16">
            <EmptyState
              title="No scans recorded yet"
              copy="Run a URL or email analysis and the results will start populating this watch floor."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-left text-[11px] uppercase tracking-[0.24em] text-slate-400">
                <tr>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Risk</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {history.map((row) => (
                  <tr key={`${row.type}-${row.id}`} className="transition hover:bg-white/[0.03]">
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-200">
                        {row.type}
                      </span>
                    </td>
                    <td className="max-w-xs px-6 py-4 font-mono text-xs text-slate-200">
                      <div className="truncate">{row.url || row.sender_domain || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge classification={row.classification} />
                    </td>
                    <td className="px-6 py-4 text-base font-semibold text-white">{row.risk_score}</td>
                    <td className="px-6 py-4 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
