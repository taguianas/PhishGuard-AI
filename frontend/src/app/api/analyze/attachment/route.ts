import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

const BACKEND = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/+$/, '');

export async function POST(req: NextRequest) {
  const session = await auth();

  // Read the incoming multipart form data
  const formData = await req.formData();
  const file = formData.get('attachment');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No attachment provided.' }, { status: 400 });
  }

  // Rebuild FormData to forward to backend
  const backendForm = new FormData();
  backendForm.append('attachment', file, (file as File).name ?? 'upload');

  const headers: Record<string, string> = {};
  if (session?.user) {
    headers['Authorization'] = `Bearer ${await buildJWT(session.user)}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND}/api/attachment/analyze`, {
      method: 'POST',
      headers,
      body: backendForm,
    });
  } catch (err) {
    console.error('[attachment proxy] fetch failed:', err);
    return NextResponse.json({ error: 'Backend service unavailable. Please try again shortly.' }, { status: 503 });
  }

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    console.error(`[attachment proxy] non-JSON response (HTTP ${res.status}):`, text.slice(0, 300));
    return NextResponse.json({ error: `Unexpected backend response (HTTP ${res.status}).` }, { status: 502 });
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
