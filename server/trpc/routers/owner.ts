import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc.js";
import { db } from "../../db/index.js";
import { shipOwners } from "../../db/schema.js";

export const ownerRouter = router({
  // 获取所有船东（排除已删除）
  list: protectedProcedure.query(async () => {
    return await db.query.shipOwners.findMany({
      where: eq(shipOwners.isDeleted, false),
    });
  }),

  // 创建船东
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1, "船东名称不能为空"),
      code: z.string().min(1, "船东代码不能为空"),
      contact: z.string().optional(),
      phone: z.string().optional(),
      remark: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = (await db.insert(shipOwners).values(input).returning())[0];
      return result;
    }),

  // 更新船东
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1),
      code: z.string().min(1),
      contact: z.string().optional(),
      phone: z.string().optional(),
      remark: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.update(shipOwners)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(shipOwners.id, id))
        ;
      return { success: true };
    }),

  // 软删除船东
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(shipOwners)
        .set({ isDeleted: true, updatedAt: new Date().toISOString() })
        .where(eq(shipOwners.id, input.id))
        ;
      return { success: true };
    }),
});
