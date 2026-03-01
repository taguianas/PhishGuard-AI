import clsx from 'clsx';

const classMap: Record<string, string> = {
  'High Risk':   'bg-red-50 text-red-700 border-red-200 ring-red-100',
  'Medium Risk': 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-100',
  'Low Risk':    'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
  'Invalid':     'bg-slate-100 text-slate-500 border-slate-200 ring-slate-100',
};

const dotMap: Record<string, string> = {
  'High Risk':   'bg-red-500',
  'Medium Risk': 'bg-amber-500',
  'Low Risk':    'bg-emerald-500',
  'Invalid':     'bg-slate-400',
};

export default function RiskBadge({ classification }: { classification: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold',
        classMap[classification] ?? classMap['Invalid']
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', dotMap[classification] ?? dotMap['Invalid'])} />
      {classification}
    </span>
  );
}
