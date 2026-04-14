import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getBotExecutor } from "../services/bot-executor";

export const botControlRouter = router({
  /**
   * Esegui il setup del bot
   */
  setup: publicProcedure.mutation(async () => {
    const executor = getBotExecutor();
    return await executor.runSetup();
  }),

  /**
   * Avvia il bot di trading
   */
  start: publicProcedure.mutation(async () => {
    const executor = getBotExecutor();
    return await executor.startBot();
  }),

  /**
   * Ferma il bot di trading
   */
  stop: publicProcedure.mutation(async () => {
    const executor = getBotExecutor();
    return await executor.stopBot();
  }),

  /**
   * Esegui il backtesting
   */
  backtest: publicProcedure.mutation(async () => {
    const executor = getBotExecutor();
    return await executor.runBacktest();
  }),

  /**
   * Avvia la dashboard
   */
  dashboard: publicProcedure.mutation(async () => {
    const executor = getBotExecutor();
    return await executor.startDashboard();
  }),

  /**
   * Ottieni lo stato del bot
   */
  status: publicProcedure.query(async () => {
    const executor = getBotExecutor();
    const repositoryPath = executor.getRepositoryPath();
    const repositoryExists = executor.repositoryExists();
    const files = executor.getRepositoryFiles();
    const botStatus = executor.getStatus();

    return {
      success: true,
      running: botStatus.running,
      uptime: botStatus.uptime,
      repositoryPath,
      repositoryExists,
      filesCount: files.length,
      files: files.slice(0, 10), // Primi 10 file
      message: repositoryExists
        ? `✅ Repository trovato: ${repositoryPath}`
        : `❌ Repository non trovato: ${repositoryPath}`,
    };
  }),

  /**
   * Ottieni il percorso del repository
   */
  getRepositoryPath: publicProcedure.query(async () => {
    const executor = getBotExecutor();
    return {
      path: executor.getRepositoryPath(),
      exists: executor.repositoryExists(),
    };
  }),
});

export type BotControlRouter = typeof botControlRouter;
