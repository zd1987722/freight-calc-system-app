import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ===== 用户表 =====
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("open_id").unique(),
  name: text("name"),
  username: text("username").unique(),
  email: text("email"),
  phone: text("phone"),
  passwordHash: text("password_hash"),
  loginMethod: text("login_method").default("local"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
  lastSignedIn: text("last_signed_in").default(sql`(datetime('now'))`),
});

// ===== 船东表 =====
export const shipOwners = sqliteTable("ship_owners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  contact: text("contact"),
  phone: text("phone"),
  remark: text("remark"),
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

// ===== 港口表 =====
export const ports = sqliteTable("ports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").unique().notNull(),
  nameCn: text("name_cn").notNull(),
  nameEn: text("name_en"),
  country: text("country"),
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

// ===== 费率表主表 =====
export const rateTables = sqliteTable("rate_tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("owner_id").notNull().references(() => shipOwners.id),
  loadPortId: integer("load_port_id").notNull().references(() => ports.id),
  dischargePortId: integer("discharge_port_id").notNull().references(() => ports.id),
  validFrom: text("valid_from").notNull(),
  validTo: text("valid_to").notNull(),
  status: integer("status", { mode: "boolean" }).default(true).notNull(),
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false).notNull(),
  createdBy: integer("created_by"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedBy: integer("updated_by"),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

// ===== 费率阶梯表 =====
export const rateSteps = sqliteTable("rate_steps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rateTableId: integer("rate_table_id").notNull().references(() => rateTables.id, { onDelete: "cascade" }),
  quantity: real("quantity").notNull(),
  rate: real("rate").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

// ===== 计算历史表 =====
export const calculationHistory = sqliteTable("calculation_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  ownerId: integer("owner_id").notNull().references(() => shipOwners.id),
  loadPortId: integer("load_port_id").notNull().references(() => ports.id),
  dischargePortId: integer("discharge_port_id").notNull().references(() => ports.id),
  confirmedQuantity: text("confirmed_quantity").notNull(),
  calculatedRate: text("calculated_rate").notNull(),
  totalFreight: text("total_freight").notNull(),
  calculationDetails: text("calculation_details"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

// ===== 类型导出 =====
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ShipOwner = typeof shipOwners.$inferSelect;
export type Port = typeof ports.$inferSelect;
export type RateTable = typeof rateTables.$inferSelect;
export type RateStep = typeof rateSteps.$inferSelect;
export type CalculationHistoryRecord = typeof calculationHistory.$inferSelect;
