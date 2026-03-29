import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc.js";
import { db } from "../../db/index.js";
import { ports } from "../../db/schema.js";

export const portRouter = router({
  list: protectedProcedure.query(async () => {
    return db.query.ports.findMany({
      where: eq(ports.isDeleted, false),
    });
  }),

  create: adminProcedure
    .input(z.object({
      code: z.string().min(1, "港口代码不能为空"),
      nameCn: z.string().min(1, "港口中文名不能为空"),
      nameEn: z.string().optional(),
      country: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.insert(ports).values(input).returning().get();
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      code: z.string().min(1),
      nameCn: z.string().min(1),
      nameEn: z.string().optional(),
      country: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      db.update(ports)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(ports.id, id))
        .run();
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      db.update(ports)
        .set({ isDeleted: true, updatedAt: new Date().toISOString() })
        .where(eq(ports.id, input.id))
        .run();
      return { success: true };
    }),
});
