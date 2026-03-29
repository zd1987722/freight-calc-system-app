import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "freight-calc-secret-key-2026";

export interface UserPayload {
  id: number;
  username: string | null;
  name: string | null;
  role: "user" | "admin";
}

export interface Context {
  req: Request;
  res: Response;
  user: UserPayload | null;
}

export async function createContext({ req, res }: { req: Request; res: Response }): Promise<Context> {
  let user: UserPayload | null = null;

  // 从 cookie 或 header 中提取 token
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as UserPayload & { iat: number; exp: number };
      // 验证用户是否存在且启用
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, decoded.id),
      });
      if (dbUser && dbUser.isActive) {
        user = {
          id: dbUser.id,
          username: dbUser.username,
          name: dbUser.name,
          role: dbUser.role as "user" | "admin",
        };
      }
    } catch {
      // token 无效，忽略
    }
  }

  return { req, res, user };
}

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
