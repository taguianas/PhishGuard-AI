'use client';

import { useCallback, useRef, useState } from 'react';
import RiskBadge from '@/components/RiskBadge';
import RiskGauge from '@/components/RiskGauge';
import ReasonList from '@/components/ReasonList';
import ToolPageShell from '@/components/ToolPageShell';
import { Notice } from '@/components/Feedback';

interface AttachmentResult {
  filename: string;
  file_type: string;
  risk_score: number;
  classification: string;
  reasons: string[];
  extracted_urls: string[];
  has_macros: boolean;
  has_javascript: boolean;
  has_auto_action: boolean;
  has_embedded_files: boolean;
  has_embedded_objects: boolean;
  raw_text_preview: string;
  note: string | null;
}

const ACCEPTED_EXTS = '.pdf,.docx,.xlsx,.pptx,.doc,.xls,.docm,.xlsm,.pptm';
const MAX_MB = 10;

function FileIcon({ type }: { type: string }) {
  const color =
    type.toLowerCase() === 'pdf'
      ? 'text-rose-200'
      : ['docx', 'doc', 'docm'].includes(type.toLowerCase())
        ? 'text-sky-100'
        : ['xlsx', 'xls', 'xlsm'].includes(type.toLowerCase())
          ? 'text-emerald-100'
          : 'text-fuchsia-100';

  return (
    <svg className={`h-8 w-8 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function IndicatorPill({ active, label, danger = true }: { active: boolean; label: string; danger?: boolean }) {
  if (!active) return null;
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
        danger ? 'border-rose-300/22 bg-rose-500/10 text-rose-100' : 'border-amber-300/22 bg-amber-400/10 text-amber-100'
      }`}
    >
      {label}
    </span>
  );
}

export default function AttachmentAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<AttachmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function acceptFile(nextFile: File) {
    if (nextFile.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_MB} MB.`);
      return;
    }
    setFile(nextFile);
    setResult(null);
    setError('');
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
      form.append('attachment', file);
      const res = await fetch('/api/analyze/attachment', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `Analysis failed (${res.status})`);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolPageShell
      eyebrow="Attachment Observatory"
      title="Inspect documents like containers for code, macros, embedded objects, and hidden routes."
      description="Upload PDFs or Office documents and the interface highlights the risky capabilities analysts care about: VBA, JavaScript, auto actions, embedded files, extracted URLs, and raw text residue."
      metrics={[
        { label: 'Supported docs', value: '10+', hint: 'PDF, Office formats, and macro-enabled variants.' },
        { label: 'Threat flags', value: '5', hint: 'Macros, JavaScript, auto actions, embedded files, OLE objects.' },
        { label: 'Route extraction', value: 'URLs', hint: 'Suspicious links inside files remain visible after parsing.' },
      ]}
      aside={
        <div className="flex h-full flex-col justify-between gap-6">
          <div>
            <p className="app-kicker">Inspection intent</p>
            <p className="mt-4 text-2xl font-semibold text-white">The page reads like a containment bay for risky files.</p>
            <p className="mt-4 text-sm leading-7 text-slate-300/[0.72]">
              Instead of a plain uploader, the interface frames attachments as potentially executable objects crossing a trust boundary.
            </p>
          </div>
          <div className="space-y-3">
            {['Parse container', 'Extract links', 'Check active content', 'Return evidence'].map((step, index) => (
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
            className={`cursor-pointer rounded-[28px] border-2 border-dashed p-8 transition ${
              dragging ? 'border-cyan-300/45 bg-cyan-400/10' : 'border-white/10 bg-white/[0.03] hover:border-cyan-300/24 hover:bg-white/[0.05]'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXTS}
              className="hidden"
              onChange={(e) => {
                const nextFile = e.target.files?.[0];
                if (nextFile) acceptFile(nextFile);
              }}
            />

            {file ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-[22px] border border-white/10 bg-slate-950/60">
                  <FileIcon type={file.name.split('.').pop() ?? ''} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold text-white">{file.name}</p>
                  <p className="mt-1 text-sm text-slate-300/[0.68]">{(file.size / 1024).toFixed(1)} KB</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setResult(null);
                    }}
                    className="mt-3 app-secondary-btn px-4 py-2 text-xs uppercase tracking-[0.22em]"
                  >
                    Remove file
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-2xl font-semibold text-white">Drop a suspicious document here or click to browse.</p>
                <p className="mt-3 text-sm leading-7 text-slate-300/70">
                  PDF, DOCX, XLSX, PPTX, DOC, XLS, and macro-enabled variants. Max {MAX_MB} MB.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <button type="submit" disabled={!file || loading} className="app-primary-btn min-w-[220px]">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                  </span>
                  Inspecting Container
                </span>
              ) : (
                'Analyze Attachment'
              )}
            </button>
            {loading && (
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">This may take a few seconds...</p>
            )}
          </div>
        </form>
      </div>

      {error && <Notice>{error}</Notice>}

      {result && (
        <div className="app-panel divide-y divide-white/10">
          <div className="flex flex-wrap items-center justify-between gap-6 p-6 md:p-8">
            <div className="space-y-3">
              <p className="app-label mb-0">Attachment result</p>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <FileIcon type={result.file_type} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{result.filename}</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{result.file_type}</p>
                </div>
              </div>
              <RiskBadge classification={result.classification} />
            </div>
            <RiskGauge score={result.risk_score} />
          </div>

          <div className="p-6 md:p-8">
            <p className="app-label mb-4">Threat indicators</p>
            <div className="flex flex-wrap gap-2">
              <IndicatorPill active={result.has_macros} label="VBA Macros" />
              <IndicatorPill active={result.has_javascript} label="Embedded JavaScript" />
              <IndicatorPill active={result.has_auto_action} label="Auto Execute" />
              <IndicatorPill active={result.has_embedded_files} label="Embedded Files" />
              <IndicatorPill active={result.has_embedded_objects} label="OLE Objects" danger={false} />
              {!result.has_macros &&
                !result.has_javascript &&
                !result.has_auto_action &&
                !result.has_embedded_files &&
                !result.has_embedded_objects && (
                  <span className="rounded-full border border-emerald-300/22 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-100">
                    No high-risk indicators detected
                  </span>
                )}
            </div>
          </div>

          {result.reasons.length > 0 && (
            <div className="p-6 md:p-8">
              <ReasonList reasons={result.reasons} />
            </div>
          )}

          {result.extracted_urls.length > 0 && (
            <div className="p-6 md:p-8">
              <p className="app-label mb-4">URLs Found in Attachment ({result.extracted_urls.length})</p>
              <div className="space-y-3">
                {result.extracted_urls.map((foundUrl) => (
                  <div key={foundUrl} className="rounded-[20px] border border-amber-300/18 bg-amber-300/10 px-4 py-3">
                    <p className="break-all font-mono text-xs text-amber-50">{foundUrl}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.raw_text_preview && (
            <div className="p-6 md:p-8">
              <p className="app-label mb-4">Extracted text preview</p>
              <pre className="max-h-60 overflow-auto rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-xs leading-7 text-slate-200 whitespace-pre-wrap break-words">
                {result.raw_text_preview}
              </pre>
            </div>
          )}

          {result.note && (
            <div className="p-6 md:p-8">
              <Notice tone="warning">{result.note}</Notice>
            </div>
          )}
        </div>
      )}
    </ToolPageShell>
  );
}
