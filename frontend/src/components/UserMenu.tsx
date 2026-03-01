'use client';
import { useSession, signOut } from 'next-auth/react';

export default function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />;
  }
  if (!session) return null;

  const user = session.user;
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="flex items-center gap-3">
      {user?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt="Profile" className="w-8 h-8 rounded-full border border-slate-200" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center border border-indigo-200 select-none">
          {initials}
        </div>
      )}
      <span className="text-sm text-slate-600 hidden sm:block max-w-[140px] truncate">
        {user?.name || user?.email}
      </span>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
