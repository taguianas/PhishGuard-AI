import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/+$/, '');

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.text();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.user) {
    headers['Authorization'] = `Bearer ${await buildJWT(session.user)}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND}/api/url/analyze`, { method: 'POST', headers, body });
  } catch (err) {
    console.error('[url proxy] fetch failed:', err);
    return NextResponse.json({ error: 'Backend service unavailable. Please try again shortly.' }, { status: 503 });
  }

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    console.error(`[url proxy] non-JSON backend response (HTTP ${res.status}):`, text.slice(0, 300));
    const msg = res.status === 503
      ? 'Backend is starting up — please wait ~30 seconds and try again.'
      : `Backend returned an unexpected response (HTTP ${res.status}). Check Render logs.`;
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  return NextResponse.json(data, { status: res.status });
}

async function buildJWT(user: { id?: string | null }): Promise<string> {
  const { SignJWT } = await import('jose');
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  return new SignJWT({ id: user.id, sub: user.id ?? undefined })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
}
