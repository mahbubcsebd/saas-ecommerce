import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          console.log(`Attempting login for ${credentials.email} at ${API_URL}/auth/login`);
          const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          });

          const data = await res.json();

          if (!res.ok || !data.success) {
              console.error('Login failed:', data);
              return null;
          }

          if (res.ok && data.success) {
            return {
                id: data.data.user.id,
                name: data.data.user.firstName + ' ' + data.data.user.lastName,
                email: data.data.user.email,
                image: data.data.user.avatar,
                role: data.data.user.role, // Added role
                username: data.data.user.username, // Added username
                accessToken: data.data.accessToken,
                user: data.data.user
            } as any;
          }
          return null;
        } catch (e) {
          console.error('Login error:', e);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
        if (trigger === "update" && session) {
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
        if (session.user) {
            session.user = {
                ...session.user,
                id: (token.user as any)?.id,
                email: (token.user as any)?.email,
                name: (token.user as any)?.firstName + ' ' + (token.user as any)?.lastName,
                image: (token.user as any)?.avatar,
                role: (token.user as any)?.role,
                ...user
            } as any;
        }
        return session;
    }
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "supersecret",
  // Separate cookie so shop and dashboard logins don't overwrite each other (e.g. on localhost)
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token.dashboard"
        : "next-auth.session-token.dashboard",
      options: {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60,
      },
    },
  },
};
