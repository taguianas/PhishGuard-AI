'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import RiskBadge from '@/components/RiskBadge';
import RiskGauge from '@/components/RiskGauge';
import ReasonList from '@/components/ReasonList';
import ToolPageShell from '@/components/ToolPageShell';
import { EmptyState, Notice } from '@/components/Feedback';

interface URLAnalysis {
  url: string;
  risk_score: number;
  classification: string;
  reasons: string[];
  threat_intel: { blacklisted: boolean; malicious: number } | null;
  domain_age: { age_days: number; is_young: boolean } | null;
  safe_browsing: { safe: boolean; threats: string[] } | null;
  ml_prediction: { prediction: string; confidence: number } | null;
  error?: string;
}

interface QRCode {
  raw: string;
  content_type: 'url' | 'wifi' | 'email' | 'phone' | 'vcard' | 'sms' | 'geo' | 'text';
  url_analysis: URLAnalysis | null;
}

interface QRResult {
  found: boolean;
  filename: string;
  codes: QRCode[];
  message?: string;
}

const ACCEPTED = '.png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff,.tif';
const MAX_MB = 10;

const CONTENT_TYPE_LABELS: Record<QRCode['content_type'], string> = {
  url: 'URL',
  wifi: 'Wi-Fi Config',
  email: 'Email Address',
  phone: 'Phone Number',
  vcard: 'Contact Card',
  sms: 'SMS',
  geo: 'GPS Location',
  text: 'Plain Text',
};

const CONTENT_TYPE_COLORS: Record<QRCode['content_type'], string> = {
  url: 'border-cyan-300/24 bg-cyan-400/10 text-cyan-100',
  wifi: 'border-sky-300/24 bg-sky-400/10 text-sky-100',
  email: 'border-fuchsia-300/24 bg-fuchsia-400/10 text-fuchsia-100',
  phone: 'border-teal-300/24 bg-teal-400/10 text-teal-100',
  vcard: 'border-indigo-300/24 bg-indigo-400/10 text-indigo-100',
  sms: 'border-pink-300/24 bg-pink-400/10 text-pink-100',
  geo: 'border-emerald-300/24 bg-emerald-400/10 text-emerald-100',
  text: 'border-white/10 bg-white/[0.04] text-slate-200',
};

function ThreatIntelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-2 text-xs last:border-b-0">
      <span className="uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  );
}

function URLCard({ code, index }: { code: QRCode; index: number }) {
  const analysis = code.url_analysis;

  return (
    <div className="app-panel divide-y divide-white/10">
      <div className="flex flex-wrap items-start justify-between gap-5 p-5 md:p-6">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="app-chip">QR {index + 1}</span>
            <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${CONTENT_TYPE_COLORS[code.content_type]}`}>
              {CONTENT_TYPE_LABELS[code.content_type]}
            </span>
          </div>
          <p className="break-all font-mono text-xs text-slate-200">{code.raw}</p>
          {analysis && <RiskBadge classification={analysis.classification} />}
        </div>
        {analysis && <RiskGauge score={analysis.risk_score} />}
      </div>

      {analysis?.error && <div className="px-5 py-4 text-sm text-rose-100">{analysis.error}</div>}

      {analysis && analysis.reasons.length > 0 && (
        <div className="p-5 md:p-6">
          <ReasonList reasons={analysis.reasons} />
        </div>
      )}

      {analysis && (analysis.threat_intel || analysis.domain_age || analysis.safe_browsing || analysis.ml_prediction) && (
        <div className="p-5 md:p-6">
          <p className="app-label mb-4">Threat Intelligence</p>
          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-2">
            {analysis.threat_intel && (
              <ThreatIntelRow
                label="VirusTotal"
                value={analysis.threat_intel.blacklisted ? `Blacklisted (${analysis.threat_intel.malicious})` : 'Clean'}
              />
            )}
            {analysis.domain_age && (
              <ThreatIntelRow
                label="Domain Age"
                value={analysis.domain_age.is_young ? `Young (${analysis.domain_age.age_days}d)` : `${analysis.domain_age.age_days}d old`}
              />
            )}
            {analysis.safe_browsing && (
              <ThreatIntelRow
                label="Safe Browsing"
                value={analysis.safe_browsing.safe ? 'Safe' : `Flagged: ${analysis.safe_browsing.threats.join(', ')}`}
              />
            )}
            {analysis.ml_prediction && (
              <ThreatIntelRow
                label="ML Model"
                value={`${analysis.ml_prediction.prediction} (${analysis.ml_prediction.confidence}%)`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NonURLCard({ code, index }: { code: QRCode; index: number }) {
  return (
    <div className="app-panel p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="app-chip">QR {index + 1}</span>
        <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${CONTENT_TYPE_COLORS[code.content_type]}`}>
          {CONTENT_TYPE_LABELS[code.content_type]}
        </span>
      </div>
      <p className="mt-4 break-all rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-xs text-slate-200">
        {code.raw}
      </p>
      <p className="mt-4 text-sm text-slate-300/[0.68]">No URL detected, so no phishing score was generated for this payload.</p>
    </div>
  );
}

