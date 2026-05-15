import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getBotExecutor } from "../services/bot-executor";

const symbolsInput = z.array(z.string()).min(1).optional();

export const botControlRouter = router({
  setup: publicProcedure.mutation(async () => {
    const executor = getBotExecutor();
    return await executor.runSetup();
  }),

  start: publicProcedure
    .input(
      z
        .object({
          symbols: symbolsInput,
        })
        .optional()
    )
    .mutation(async ({ input }) => {
      const executor = getBotExecutor();
      return await executor.startBot({ symbols: input?.symbols });
    }),

  stop: publicProcedure.mutation(async () => {
    const executor = getBotExecutor();
    return await executor.stopBot();
  }),

  backtest: publicProcedure
    .input(
      z
        .object({
          symbols: symbolsInput,
          years: z.number().int().min(1).max(10).optional(),
          capital: z.number().positive().optional(),
        })
        .optional()
    )
    .mutation(async ({ input }) => {
      const executor = getBotExecutor();
      return await executor.runBacktest({
        symbols: input?.symbols,
        years: input?.years,
        capital: input?.capital,
      });
    }),

  dashboard: publicProcedure.mutation(async () => {
    const executor = getBotExecutor();
    return await executor.startDashboard();
  }),

  status: publicProcedure.query(async () => {
    const executor = getBotExecutor();
    const repositoryPath = executor.getRepositoryPath();
    const repositoryExists = executor.repositoryExists();
    const files = executor.getRepositoryFiles();
    const botStatus = executor.getStatus();
    const runtime = executor.getRuntimeDiagnostics();

    return {
      success: true,
      running: botStatus.running,
      uptime: botStatus.uptime,
      activeSymbols: botStatus.activeSymbols,
      runtime,
      repositoryPath,
      repositoryExists,
      filesCount: files.length,
      files: files.slice(0, 12),
      message: repositoryExists
        ? `Repository trovato: ${repositoryPath}`
        : `Repository non trovato: ${repositoryPath}`,
    };
  }),

  getRepositoryPath: publicProcedure.query(async () => {
    const executor = getBotExecutor();
    return {
      path: executor.getRepositoryPath(),
      exists: executor.repositoryExists(),
    };
  }),
});

export type BotControlRouter = typeof botControlRouter;
