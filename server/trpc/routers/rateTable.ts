import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc.js";
import { db } from "../../db/index.js";
import { rateTables, rateSteps, shipOwners, ports } from "../../db/schema.js";

export const rateTableRouter = router({
  // 获取所有费率表（含关联的船东和港口名称）
  list: protectedProcedure.query(async () => {
    const tables = db.query.rateTables.findMany({
      where: eq(rateTables.isDeleted, false),
    });

    // 手动关联数据
    const allOwners = db.query.shipOwners.findMany();
    const allPorts = db.query.ports.findMany();

    const ownerMap = new Map(allOwners.map(o => [o.id, o]));
    const portMap = new Map(allPorts.map(p => [p.id, p]));

    return tables.map(t => ({
      ...t,
      owner: ownerMap.get(t.ownerId),
      loadPort: portMap.get(t.loadPortId),
      dischargePort: portMap.get(t.dischargePortId),
    }));
  }),

  // 获取费率表详情（含阶梯）
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const table = db.query.rateTables.findFirst({
        where: eq(rateTables.id, input.id),
      });

      if (!table) throw new Error("费率表不存在");

      const steps = db.query.rateSteps.findMany({
        where: eq(rateSteps.rateTableId, input.id),
      });

      // 按 quantity 排序
      steps.sort((a, b) => a.quantity - b.quantity);

      return { ...table, steps };
    }),

  // 创建费率表
  create: adminProcedure
    .input(z.object({
      ownerId: z.number(),
      loadPortId: z.number(),
      dischargePortId: z.number(),
      validFrom: z.string(),
      validTo: z.string(),
      steps: z.array(z.object({
        quantity: z.number().positive(),
        rate: z.number().positive(),
      })).min(1, "至少需要一个阶梯"),
    }))
    .mutation(async ({ input, ctx }) => {
      const { steps, ...tableData } = input;

      const result = db.insert(rateTables).values({
        ...tableData,
        createdBy: ctx.user.id,
      }).returning().get();

      for (const step of steps) {
        db.insert(rateSteps).values({
          rateTableId: result.id,
          quantity: step.quantity,
          rate: step.rate,
        }).run();
      }

      return result;
    }),

  // 更新费率表
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      validFrom: z.string(),
      validTo: z.string(),
      status: z.boolean().optional(),
      steps: z.array(z.object({
        quantity: z.number().positive(),
        rate: z.number().positive(),
      })).min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, steps, ...data } = input;

      db.update(rateTables)
        .set({ ...data, updatedBy: ctx.user.id, updatedAt: new Date().toISOString() })
        .where(eq(rateTables.id, id))
        .run();

      // 删除旧阶梯，插入新阶梯
      db.delete(rateSteps).where(eq(rateSteps.rateTableId, id)).run();
      for (const step of steps) {
        db.insert(rateSteps).values({
          rateTableId: id,
          quantity: step.quantity,
          rate: step.rate,
        }).run();
      }

      return { success: true };
    }),

  // 软删除费率表
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      db.update(rateTables)
        .set({ isDeleted: true, updatedAt: new Date().toISOString() })
        .where(eq(rateTables.id, input.id))
        .run();
      return { success: true };
    }),
});
