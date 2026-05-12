import NextAuth from "next-auth";
import authConfig from "@/lib/auth";

// 创建 auth 实例（用于服务端获取 session）
const { auth } = NextAuth(authConfig);

export default auth;
