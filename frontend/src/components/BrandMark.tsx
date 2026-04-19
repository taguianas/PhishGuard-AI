import Link from 'next/link';
import clsx from 'clsx';

interface BrandMarkProps {
  href?: string;
  compact?: boolean;
  showTagline?: boolean;
  className?: string;
}

function BrandGlyph() {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/25 bg-slate-950/90 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.28),transparent_58%)]" />
      <div className="absolute inset-[1px] rounded-[14px] border border-white/[0.08]" />
      <svg className="relative z-10 h-6 w-6 text-cyan-200" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 3l9 4.8v6.7c0 7-4.1 11.9-9 14.7-4.9-2.8-9-7.7-9-14.7V7.8L16 3z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12.2 16.1l2.4 2.6 5.2-5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function BrandMark({
  href = '/',
  compact = false,
  showTagline = false,
  className,
}: BrandMarkProps) {
  const content = (
    <div className={clsx('flex items-center gap-3', className)}>
      <BrandGlyph />
      {!compact && (
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-[0.18em] text-white uppercase">PhishGuard</p>
          {(showTagline || !compact) && (
            <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-100/[0.65]">
              AI Threat Observatory
            </p>
          )}
        </div>
      )}
    </div>
  );

  return <Link href={href}>{content}</Link>;
}
