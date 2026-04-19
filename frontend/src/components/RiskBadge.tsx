import clsx from 'clsx';

type Classification = 'High Risk' | 'Medium Risk' | 'Low Risk' | 'Invalid';

const FALLBACK: Classification = 'Invalid';

const classMap: Record<Classification, string> = {
  'High Risk': 'border-rose-400/[0.24] bg-rose-500/10 text-rose-100',
  'Medium Risk': 'border-amber-300/[0.24] bg-amber-400/10 text-amber-100',
  'Low Risk': 'border-emerald-300/[0.24] bg-emerald-400/10 text-emerald-100',
  Invalid: 'border-slate-400/[0.18] bg-white/[0.05] text-slate-300',
};

const dotMap: Record<Classification, string> = {
  'High Risk': 'bg-rose-300',
  'Medium Risk': 'bg-amber-300',
  'Low Risk': 'bg-emerald-300',
  Invalid: 'bg-slate-400',
};

function toClassification(raw: string): Classification {
  return raw in classMap ? (raw as Classification) : FALLBACK;
}

export default function RiskBadge({ classification }: { classification: string }) {
  const key = toClassification(classification);
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] backdrop-blur-md',
        classMap[key],
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', dotMap[key])} />
      {classification}
    </span>
  );
}
