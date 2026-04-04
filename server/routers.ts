import { router } from "./_core/trpc";
import { databaseRouter } from "./routers/database";
import { exportRouter } from "./routers/export";
import { backtestRouter } from "./routers/backtest";
import { botControlRouter } from "./routers/bot-control";

export const appRouter = router({
  database: databaseRouter,
  export: exportRouter,
  backtest: backtestRouter,
  bot: botControlRouter,
});

export type AppRouter = typeof appRouter;
