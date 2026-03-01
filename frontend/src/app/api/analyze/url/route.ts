import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:4000';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.text();
  const res = await fetch(`${BACKEND}/api/url/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await buildJWT(token)}`,
    },
    body,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

// Re-sign the token so Express can verify it with the same secret
async function buildJWT(token: Record<string, unknown>): Promise<string> {
  const { SignJWT } = await import('jose');
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  return new SignJWT({ id: token.id as string, sub: token.sub as string })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
}
