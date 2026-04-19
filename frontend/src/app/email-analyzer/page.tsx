'use client';

import { useState } from 'react';
import RiskBadge from '@/components/RiskBadge';
import RiskGauge from '@/components/RiskGauge';
import ReasonList from '@/components/ReasonList';
import ToolPageShell from '@/components/ToolPageShell';
import { Notice } from '@/components/Feedback';

interface LLMVerdict {
  verdict: 'Phishing' | 'Legitimate' | 'Suspicious';
  confidence: number;
  summary: string;
  red_flags: string[];
}

interface EmailResult {
  risk_score: number;
  classification: string;
  reasons: string[];
  urls: string[];
  sender_domain: string;
  llm_verdict: LLMVerdict | null;
}

const snippets = [
  'Urgent password reset notice',
  'Vendor invoice with hidden payment link',
  'Shared drive invitation from external sender',
];

export default function EmailAnalyzerPage() {
  const [emailText, setEmailText] = useState('');
  const [senderDomain, setSenderDomain] = useState('');
  const [result, setResult] = useState<EmailResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/analyze/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_text: emailText, sender_domain: senderDomain || undefined }),
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
      eyebrow="Inbox Observatory"
      title={
        <>
          <span className="block">Read sender trust, message intent,</span>
          <span className="block">and hidden links on one screen.</span>
        </>
      }
      titleClassName="max-w-4xl md:text-[2.95rem] xl:max-w-3xl"
      description="Paste raw email content and the interface evaluates urgency language, sender-domain context, suspicious cues, extracted URLs, and the LLM narrative verdict."
      metrics={[
        { label: 'Signal bands', value: '3', hint: 'Threat score, reasons, and AI summary arrive together.' },
        { label: 'Context extraction', value: 'URLs', hint: 'Embedded links are surfaced immediately for follow-on review.' },
        { label: 'Verdict layer', value: 'LLM', hint: 'Narrative explanation complements hard indicators.' },
      ]}
      aside={
        <div className="flex h-full flex-col justify-between gap-6">
          <div>
            <p className="app-kicker">Priority traits</p>
            <p className="mt-4 text-2xl font-semibold text-white">Urgency, mismatch, pressure, and payoff language stay visible.</p>
            <p className="mt-4 text-sm leading-7 text-slate-300/[0.72]">
              The design borrows the same AI-product atmosphere as the landing page, but every flourish still supports investigation.
            </p>
          </div>
          <div className="space-y-3">
            {snippets.map((item, index) => (
              <div key={item} className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-white">{item}</span>
                  <span className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">0{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <div className="app-panel p-6 md:p-7">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="app-label">Sender domain <span className="normal-case tracking-normal text-slate-500">(optional)</span></label>
            <input
              type="text"
              value={senderDomain}
              onChange={(e) => setSenderDomain(e.target.value)}
              placeholder="e.g. secure-payments.example"
              className="app-input"
            />
          </div>

          <div>
            <label className="app-label">Email content</label>
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Paste the full email body and headers if available..."
              required
              rows={11}
              className="app-textarea font-mono"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {snippets.map((item) => (
                <span key={item} className="app-chip">
                  {item}
                </span>
              ))}
            </div>
            <button type="submit" disabled={loading} className="app-primary-btn min-w-[180px]">
              {loading ? 'Analyzing Flow...' : 'Analyze Email'}
            </button>
          </div>
        </form>
      </div>

      {error && <Notice>{error}</Notice>}

      {result && (
        <div className="app-panel divide-y divide-white/10">
          <div className="flex flex-wrap items-center justify-between gap-6 p-6 md:p-8">
            <div className="space-y-3">
              <p className="app-label mb-0">Email result</p>
              {result.sender_domain && (
                <p className="text-sm text-slate-300/[0.72]">
                  Sender domain: <span className="font-medium text-white">{result.sender_domain}</span>
                </p>
              )}
              <RiskBadge classification={result.classification} />
            </div>
            <RiskGauge score={result.risk_score} />
          </div>

          {result.reasons.length > 0 && (
            <div className="p-6 md:p-8">
              <ReasonList reasons={result.reasons} />
            </div>
          )}

          {result.llm_verdict && (
            <div className="p-6 md:p-8">
              <p className="app-label mb-4">AI Narrative Verdict</p>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${
                      result.llm_verdict.verdict === 'Phishing'
                        ? 'border-rose-300/22 bg-rose-500/10 text-rose-100'
                        : result.llm_verdict.verdict === 'Suspicious'
                          ? 'border-amber-300/22 bg-amber-400/10 text-amber-100'
                          : 'border-emerald-300/22 bg-emerald-400/10 text-emerald-100'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {result.llm_verdict.verdict}
                  </span>
                  <span className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    {result.llm_verdict.confidence}% confidence
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300/[0.72]">{result.llm_verdict.summary}</p>
                {result.llm_verdict.red_flags.length > 0 && (
                  <div className="mt-5 grid gap-3">
                    {result.llm_verdict.red_flags.map((flag) => (
                      <div key={flag} className="rounded-[18px] border border-rose-300/16 bg-rose-500/8 px-4 py-3 text-sm text-rose-100">
                        {flag}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {result.urls.length > 0 && (
            <div className="p-6 md:p-8">
              <p className="app-label mb-4">URLs Found in Email ({result.urls.length})</p>
              <div className="space-y-3">
                {result.urls.map((foundUrl) => (
                  <div key={foundUrl} className="rounded-[20px] border border-amber-300/18 bg-amber-300/10 px-4 py-3">
                    <p className="break-all font-mono text-xs text-amber-50">{foundUrl}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ToolPageShell>
  );
}
