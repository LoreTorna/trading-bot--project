import { router } from "./_core/trpc";
import { databaseRouter } from "./routers/database";
import { exportRouter } from "./routers/export";
import { backtestRouter } from "./routers/backtest";

export const appRouter = router({
  database: databaseRouter,
  export: exportRouter,
  backtest: backtestRouter,
});

export type AppRouter = typeof appRouter;
