import { z } from "zod";
import { eq } from "drizzle-orm";
import { hashSync } from "bcryptjs";
import { router, adminProcedure } from "../trpc.js";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";

export const userAdminRouter = router({
  // 获取所有用户列表
  list: adminProcedure.query(async () => {
    const allUsers = db.query.users.findMany();
    return allUsers.map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      loginMethod: u.loginMethod,
      createdAt: u.createdAt,
      lastSignedIn: u.lastSignedIn,
    }));
  }),

  // 设置用户角色
  setRole: adminProcedure
    .input(z.object({
      id: z.number(),
      role: z.enum(["user", "admin"]),
    }))
    .mutation(async ({ input }) => {
      db.update(users)
        .set({ role: input.role, updatedAt: new Date().toISOString() })
        .where(eq(users.id, input.id))
        .run();
      return { success: true };
    }),

  // 启用/禁用用户
  setActive: adminProcedure
    .input(z.object({
      id: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      db.update(users)
        .set({ isActive: input.isActive, updatedAt: new Date().toISOString() })
        .where(eq(users.id, input.id))
        .run();
      return { success: true };
    }),

  // 创建本地账户
  createLocal: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      username: z.string().min(1),
      email: z.string().optional(),
      phone: z.string().optional(),
      password: z.string().min(6),
      role: z.enum(["user", "admin"]),
    }))
    .mutation(async ({ input }) => {
      const hash = hashSync(input.password, 10);
      const result = db.insert(users).values({
        openId: `local-${Date.now()}`,
        name: input.name,
        username: input.username,
        email: input.email,
        phone: input.phone,
        passwordHash: hash,
        loginMethod: "local",
        role: input.role,
      }).returning().get();
      return result;
    }),

  // 重置密码
  resetPassword: adminProcedure
    .input(z.object({
      id: z.number(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const hash = hashSync(input.newPassword, 10);
      db.update(users)
        .set({ passwordHash: hash, updatedAt: new Date().toISOString() })
        .where(eq(users.id, input.id))
        .run();
      return { success: true };
    }),
});
