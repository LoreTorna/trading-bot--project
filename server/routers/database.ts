import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import type { InsertTrade, InsertBotConfig, InsertDailyMetric } from "../../drizzle/schema";

export const databaseRouter = router({
  // Metrics procedures
  getMetrics: publicProcedure
    .input(z.object({ userId: z.number(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await db.getDailyMetrics(input.userId, input.days);
    }),

  // Trade procedures
  saveTrade: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        symbol: z.string(),
        type: z.enum(["BUY", "SELL"]),
        entryPrice: z.number(),
        quantity: z.number(),
        stopLoss: z.number().optional(),
        takeProfit: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const trade: InsertTrade = {
        userId: input.userId,
        symbol: input.symbol,
        type: input.type,
        entryPrice: input.entryPrice as any,
        quantity: input.quantity as any,
        status: "open",
        entryTime: new Date(),
        stopLoss: input.stopLoss as any,
        takeProfit: input.takeProfit as any,
      };
      return await db.createTrade(trade);
    }),

  getTrades: publicProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(100) }))
    .query(async ({ input }) => {
      return await db.getTrades(input.userId, input.limit);
    }),

  getTradeStats: publicProcedure
    .input(z.object({ userId: z.number(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await db.getTradeStats(input.userId, input.days);
    }),

  // Notifications procedures
  getNotifications: publicProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return await db.getNotifications(input.userId, input.limit);
    }),

  markNotificationAsRead: publicProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      return await db.markNotificationAsRead(input.notificationId);
    }),

  // Bot config procedures
  getBotConfig: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.getBotConfig(input.userId);
    }),

  saveBotConfig: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        brokerType: z.string(),
        apiKey: z.string(),
        apiSecret: z.string(),
        telegramBotToken: z.string().optional(),
        telegramChatId: z.string().optional(),
        emailNotifications: z.boolean().default(true),
        maxDailyLoss: z.number().default(1000),
        maxPositionSize: z.number().default(5000),
        riskPerTrade: z.number().default(2),
      })
    )
    .mutation(async ({ input }) => {
      const config: InsertBotConfig = {
        userId: input.userId,
        brokerType: input.brokerType,
        apiKey: input.apiKey,
        apiSecret: input.apiSecret,
        telegramBotToken: input.telegramBotToken,
        telegramChatId: input.telegramChatId,
        emailNotifications: input.emailNotifications,
        maxDailyLoss: input.maxDailyLoss as any,
        maxPositionSize: input.maxPositionSize as any,
        riskPerTrade: input.riskPerTrade as any,
        isActive: false,
      };
      return await db.saveBotConfig(config);
    }),

  // Backtest procedures
  getBacktestResults: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.getBacktestResults(input.userId);
    }),

  // Activity log procedures
  getActivityLogs: publicProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(100) }))
    .query(async ({ input }) => {
      return await db.getActivityLogs(input.userId, input.limit);
    }),
});
