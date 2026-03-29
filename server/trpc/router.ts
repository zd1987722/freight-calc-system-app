import { router } from "./trpc.js";
import { authRouter, profileRouter } from "./routers/auth.js";
import { ownerRouter } from "./routers/owner.js";
import { portRouter } from "./routers/port.js";
import { rateTableRouter } from "./routers/rateTable.js";
import { calculateRouter } from "./routers/calculator.js";
import { userAdminRouter } from "./routers/userAdmin.js";

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  owner: ownerRouter,
  port: portRouter,
  rateTable: rateTableRouter,
  calculate: calculateRouter,
  userAdmin: userAdminRouter,
});

export type AppRouter = typeof appRouter;
