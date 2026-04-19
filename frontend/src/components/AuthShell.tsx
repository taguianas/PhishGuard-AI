import { ReactNode } from 'react';
import BrandMark from '@/components/BrandMark';
import { Reveal } from '@/components/Reveal';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  children: ReactNode;
  footer: ReactNode;
}

export default function AuthShell({
  eyebrow,
  title,
  description,
  highlights,
  children,
  footer,
}: AuthShellProps) {
  return (
    <section className="app-container py-10 md:py-16">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Reveal className="app-panel p-8 md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_48%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <BrandMark showTagline />
              <div className="space-y-4">
                <span className="app-eyebrow">{eyebrow}</span>
                <h1 className="app-subtitle md:text-[3rem]">{title}</h1>
                <p className="app-copy max-w-xl">{description}</p>
              </div>
            </div>

            <div className="space-y-3">
              {highlights.map((item, index) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white">{item}</p>
                    <span className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">0{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="app-panel p-6 md:p-8">
          {children}
          <div className="mt-6 border-t border-white/10 pt-5">{footer}</div>
        </Reveal>
      </div>
    </section>
  );
}
