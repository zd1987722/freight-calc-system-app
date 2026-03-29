import { z } from "zod";
import { compareSync, hashSync } from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { signToken } from "../context.js";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";

export const authRouter = router({
  // 获取当前用户信息
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user ?? null;
  }),

  // 本地账户登录
  localLogin: publicProcedure
    .input(z.object({
      credential: z.string().min(1, "请输入用户名/邮箱/手机号"),
      password: z.string().min(1, "请输入密码"),
    }))
    .mutation(async ({ input, ctx }) => {
      const { credential, password } = input;

      // 查找用户：支持用户名、邮箱、手机号
      const user = await db.query.users.findFirst({
        where: or(
          eq(users.username, credential),
          eq(users.email, credential),
          eq(users.phone, credential),
        ),
      });

      if (!user) {
        return { success: false, message: "用户不存在" };
      }

      if (!user.isActive) {
        return { success: false, message: "账户已被禁用，请联系管理员" };
      }

      if (!user.passwordHash) {
        return { success: false, message: "该账户未设置密码，请联系管理员" };
      }

      const valid = compareSync(password, user.passwordHash);
      if (!valid) {
        return { success: false, message: "密码错误" };
      }

      // 更新最后登录时间
      db.update(users)
        .set({ lastSignedIn: new Date().toISOString() })
        .where(eq(users.id, user.id))
        .run();

      // 生成 JWT
      const token = signToken({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role as "user" | "admin",
      });

      // 设置 cookie
      ctx.res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return { success: true, message: "登录成功" };
    }),

  // 登出
  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.res.clearCookie("token");
    return { success: true };
  }),
});

export const profileRouter = router({
  // 获取个人信息
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });
    if (!user) throw new Error("用户不存在");
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
  }),

  // 修改密码
  changePassword: protectedProcedure
    .input(z.object({
      oldPassword: z.string().min(1),
      newPassword: z.string().min(6, "新密码至少6位"),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });
      if (!user || !user.passwordHash) {
        return { success: false, message: "用户信息异常" };
      }

      if (!compareSync(input.oldPassword, user.passwordHash)) {
        return { success: false, message: "原密码错误" };
      }

      const newHash = hashSync(input.newPassword, 10);
      db.update(users)
        .set({ passwordHash: newHash, updatedAt: new Date().toISOString() })
        .where(eq(users.id, ctx.user.id))
        .run();

      return { success: true, message: "密码修改成功" };
    }),
});
