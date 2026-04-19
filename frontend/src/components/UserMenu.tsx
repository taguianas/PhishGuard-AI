'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';

export default function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="h-10 w-32 rounded-full bg-white/[0.08] animate-pulse" />;
  }
  if (!session) {
    return (
      <div className="flex items-center">
        <Link href="/login" className="app-primary-btn px-5 py-2.5 text-xs uppercase tracking-[0.22em]">
          Sign In
        </Link>
      </div>
    );
  }

  const user = session.user;
  const initials =
    (user?.name
      ? user.name.split(' ').map((n) => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2)
      : user?.email?.[0]?.toUpperCase()) || '?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-wrap items-center justify-end gap-2"
    >
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-2 py-2">
      {user?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt="Profile" className="h-9 w-9 rounded-full border border-white/[0.12] object-cover" />
      ) : (
        <div className="flex h-9 w-9 select-none items-center justify-center rounded-full border border-cyan-300/[0.24] bg-cyan-300/[0.12] text-xs font-bold text-cyan-100">
          {initials}
        </div>
      )}
      <div className="hidden min-w-0 sm:block">
        <p className="max-w-[160px] truncate text-sm font-medium text-white">{user?.name || 'Threat Operator'}</p>
        <p className="max-w-[160px] truncate text-xs uppercase tracking-[0.2em] text-slate-400">{user?.email}</p>
      </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="app-secondary-btn px-4 py-2.5 text-xs uppercase tracking-[0.22em] text-slate-200 hover:text-rose-100"
      >
        Sign out
      </button>
    </motion.div>
  );
}
