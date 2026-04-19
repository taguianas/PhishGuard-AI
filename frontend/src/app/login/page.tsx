'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/AuthShell';
import { Notice } from '@/components/Feedback';

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Invalid email or password.');
      } else {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    signIn('google', { callbackUrl: '/' });
  }

  return (
    <AuthShell
      eyebrow="Operator Access"
      title="Return to the threat observatory."
      description="Authentication now lives inside the same dark product shell as the rest of the app, so signing in feels like entering the system rather than leaving it."
      highlights={['Persistent dashboard memory', 'Cross-tool scan history', 'Unified operator identity']}
      footer={
        <p className="text-sm text-slate-300/[0.72]">
          Need an account?{' '}
          <Link href="/register" className="font-semibold text-cyan-100 transition hover:text-white">
            Create one
          </Link>
        </p>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="app-kicker">Sign in</p>
          <p className="mt-3 text-2xl font-semibold text-white">Credential gate</p>
          <p className="mt-2 text-sm leading-7 text-slate-300/70">Access your dashboard, stored scans, and the full monitoring deck.</p>
        </div>

        {error && <Notice>{error}</Notice>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="app-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="app-input"
            />
          </div>

          <div>
            <label className="app-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="app-input"
            />
          </div>

          <button type="submit" disabled={loading} className="app-primary-btn w-full justify-center">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {GOOGLE_ENABLED && (
          <>
            <div className="relative flex items-center">
              <div className="h-px flex-1 bg-white/10" />
              <span className="px-3 text-xs uppercase tracking-[0.22em] text-slate-400">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              className="app-secondary-btn w-full justify-center"
            >
              Continue with Google
            </button>
          </>
        )}
      </div>
    </AuthShell>
  );
}
