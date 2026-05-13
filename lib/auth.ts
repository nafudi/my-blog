import NextAuth from "next-auth";
import type { NextAuthConfig, DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// 扩展 session 类型，添加 id 和 role
declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      role?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// 单例 Prisma Client
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// NextAuth 配置
const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "账号密码",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;
        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as unknown as { id?: string }).id;
        token.role = (user as unknown as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const t = token as Record<string, unknown>;
        session.user.id = t.id as string;
        session.user.role = t.role as string;
      }
      return session;
    },
  },
};

// NextAuth v5: 导出 handlers 和 auth
const { handlers, auth } = NextAuth(authConfig);
export { handlers, auth };
