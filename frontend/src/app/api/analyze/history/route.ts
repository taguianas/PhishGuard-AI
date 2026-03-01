import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const jwt = await buildJWT(token);
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  // Route to /stats or /history based on ?type=stats
  const backendPath = type === 'stats'
    ? `${BACKEND}/api/history/stats`
    : `${BACKEND}/api/history?limit=${searchParams.get('limit') || 20}`;

  const res = await fetch(backendPath, {
    headers: { Authorization: `Bearer ${jwt}` },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

async function buildJWT(token: Record<string, unknown>): Promise<string> {
  const { SignJWT } = await import('jose');
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  return new SignJWT({ id: token.id as string, sub: token.sub as string })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
}
