import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { promises as fs } from 'fs';
import path from 'path';
import { authConfig } from '@/auth.config';

// ── User storage ──────────────────────────────────────────────────────────────
// Prefer Neon when DATABASE_URL is configured. Fall back to a local JSON store
// for local development so the app can boot without external infra.
const DATABASE_URL = process.env.DATABASE_URL?.trim();
const LOCAL_USERS_PATH = path.join(process.cwd(), 'data', 'users.local.json');

let _sql: ReturnType<typeof neon> | null = null;
function getDb() {
  if (!DATABASE_URL) return null;
  if (!_sql) _sql = neon(DATABASE_URL);
  return _sql;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
type UserRow = { id: string; email: string; name: string | null; password: string | null; image: string | null };

async function ensureLocalStore(): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_USERS_PATH), { recursive: true });
  try {
    await fs.access(LOCAL_USERS_PATH);
  } catch {
    await fs.writeFile(LOCAL_USERS_PATH, '[]', 'utf8');
  }
}

async function readLocalUsers(): Promise<UserRow[]> {
  await ensureLocalStore();
  const raw = await fs.readFile(LOCAL_USERS_PATH, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  return Array.isArray(parsed) ? (parsed as UserRow[]) : [];
}

async function writeLocalUsers(users: UserRow[]): Promise<void> {
  await ensureLocalStore();
  await fs.writeFile(LOCAL_USERS_PATH, JSON.stringify(users, null, 2), 'utf8');
}

export async function getUserByEmail(email: string): Promise<UserRow | undefined> {
  const db = getDb();
  if (db) {
    const rows = (await db`SELECT * FROM users WHERE email = ${email}`) as UserRow[];
    return rows[0];
  }

  const users = await readLocalUsers();
  return users.find((user) => user.email === email);
}

export async function createUser(
  id: string,
  name: string | null,
  email: string,
  passwordHash: string | null,
  image: string | null
): Promise<void> {
  const db = getDb();
  if (db) {
    await db`INSERT INTO users (id, name, email, password, image) VALUES (${id}, ${name}, ${email}, ${passwordHash}, ${image})`;
    return;
  }

  const users = await readLocalUsers();
  users.push({ id, name, email, password: passwordHash, image });
  await writeLocalUsers(users);
}

export async function getUserById(id: string): Promise<UserRow | undefined> {
  const db = getDb();
  if (db) {
    const rows = (await db`SELECT * FROM users WHERE id = ${id}`) as UserRow[];
    return rows[0];
  }

  const users = await readLocalUsers();
  return users.find((user) => user.id === id);
}

// ── NextAuth config ───────────────────────────────────────────────────────────
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    // Google OAuth — only active when both env vars are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId:     process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // Email + Password
    Credentials({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email    = (credentials?.email as string | undefined)?.toLowerCase().trim();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await getUserByEmail(email);
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        const existing = await getUserByEmail(profile.email);
        if (!existing) {
          const { randomUUID } = await import('crypto');
          await createUser(
            randomUUID(),
            (profile.name as string | null) ?? null,
            profile.email,
            null,
            (profile as Record<string, unknown>).picture as string | null ?? null,
          );
        }
        const dbUser = await getUserByEmail(profile.email);
        if (dbUser) user.id = dbUser.id;
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },

    async session({ session, token }) {
      if (token?.id) (session.user as unknown as Record<string, unknown>).id = token.id;
      return session;
    },
  },

  pages: { signIn: '/login' },
});
