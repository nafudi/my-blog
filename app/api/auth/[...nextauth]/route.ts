import NextAuth from "next-auth";
import authConfig from "@/lib/auth";

const handler = NextAuth(authConfig);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GET = handler as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const POST = handler as any;
