export default function RiskGauge({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color  = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981';
  const label  = score >= 70 ? 'High'    : score >= 40 ? 'Medium'  : 'Low';
  const bgRing = score >= 70 ? '#fee2e2' : score >= 40 ? '#fef3c7' : '#d1fae5';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" className="-rotate-90 absolute inset-0">
          <circle cx="48" cy="48" r={radius} fill="none" stroke={bgRing} strokeWidth="10" />
          <circle
            cx="48" cy="48" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{score}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-slate-500">Risk Score</span>
      <span className="text-xs font-semibold" style={{ color }}>{label} Risk</span>
    </div>
  );
}