export default function QRAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<QRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function acceptFile(nextFile: File) {
    if (nextFile.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Maximum is ${MAX_MB} MB.`);
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(nextFile);
    previewUrlRef.current = url;
    setFile(nextFile);
    setResult(null);
    setError('');
    setPreview(url);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const nextFile = e.dataTransfer.files[0];
    if (nextFile) acceptFile(nextFile);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/analyze/qr', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Analysis failed (${res.status})`);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const urlCodes = result?.codes.filter((code) => code.content_type === 'url') ?? [];
  const otherCodes = result?.codes.filter((code) => code.content_type !== 'url') ?? [];
  const highestRisk = urlCodes.reduce((max, code) => Math.max(max, code.url_analysis?.risk_score ?? 0), 0);
  const summaryTone = highestRisk >= 70 ? 'danger' : highestRisk >= 40 ? 'warning' : 'success';

  return (
    <ToolPageShell
      eyebrow="QR Route Decoder"
      title="Drag an image in and inspect every hidden route behind the visible square."
      description="The QR analyzer extracts payloads, classifies their content type, and forwards any embedded URLs into the same phishing engine used by the link analyzer."
      metrics={[
        { label: 'Image inputs', value: '8', hint: 'PNG, JPG, GIF, BMP, WebP, TIFF, and more.' },
        { label: 'Payload types', value: '8', hint: 'URL, Wi-Fi, SMS, vCard, geo, phone, email, plain text.' },
        { label: 'Risk flow', value: 'Shared', hint: 'URL payloads inherit the full phishing detection pipeline.' },
      ]}
      aside={
        <div className="flex h-full flex-col justify-between gap-6">
          <div>
            <p className="app-kicker">Payload disciplines</p>
            <p className="mt-4 text-2xl font-semibold text-white">The page treats QR codes like delivery mechanisms, not harmless images.</p>
            <p className="mt-4 text-sm leading-7 text-slate-300/[0.72]">
              Results separate risky URLs from harmless metadata so operators instantly know what deserves escalation.
            </p>
          </div>
          <div className="space-y-3">
            {['Decode image', 'Label payload', 'Score URLs', 'Return evidence'].map((step, index) => (
              <div key={step} className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-white">{step}</span>
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
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative cursor-pointer rounded-[28px] border-2 border-dashed p-8 transition ${
              dragging ? 'border-cyan-300/45 bg-cyan-400/10' : 'border-white/10 bg-white/[0.03] hover:border-cyan-300/24 hover:bg-white/[0.05]'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => {
                const nextFile = e.target.files?.[0];
                if (nextFile) acceptFile(nextFile);
              }}
            />

            {preview ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* blob: URLs are not supported by next/image — plain img is correct here */}
                <img src={preview} alt={file?.name ? `Preview of ${file.name}` : 'Uploaded image preview'} className="h-24 w-24 rounded-[22px] border border-white/10 bg-slate-950/60 object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold text-white">{file?.name}</p>
                  <p className="mt-1 text-sm text-slate-300/[0.68]">{file ? (file.size / 1024).toFixed(1) : 0} KB</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (previewUrlRef.current) {
                        URL.revokeObjectURL(previewUrlRef.current);
                        previewUrlRef.current = null;
                      }
                      setFile(null);
                      setPreview(null);
                      setResult(null);
                    }}
                    className="mt-3 app-secondary-btn px-4 py-2 text-xs uppercase tracking-[0.22em]"
                  >
                    Remove image
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-2xl font-semibold text-white">Drop a QR image here or click to browse.</p>
                <p className="mt-3 text-sm leading-7 text-slate-300/70">
                  PNG, JPG, GIF, BMP, WebP, TIFF. Max {MAX_MB} MB.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={!file || loading} className="app-primary-btn min-w-[210px]">
              {loading ? 'Decoding + Scoring...' : 'Scan and Analyze'}
            </button>
          </div>
        </form>
      </div>

      {error && <Notice>{error}</Notice>}

      {result && !result.found && (
        <EmptyState
          title="No QR code detected"
          copy="Make sure the image is sharp enough and the QR code occupies enough of the frame to decode cleanly."
          icon={<span className="text-2xl text-cyan-100">⌘</span>}
        />
      )}

      {result?.found && (
        <div className="space-y-4">
          <Notice tone={summaryTone}>
            {result.codes.length} QR code{result.codes.length !== 1 ? 's' : ''} detected
            {urlCodes.length > 0 && ` // ${urlCodes.length} URL payload${urlCodes.length !== 1 ? 's' : ''} analyzed`}
            {highestRisk >= 70 && ' // high-risk route found'}
            {highestRisk >= 40 && highestRisk < 70 && ' // suspicious route found'}
            {highestRisk < 40 && urlCodes.length > 0 && ' // URLs appear low risk'}
          </Notice>

          {urlCodes.map((code, index) => (
            <URLCard key={`url-${index}`} code={code} index={index} />
          ))}

          {otherCodes.map((code, index) => (
            <NonURLCard key={`other-${index}`} code={code} index={urlCodes.length + index} />
          ))}
        </div>
      )}
    </ToolPageShell>
  );
}
