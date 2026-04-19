'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/AuthShell';
import { Notice } from '@/components/Feedback';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }

      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        router.push('/login');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Identity Seed"
      title="Create an account and bind your scan history to a persistent operator."
      description="Registration now looks and behaves like the rest of the product: high contrast, crisp surfaces, and no break in visual tone between marketing and utility."
      highlights={['Auto sign-in after registration', 'Personal dashboard persistence', 'Shared shell across every route']}
      footer={
        <p className="text-sm text-slate-300/[0.72]">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-cyan-100 transition hover:text-white">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="app-kicker">Create account</p>
          <p className="mt-3 text-2xl font-semibold text-white">Identity bootstrap</p>
          <p className="mt-2 text-sm leading-7 text-slate-300/70">Set up a user profile so the monitoring deck can retain scan results over time.</p>
        </div>

        {error && <Notice>{error}</Notice>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="app-label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Your name"
              className="app-input"
            />
          </div>

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

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="app-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="app-input"
              />
            </div>

            <div>
              <label className="app-label">Confirm</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repeat password"
                className="app-input"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="app-primary-btn w-full justify-center">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
