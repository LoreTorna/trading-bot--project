import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as botExecutor from "../services/bot-executor";

export const botControlRouter = router({
  setup: publicProcedure.mutation(async () => {
    return await botExecutor.runSetup();
  }),

  start: publicProcedure.mutation(async () => {
    return await botExecutor.startBot();
  }),

  stop: publicProcedure.mutation(async () => {
    return await botExecutor.stopBot();
  }),

  backtest: publicProcedure.mutation(async () => {
    return await botExecutor.runBacktest();
  }),

  status: publicProcedure.query(async () => {
    return await botExecutor.checkBotStatus();
  }),
});
