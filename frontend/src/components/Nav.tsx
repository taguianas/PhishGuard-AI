'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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

export default function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const navItems = session ? [...publicNavItems, { href: '/dashboard', label: 'Dashboard' }] : publicNavItems;

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[30px] border border-white/10 bg-slate-950/[0.72] px-4 py-3 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.9)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <BrandMark />
            <div className="h-px flex-1 bg-gradient-to-r from-white/0 via-cyan-300/20 to-white/0 lg:hidden" />
          </div>

          <nav className="mx-auto flex w-full items-center gap-2 overflow-x-auto pb-1 lg:w-auto lg:justify-center">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'group relative inline-flex shrink-0 items-center rounded-full p-1 text-[13px] font-medium transition sm:text-sm',
                    active ? 'text-slate-950' : 'text-slate-300/[0.78]'
                  )}
                >
                  <motion.span
                    aria-hidden="true"
                    className={clsx(
                      'absolute inset-[3px] rounded-full opacity-0 transition-opacity duration-300',
                      active
                        ? 'bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.3),transparent_62%)] opacity-100'
                        : 'bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.16),transparent_62%)] group-hover:opacity-100'
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
                      'relative z-10 inline-flex items-center rounded-full border px-3.5 py-2 whitespace-nowrap sm:px-4 sm:py-2.5',
                      active
                        ? 'border-slate-950/10 bg-white/[0.16] text-slate-950'
                        : 'border-white/10 bg-white/[0.03] text-slate-200/80 group-hover:border-cyan-300/[0.24] group-hover:bg-cyan-300/[0.08] group-hover:text-white'
                    )}
                  >
                    <span>{item.label}</span>
                  </motion.span>
                </Link>
              );
            })}
          </nav>

          <div className="flex justify-end">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
