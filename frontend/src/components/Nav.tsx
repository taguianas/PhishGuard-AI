'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import UserMenu from '@/components/UserMenu';
import BrandMark from '@/components/BrandMark';

const publicNavItems = [
  { href: '/url-analyzer', label: 'URL' },
  { href: '/email-analyzer', label: 'Email' },
  { href: '/attachment-analyzer', label: 'Files' },
  { href: '/qr-analyzer', label: 'QR' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

function MenuButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={open}
      aria-controls="mobile-nav"
      onClick={onClick}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition hover:border-cyan-300/24 hover:bg-white/[0.08] lg:hidden"
    >
      <div className="relative h-4 w-5">
        <motion.span
          className="absolute left-0 top-0 h-[1.5px] w-5 rounded-full bg-slate-200 origin-center"
          animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        />
        <motion.span
          className="absolute left-0 top-[7px] h-[1.5px] w-5 rounded-full bg-slate-200 origin-center"
          animate={open ? { opacity: 0, scaleX: 0.3 } : { opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.18 }}
        />
        <motion.span
          className="absolute left-0 top-[14px] h-[1.5px] w-5 rounded-full bg-slate-200 origin-center"
          animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        />
      </div>
    </button>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = session
    ? [...publicNavItems, { href: '/dashboard', label: 'Dashboard' }]
    : publicNavItems;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[30px] border border-white/10 bg-slate-950/[0.72] px-4 py-3 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.9)] backdrop-blur-xl">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between gap-4">
          <BrandMark />

          {/* Desktop nav */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'group relative inline-flex shrink-0 items-center rounded-full p-1 text-sm font-medium transition',
                    active ? 'text-slate-950' : 'text-slate-300/[0.78]',
                  )}
                >
                  <motion.span
                    aria-hidden="true"
                    className={clsx(
                      'absolute inset-[3px] rounded-full opacity-0 transition-opacity duration-300',
                      active
                        ? 'bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.3),transparent_62%)] opacity-100'
                        : 'bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.16),transparent_62%)] group-hover:opacity-100',
                    )}
                    animate={active ? { opacity: [0.7, 1, 0.7] } : undefined}
                    transition={active ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
                  />
                  {active && (
                    <motion.span
                      layoutId="nav-orbit-pill"
                      className="absolute inset-0 rounded-full border border-cyan-100/30 bg-cyan-300 shadow-[0_12px_34px_rgba(34,211,238,0.3)]"
                      transition={{ type: 'spring', bounce: 0.22, duration: 0.6 }}
                    />
                  )}
                  <motion.span
                    whileHover={{ y: -1.5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 18 }}
                    className={clsx(
                      'relative z-10 inline-flex items-center rounded-full border px-4 py-2.5 whitespace-nowrap',
                      active
                        ? 'border-slate-950/10 bg-white/[0.16] text-slate-950'
                        : 'border-white/10 bg-white/[0.03] text-slate-200/80 group-hover:border-cyan-300/[0.24] group-hover:bg-cyan-300/[0.08] group-hover:text-white',
                    )}
                  >
                    {item.label}
                  </motion.span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:block">
              <UserMenu />
            </div>
            <MenuButton open={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
          </div>
        </div>

        {/* ── Mobile / tablet drawer ── */}
        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.nav
              id="mobile-nav"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 30, mass: 0.85 }}
              className="overflow-hidden lg:hidden"
            >
              <div className="mt-3 border-t border-white/10 pt-4 pb-1 space-y-1.5">

                {/* Nav items */}
                {navItems.map((item, index) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: index * 0.055,
                        type: 'spring',
                        stiffness: 420,
                        damping: 28,
                      }}
                    >
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={clsx(
                          'relative flex items-center justify-between overflow-hidden rounded-[18px] border px-5 py-4 transition',
                          active
                            ? 'border-cyan-300/25 bg-cyan-300 text-slate-950'
                            : 'border-white/10 bg-white/[0.03] text-slate-200/80 hover:border-cyan-300/20 hover:bg-white/[0.06] hover:text-white',
                        )}
                      >
                        {/* Subtle glow on active */}
                        {active && (
                          <motion.span
                            layoutId="mobile-glow"
                            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(255,255,255,0.18),transparent_65%)]"
                          />
                        )}
                        <span className="relative text-sm font-semibold tracking-wide">
                          {item.label}
                        </span>
                        {active ? (
                          <span className="relative flex h-2 w-2 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-800/50 opacity-60" />
                            <span className="relative h-1.5 w-1.5 rounded-full bg-slate-900/70" />
                          </span>
                        ) : (
                          <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}

                {/* UserMenu row */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: navItems.length * 0.055 + 0.05 }}
                  className="border-t border-white/[0.08] pt-3 mt-1"
                >
                  <UserMenu />
                </motion.div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
