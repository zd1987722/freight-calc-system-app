import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../../db/index.js";
import { rateTables, rateSteps, calculationHistory, shipOwners, ports } from "../../db/schema.js";

/**
 * 线性内插法计算费率
 * 公式：r = r1 + (q - q1) * (r2 - r1) / (q2 - q1)
 */
export function interpolateRate(
  confirmedQuantity: number,
  steps: Array<{ quantity: number; rate: number }>
): {
  rate: number;
  details: {
    type: "exact" | "interpolated" | "below_min" | "above_max";
    q1?: number; r1?: number;
    q2?: number; r2?: number;
    formula?: string;
  };
} {
  if (steps.length === 0) {
    throw new Error("费率表中没有阶梯数据");
  }

  // 按数量排序
  const sorted = [...steps].sort((a, b) => a.quantity - b.quantity);

  // 只有单个节点
  if (sorted.length === 1) {
    return {
      rate: sorted[0].rate,
      details: { type: "exact", q1: sorted[0].quantity, r1: sorted[0].rate },
    };
  }

  const q = confirmedQuantity;

  // 低于最低节点
  if (q < sorted[0].quantity) {
    return {
      rate: sorted[0].rate,
      details: {
        type: "below_min",
        q1: sorted[0].quantity,
        r1: sorted[0].rate,
        formula: `装货量 ${q} ≤ 最低节点 ${sorted[0].quantity}，使用最低费率 ${sorted[0].rate}`,
      },
    };
  }

  // 高于最高节点
  if (q >= sorted[sorted.length - 1].quantity) {
    const last = sorted[sorted.length - 1];
    return {
      rate: last.rate,
      details: {
        type: "above_max",
        q1: last.quantity,
        r1: last.rate,
        formula: `装货量 ${q} ≥ 最高节点 ${last.quantity}，使用最高费率 ${last.rate}`,
      },
    };
  }

  // 查找区间
  for (let i = 0; i < sorted.length - 1; i++) {
    const q1 = sorted[i].quantity;
    const q2 = sorted[i + 1].quantity;
    const r1 = sorted[i].rate;
    const r2 = sorted[i + 1].rate;

    // 精确匹配
    if (q === q1) {
      return {
        rate: r1,
        details: { type: "exact", q1, r1 },
      };
    }

    if (q > q1 && q < q2) {
      // 线性内插: r = r1 + (q - q1) * (r2 - r1) / (q2 - q1)
      const rate = r1 + ((q - q1) * (r2 - r1)) / (q2 - q1);
      const roundedRate = Math.round(rate * 10000) / 10000; // 精度 0.0001

      return {
        rate: roundedRate,
        details: {
          type: "interpolated",
          q1, r1, q2, r2,
          formula: `r = ${r1} + (${q} - ${q1}) × (${r2} - ${r1}) / (${q2} - ${q1}) = ${roundedRate}`,
        },
      };
    }
  }

  // 精确匹配最后一个节点
  const last = sorted[sorted.length - 1];
  return {
    rate: last.rate,
    details: { type: "exact", q1: last.quantity, r1: last.rate },
  };
}

