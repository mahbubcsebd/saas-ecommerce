import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        guestId: { label: 'Guest ID', type: 'text' },
      },
      async authorize(credentials) {
        console.log('Authorize called with credentials:', credentials); // DEBUG LOG
        if (!credentials?.email || !credentials?.password) return null;

        try {
          console.log(`Sending login request to: ${API_URL}/auth/login`); // DEBUG LOG
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              guestId: credentials.guestId,
            }),
          });
          console.log('Backend response status:', res.status); // DEBUG LOG

          const data = await res.json();

          // Log the response for debugging
          console.log('Login API Response:', {
            status: res.status,
            success: data.success,
            message: data.message,
          });

          if (res.ok && data.success) {
            return {
              id: data.data.user.id,
              name: data.data.user.firstName + ' ' + data.data.user.lastName,
              email: data.data.user.email,
              image: data.data.user.avatar,
              accessToken: data.data.accessToken,
              user: data.data.user,
            };
          }

          // Forward backend error message to user (e.g. "Please verify your email")
          const msg = data.message || 'Invalid credentials';
          console.error('Login failed:', msg);
          throw new Error(msg);
        } catch (e) {
          console.error('Login error:', e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.user = (user as any).user;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      const user = token.user as any;
      session.user = {
        ...session.user,
        id: user.id,
        username: user.username,
        phone: user.phone,
        address: user.address,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        dob: user.dob,
        ...user,
      };
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'supersecret',
  // Separate cookie so shop and dashboard logins don't overwrite each other (e.g. on localhost)
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token.shop'
          : 'next-auth.session-token.shop',
      options: {
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60,
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
