import { ReactNode } from 'react';
import { Reveal } from '@/components/Reveal';
import clsx from 'clsx';

export interface HeroMetric {
  label: string;
  value: string;
  hint: string;
}

interface ToolPageShellProps {
  eyebrow: string;
  title: ReactNode;
  description: string;
  metrics?: HeroMetric[];
  children: ReactNode;
  aside?: ReactNode;
  titleClassName?: string;
}

export default function ToolPageShell({
  eyebrow,
  title,
  description,
  metrics = [],
  children,
  aside,
  titleClassName,
}: ToolPageShellProps) {
  return (
    <section className="app-container py-10 md:py-14">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Reveal className="app-panel p-8 md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.14),transparent_42%)]" />
          <div className="relative z-10 space-y-6">
            <span className="app-eyebrow">{eyebrow}</span>
            <div className="space-y-4">
              <h1 className={clsx('app-subtitle md:text-[3.25rem]', titleClassName)}>{title}</h1>
              <p className="app-copy max-w-2xl">{description}</p>
            </div>
            {metrics.length > 0 && (
              <div className="grid gap-3 md:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{metric.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{metric.value}</p>
                    <p className="mt-2 text-sm text-slate-300/[0.68]">{metric.hint}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.08} className="app-panel p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_56%)]" />
          <div className="relative z-10 h-full">
            {aside ?? (
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <p className="app-kicker">Live Detection Stack</p>
                  <p className="mt-4 text-2xl font-semibold text-white">Each scan fans out across multiple trust layers.</p>
                  <p className="mt-4 text-sm leading-7 text-slate-300/70">
                    The interface stays cinematic, but the output stays practical: scores, reasons, and corroborating evidence.
                  </p>
                </div>
                <div className="space-y-3">
                  {['Heuristics', 'Threat intel', 'Behavioral context', 'ML probability'].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <span className="text-sm text-slate-200">{item}</span>
                      <span className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">0{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      <div className="mt-8 space-y-6">{children}</div>
    </section>
  );
}