export const calculateRouter = router({
  // 运费计算
  compute: protectedProcedure
    .input(z.object({
      ownerId: z.number(),
      loadPortId: z.number(),
      dischargePortId: z.number(),
      confirmedQuantity: z.number().positive("装货量必须大于0"),
    }))
    .mutation(async ({ input, ctx }) => {
      const { ownerId, loadPortId, dischargePortId, confirmedQuantity } = input;

      // 查找有效的费率表
      const today = new Date().toISOString().split("T")[0];
      const allTables = await db.query.rateTables.findMany({
        where: and(
          eq(rateTables.ownerId, ownerId),
          eq(rateTables.loadPortId, loadPortId),
          eq(rateTables.dischargePortId, dischargePortId),
          eq(rateTables.status, true),
          eq(rateTables.isDeleted, false),
        ),
      });

      // 过滤在有效期内的费率表
      const validTable = allTables.find(t => t.validFrom <= today && t.validTo >= today);

      if (!validTable) {
        throw new Error("未找到匹配的有效费率表，请确认所选航线和日期");
      }

      // 获取阶梯数据
      const steps = await db.query.rateSteps.findMany({
        where: eq(rateSteps.rateTableId, validTable.id),
      });

      if (steps.length === 0) {
        throw new Error("费率表没有阶梯数据");
      }

      // 执行内插法计算
      const result = interpolateRate(confirmedQuantity, steps);
      const totalFreight = Math.round(confirmedQuantity * result.rate * 100) / 100;

      // 记录计算历史
      await db.insert(calculationHistory).values({
        userId: ctx.user.id,
        ownerId,
        loadPortId,
        dischargePortId,
        confirmedQuantity: confirmedQuantity.toString(),
        calculatedRate: result.rate.toString(),
        totalFreight: totalFreight.toString(),
        calculationDetails: JSON.stringify(result.details),
      });

      return {
        rate: result.rate,
        totalFreight,
        details: result.details,
      };
    }),

  // 查询计算历史（含关联信息）
  history: protectedProcedure
    .input(z.object({ limit: z.number().default(100) }).optional())
    .query(async ({ input, ctx }) => {
      const limit = input?.limit ?? 100;

      const records = await db.query.calculationHistory.findMany({
        orderBy: [desc(calculationHistory.createdAt)],
        limit,
      });

      // 关联船东和港口名
      const allOwners = await db.query.shipOwners.findMany();
      const allPorts = await db.query.ports.findMany();
      const ownerMap = new Map(allOwners.map(o => [o.id, o.name]));
      const portMap = new Map(allPorts.map(p => [p.id, p.nameCn]));

      // 关联用户名
      const allUsers = await db.query.users.findMany();
      const userMap = new Map(allUsers.map(u => [u.id, u.name || u.username || "未知"]));

      return records.map(r => ({
        ...r,
        ownerName: ownerMap.get(r.ownerId) || "未知",
        loadPortName: portMap.get(r.loadPortId) || "未知",
        dischargePortName: portMap.get(r.dischargePortId) || "未知",
        userName: r.userId ? userMap.get(r.userId) || "未知" : "未知",
      }));
    }),

  // 获取指定船东的可用港口（根据费率表过滤）
  getAvailablePorts: protectedProcedure
    .input(z.object({ ownerId: z.number() }))
    .query(async ({ input }) => {
      const tables = await db.query.rateTables.findMany({
        where: and(
          eq(rateTables.ownerId, input.ownerId),
          eq(rateTables.status, true),
          eq(rateTables.isDeleted, false),
        ),
      });

      const loadPortIds = new Set(tables.map(t => t.loadPortId));
      const dischargePortIds = new Set(tables.map(t => t.dischargePortId));

      const allPorts = await db.query.ports.findMany({
        where: eq(ports.isDeleted, false),
      });

      return {
        loadPorts: allPorts.filter(p => loadPortIds.has(p.id)),
        dischargePorts: allPorts.filter(p => dischargePortIds.has(p.id)),
      };
    }),

  // 获取指定船东和装货港的可用卸货港
  getAvailableDischargePorts: protectedProcedure
    .input(z.object({ ownerId: z.number(), loadPortId: z.number() }))
    .query(async ({ input }) => {
      const tables = await db.query.rateTables.findMany({
        where: and(
          eq(rateTables.ownerId, input.ownerId),
          eq(rateTables.loadPortId, input.loadPortId),
          eq(rateTables.status, true),
          eq(rateTables.isDeleted, false),
        ),
      });

      const dischargePortIds = new Set(tables.map(t => t.dischargePortId));
      const allPorts = await db.query.ports.findMany({
        where: eq(ports.isDeleted, false),
      });

      return allPorts.filter(p => dischargePortIds.has(p.id));
    }),
});
