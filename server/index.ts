import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./trpc/router.js";
import { createContext } from "./trpc/context.js";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// tRPC 路由
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// 生产环境：提供前端静态文件
const clientDist = path.resolve(process.cwd(), "dist/client");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📡 tRPC 接口地址: http://localhost:${PORT}/trpc`);
});

export default app;
