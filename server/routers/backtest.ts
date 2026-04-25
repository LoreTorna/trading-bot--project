import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as backtestService from "../services/backtesting";
import { broadcastBacktestComplete } from "../_core/websocket";

export const backtestRouter = router({
  runBacktest: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        symbol: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        initialCapital: z.number(),
        strategyName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const defaultParams = {
        rsiPeriod: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        macdFastPeriod: 12,
        macdSlowPeriod: 26,
        macdSignalPeriod: 9,
        stopLossPercent: 2,
        takeProfitPercent: 3,
      };

      const result = await backtestService.runBacktest(input.symbol, input.startDate, input.endDate, input.initialCapital, defaultParams);

      await backtestService.saveBacktestResult(input.userId, input.strategyName, input.startDate, input.endDate, input.initialCapital, result);

      // Broadcast completion via WebSocket so the dashboard updates in real-time
      broadcastBacktestComplete({ ...result, symbol: input.symbol, strategyName: input.strategyName });

      return result;
    }),

  optimizeStrategy: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        symbol: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        initialCapital: z.number(),
        strategyName: z.string(),
        trials: z.number().default(50),
      })
    )
    .mutation(async ({ input }) => {
      const { bestParams, bestResult } = await backtestService.optimizeStrategy(input.symbol, input.startDate, input.endDate, input.initialCapital, input.trials);

      await backtestService.saveBacktestResult(input.userId, `${input.strategyName} (Optimized)`, input.startDate, input.endDate, input.initialCapital, bestResult);

      // Broadcast optimization complete via WebSocket
      broadcastBacktestComplete({ ...bestResult, symbol: input.symbol, strategyName: `${input.strategyName} (Optimized)`, bestParams });

      return {
        bestParams,
        bestResult,
        message: `Optimization complete. Best Sharpe Ratio: ${bestResult.sharpeRatio.toFixed(2)}`,
      };
    }),

  getBacktestResults: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await backtestService.saveBacktestResult(input.userId, "", new Date(), new Date(), 0, {
        totalReturn: 0,
        annualReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        profitFactor: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        avgWin: 0,
        avgLoss: 0,
      });
    }),
});
