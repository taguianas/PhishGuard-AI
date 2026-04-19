'use client';

import { useState } from 'react';
import RiskBadge from '@/components/RiskBadge';
import RiskGauge from '@/components/RiskGauge';
import ReasonList from '@/components/ReasonList';
import ToolPageShell from '@/components/ToolPageShell';
import { Notice } from '@/components/Feedback';

interface UnshortenedInfo {
  was_shortened: boolean;
  original_url: string;
  final_url: string;
  redirect_count: number;
  chain: string[];
}

interface HomographInfo {
  detected: boolean;
  unicode_domain: string;
  punycode_domain: string;
  ascii_lookalike: string;
  impersonates: string | null;
  scripts: string[];
}

interface AnalysisResult {
  url: string;
  risk_score: number;
  classification: string;
  reasons: string[];
  threat_intel: { malicious: number; suspicious: number } | null;
  domain_age: { created_at: string | null; age_days: number | null; is_young: boolean } | null;
  safe_browsing: { safe: boolean; threats: string[] } | null;
  ml_prediction: { prediction: string; probability: number } | null;
  homograph: HomographInfo | null;
  unshortened: UnshortenedInfo | null;
}

const presets = [
  'https://paypa1-verification-support.com/login',
  'https://bit.ly/reset-your-account-now',
  'https://xn--pple-43d.com/security',
];

function IntelCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
      <p className="app-label mb-3">{label}</p>
      {children}
    </div>
  );
}

