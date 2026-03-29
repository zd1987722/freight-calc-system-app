import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";
import path from "path";
import fs from "fs";

const isVercel = process.env.VERCEL === "1";
const dataDir = isVercel ? "/tmp/data" : path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "freight.db");
const client = createClient({ 
  url: process.env.DATABASE_URL || `file:${dbPath}`,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

export const db = drizzle(client, { schema });
export { schema };
