import { ReactNode } from 'react';
import clsx from 'clsx';

type Tone = 'danger' | 'warning' | 'success' | 'info';

const noticeTone: Record<Tone, string> = {
  danger: 'border-rose-400/22 bg-rose-500/10 text-rose-100',
  warning: 'border-amber-300/22 bg-amber-400/10 text-amber-100',
  success: 'border-emerald-300/22 bg-emerald-400/10 text-emerald-100',
  info: 'border-cyan-300/22 bg-cyan-400/10 text-cyan-100',
};

interface NoticeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Notice({ tone = 'danger', children, className }: NoticeProps) {
  return (
    <div className={clsx('rounded-[22px] border px-4 py-3 text-sm backdrop-blur-md', noticeTone[tone], className)}>
      {children}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  copy: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, copy, icon, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('app-panel px-6 py-12 text-center', className)}>
      <div className="mx-auto max-w-md space-y-4">
        {icon && <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">{icon}</div>}
        <div className="space-y-2">
          <p className="text-xl font-semibold text-white">{title}</p>
          <p className="text-sm leading-7 text-slate-300/[0.68]">{copy}</p>
        </div>
        {action}
      </div>
    </div>
  );
}