export default function URLAnalyzerPage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/analyze/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const text = await res.text();
        let data: { errors?: { msg: string }[]; error?: string } = {};
        try {
          data = JSON.parse(text);
        } catch {
          // Non-JSON error body.
        }
        throw new Error(data.errors?.[0]?.msg || data.error || `Analysis failed (${res.status})`);
      }
      setResult(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolPageShell
      eyebrow="Link Observatory"
      title="Inspect suspicious URLs before they reach a human decision point."
      description="Paste any link and the console fans out across structural heuristics, redirect ancestry, homograph detection, threat reputation, and ML confidence."
      metrics={[
        { label: 'Heuristic passes', value: '18+', hint: 'Typosquatting, suspicious TLDs, encoding, IP literals.' },
        { label: 'External signals', value: '4', hint: 'Threat intel, safe browsing, WHOIS age, classifier output.' },
        { label: 'Analyst outcome', value: '1 view', hint: 'Evidence stays in one result surface, not scattered tabs.' },
      ]}
      aside={
        <div className="flex h-full flex-col justify-between gap-6">
          <div>
            <p className="app-kicker">Rapid launch URLs</p>
            <p className="mt-4 text-2xl font-semibold text-white">Drop in known bad patterns to preview the experience.</p>
            <p className="mt-4 text-sm leading-7 text-slate-300/[0.72]">
              The right rail stays interactive so the page feels like a control deck, not a static hero card.
            </p>
          </div>
          <div className="space-y-3">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setUrl(preset)}
                className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-xs text-slate-200 transition hover:border-cyan-300/24 hover:bg-white/[0.08]"
              >
                <span className="block truncate font-mono">{preset}</span>
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="app-panel p-6 md:p-7">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <label className="app-label">Target URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://suspicious-site.com/login"
                required
                className="app-input font-mono"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={loading} className="app-primary-btn min-w-[170px]">
                {loading ? 'Scanning Orbit...' : 'Scan URL'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-[0.22em] text-slate-500">Demo:</span>
            {presets.map((preset) => {
              let label = preset;
              try { label = new URL(preset).hostname; } catch { /* use raw */ }
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setUrl(preset)}
                  className="app-chip transition hover:border-cyan-300/24 hover:text-white"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </form>
      </div>

      {error && <Notice>{error}</Notice>}

      {result && (
        <div className="app-panel divide-y divide-white/10">
          <div className="flex flex-wrap items-center justify-between gap-6 p-6 md:p-8">
            <div className="min-w-0 space-y-3">
              <p className="app-label mb-0">Scanned URL</p>
              <p className="max-w-3xl break-all font-mono text-sm text-slate-200">{result.url}</p>
              <RiskBadge classification={result.classification} />
            </div>
            <RiskGauge score={result.risk_score} />
          </div>

          {result.unshortened && (
            <div className="bg-sky-500/10 px-6 py-5 md:px-8">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-300/20 bg-sky-400/14 text-sky-100">
                  ↗
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Redirect ancestry resolved ({result.unshortened.redirect_count} hop
                    {result.unshortened.redirect_count !== 1 ? 's' : ''})
                  </p>
                  <p className="text-sm text-slate-300/[0.72]">Shortened URLs are expanded before the final target is scored.</p>
                </div>
              </div>

              <div className="space-y-2">
                {result.unshortened.chain.map((hop, index) => {
                  const isFinal = index === result.unshortened!.chain.length - 1;
                  return (
                    <div key={`${hop}-${index}`} className="flex items-start gap-3 rounded-[20px] border border-white/10 bg-slate-950/45 px-4 py-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[10px] uppercase tracking-[0.18em] text-cyan-100/[0.72]">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-all font-mono text-xs text-slate-200">{hop}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                          {isFinal ? 'destination analyzed' : index === 0 ? 'submitted origin' : 'redirect hop'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result.reasons.length > 0 && (
            <div className="p-6 md:p-8">
              <ReasonList reasons={result.reasons} />
            </div>
          )}

          {result.homograph?.detected && (
            <div className="bg-rose-500/10 p-6 md:p-8">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-300/18 bg-rose-400/14 text-rose-100">
                  !
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">IDN homograph attack detected</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300/[0.72]">
                    Unicode characters are being used to impersonate a trusted ASCII domain.
                    {result.homograph.impersonates && ` Detected target: ${result.homograph.impersonates}.`}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  ['What the user sees', result.homograph.unicode_domain],
                  ['Real DNS name', result.homograph.punycode_domain],
                  ['ASCII lookalike', result.homograph.ascii_lookalike],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[22px] border border-white/10 bg-slate-950/55 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
                    <p className="mt-2 break-all font-mono text-sm text-slate-100">{value}</p>
                  </div>
                ))}
                {result.homograph.scripts.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {result.homograph.scripts.map((script) => (
                      <span key={script} className="rounded-full border border-amber-300/22 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-100">
                        {script}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 p-6 md:grid-cols-2 md:p-8">
            {result.threat_intel && (
              <IntelCard label="VirusTotal">
                <div className="flex gap-6">
                  <div>
                    <p className="text-3xl font-semibold text-rose-200">{result.threat_intel.malicious}</p>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">malicious</p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold text-amber-100">{result.threat_intel.suspicious}</p>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">suspicious</p>
                  </div>
                </div>
              </IntelCard>
            )}

            {result.domain_age && (
              <IntelCard label="Domain Age">
                {result.domain_age.age_days !== null ? (
                  <>
                    <p className={`text-3xl font-semibold ${result.domain_age.is_young ? 'text-rose-200' : 'text-emerald-100'}`}>
                      {result.domain_age.age_days < 365
                        ? `${result.domain_age.age_days} days`
                        : `${Math.floor(result.domain_age.age_days / 365)} years`}
                    </p>
                    <p className="mt-2 text-sm text-slate-300/70">Registered {result.domain_age.created_at}</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-300/70">WHOIS data unavailable.</p>
                )}
              </IntelCard>
            )}

            {result.safe_browsing && (
              <IntelCard label="Google Safe Browsing">
                {result.safe_browsing.safe ? (
                  <>
                    <p className="text-3xl font-semibold text-emerald-100">Clean</p>
                    <p className="mt-2 text-sm text-slate-300/70">No active browser threat flags.</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-semibold text-rose-200">Flagged</p>
                    <p className="mt-2 text-sm text-slate-300/70">{result.safe_browsing.threats.join(', ')}</p>
                  </>
                )}
              </IntelCard>
            )}

            {result.ml_prediction && (
              <IntelCard label="ML Classifier">
                <p className="text-3xl font-semibold text-white">{result.ml_prediction.prediction}</p>
                <p className="mt-2 text-sm text-slate-300/70">
                  {(result.ml_prediction.probability * 100).toFixed(1)}% model confidence
                </p>
              </IntelCard>
            )}
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
