import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { hashSync } from "bcryptjs";
import * as schema from "./schema.js";
import path from "path";
import fs from "fs";

const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "freight.db");
const client = createClient({ url: `file:${dbPath}` });
const db = drizzle(client, { schema });

async function seed() {
  console.log("🔧 正在创建数据库表...");

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      open_id TEXT UNIQUE,
      name TEXT,
      username TEXT UNIQUE,
      email TEXT,
      phone TEXT,
      password_hash TEXT,
      login_method TEXT DEFAULT 'local',
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_signed_in TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ship_owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      contact TEXT,
      phone TEXT,
      remark TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name_cn TEXT NOT NULL,
      name_en TEXT,
      country TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rate_tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES ship_owners(id),
      load_port_id INTEGER NOT NULL REFERENCES ports(id),
      discharge_port_id INTEGER NOT NULL REFERENCES ports(id),
      valid_from TEXT NOT NULL,
      valid_to TEXT NOT NULL,
      status INTEGER NOT NULL DEFAULT 1,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_by INTEGER,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rate_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rate_table_id INTEGER NOT NULL REFERENCES rate_tables(id) ON DELETE CASCADE,
      quantity REAL NOT NULL,
      rate REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS calculation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      owner_id INTEGER NOT NULL REFERENCES ship_owners(id),
      load_port_id INTEGER NOT NULL REFERENCES ports(id),
      discharge_port_id INTEGER NOT NULL REFERENCES ports(id),
      confirmed_quantity TEXT NOT NULL,
      calculated_rate TEXT NOT NULL,
      total_freight TEXT NOT NULL,
      calculation_details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log("✅ 数据库表创建完成");
  console.log("🌱 正在插入种子数据...");

  // 1. 管理员账户
  const adminPassword = hashSync("admin123", 10);
  await db.insert(schema.users).values({
    openId: "admin-local-001",
    name: "系统管理员",
    username: "admin",
    email: "admin@freight.com",
    phone: "13800138000",
    passwordHash: adminPassword,
    loginMethod: "local",
    role: "admin",
    isActive: true,
  }).onConflictDoNothing().run();

  // 普通操作员
  const userPassword = hashSync("user123", 10);
  await db.insert(schema.users).values({
    openId: "user-local-001",
    name: "操作员张三",
    username: "operator",
    email: "operator@freight.com",
    phone: "13900139000",
    passwordHash: userPassword,
    loginMethod: "local",
    role: "user",
    isActive: true,
  }).onConflictDoNothing().run();

  console.log("  ✓ 用户数据");

  // 2. 船东数据
  const owners = [
    { name: "中远海运化工", code: "COSCO-CHEM", contact: "李经理", phone: "021-65966888", remark: "国内最大化工船运商" },
    { name: "太平洋海运", code: "PACIFIC-SHP", contact: "王总", phone: "0755-26810888", remark: "主营东南亚航线" },
    { name: "东方化工船务", code: "EAST-CHEM", contact: "赵船长", phone: "022-58851688", remark: "天津港主力船东" },
  ];

  for (const o of owners) {
    await db.insert(schema.shipOwners).values(o).onConflictDoNothing().run();
  }
  console.log("  ✓ 船东数据");

  // 3. 港口数据
  const portList = [
    { code: "CNSHA", nameCn: "上海港", nameEn: "Shanghai", country: "中国" },
    { code: "CNNBO", nameCn: "宁波港", nameEn: "Ningbo", country: "中国" },
    { code: "CNTSN", nameCn: "天津港", nameEn: "Tianjin", country: "中国" },
    { code: "CNQDG", nameCn: "青岛港", nameEn: "Qingdao", country: "中国" },
    { code: "CNDLC", nameCn: "大连港", nameEn: "Dalian", country: "中国" },
    { code: "SGSIN", nameCn: "新加坡港", nameEn: "Singapore", country: "新加坡" },
    { code: "KRPUS", nameCn: "釜山港", nameEn: "Busan", country: "韩国" },
    { code: "JPTYO", nameCn: "东京港", nameEn: "Tokyo", country: "日本" },
  ];

  for (const p of portList) {
    await db.insert(schema.ports).values(p).onConflictDoNothing().run();
  }
  console.log("  ✓ 港口数据");

  // 4. 费率表数据（含阶梯费率）
  const rateTablesData = [
    {
      ownerId: 1, loadPortId: 1, dischargePortId: 6,
      validFrom: "2026-01-01", validTo: "2026-12-31",
      steps: [
        { quantity: 3000, rate: 225 },
        { quantity: 4000, rate: 210 },
        { quantity: 5000, rate: 198 },
        { quantity: 6000, rate: 188 },
        { quantity: 7000, rate: 180 },
        { quantity: 8000, rate: 175 },
        { quantity: 9000, rate: 170 },
        { quantity: 10000, rate: 168 },
        { quantity: 11000, rate: 166 },
      ],
    },
    {
      ownerId: 1, loadPortId: 2, dischargePortId: 7,
      validFrom: "2026-01-01", validTo: "2026-12-31",
      steps: [
        { quantity: 2000, rate: 180 },
        { quantity: 3000, rate: 165 },
        { quantity: 4000, rate: 155 },
        { quantity: 5000, rate: 148 },
        { quantity: 6000, rate: 142 },
      ],
    },
    {
      ownerId: 2, loadPortId: 1, dischargePortId: 8,
      validFrom: "2026-01-01", validTo: "2026-12-31",
      steps: [
        { quantity: 2000, rate: 195 },
        { quantity: 3000, rate: 180 },
        { quantity: 4000, rate: 168 },
        { quantity: 5000, rate: 160 },
        { quantity: 6000, rate: 155 },
        { quantity: 7000, rate: 150 },
      ],
    },
    {
      ownerId: 3, loadPortId: 3, dischargePortId: 4,
      validFrom: "2026-01-01", validTo: "2026-12-31",
      steps: [
        { quantity: 1000, rate: 120 },
        { quantity: 2000, rate: 105 },
        { quantity: 3000, rate: 95 },
        { quantity: 4000, rate: 88 },
        { quantity: 5000, rate: 82 },
      ],
    },
  ];

  for (const rt of rateTablesData) {
    const result = await db.insert(schema.rateTables).values({
      ownerId: rt.ownerId,
      loadPortId: rt.loadPortId,
      dischargePortId: rt.dischargePortId,
      validFrom: rt.validFrom,
      validTo: rt.validTo,
      createdBy: 1,
    }).returning().get();

    for (const step of rt.steps) {
      await db.insert(schema.rateSteps).values({
        rateTableId: result.id,
        quantity: step.quantity,
        rate: step.rate,
      }).run();
    }
  }
  console.log("  ✓ 费率表数据 (含阶梯费率)");

  console.log("\n🎉 数据库初始化完成！");
  console.log("  管理员账号: admin / admin123");
  console.log("  操作员账号: operator / user123");

  client.close();
}

seed().catch(console.error);
