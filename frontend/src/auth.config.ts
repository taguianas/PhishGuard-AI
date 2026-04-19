import type { NextAuthConfig } from 'next-auth';

// Edge-compatible config — NO Node.js modules (no fs, path, better-sqlite3, bcryptjs)
// Used by middleware.ts which runs on the Edge Runtime.
export const authConfig: NextAuthConfig = {
  providers: [], // Providers with DB access are added in auth.ts (Node.js only)

  pages: { signIn: '/login' },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Public routes — always accessible
      if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/api/auth')
      ) {
        return true;
      }

      // All other routes require authentication
      return isLoggedIn;
    },
  },
};
