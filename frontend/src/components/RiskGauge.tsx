'use client';

import { motion } from 'framer-motion';

export default function RiskGauge({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 70 ? '#fb7185' : score >= 40 ? '#fbbf24' : '#34d399';
  const label = score >= 70 ? 'High Orbit' : score >= 40 ? 'Watch Orbit' : 'Clear Orbit';
  const bgRing = 'rgba(148, 163, 184, 0.14)';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.2),transparent_55%)]" />
        <svg width="96" height="96" className="-rotate-90 absolute inset-0">
          <circle cx="48" cy="48" r={radius} fill="none" stroke={bgRing} strokeWidth="10" />
          <motion.circle
            cx="48" cy="48" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full border border-white/[0.08] bg-slate-950/[0.55]">
          <span className="text-2xl font-semibold text-white">{score}</span>
          <span className="text-[10px] uppercase tracking-[0.26em] text-slate-400">Signal</span>
        </div>
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color }}>
        {label}
      </span>
    </motion.div>
  );
}
