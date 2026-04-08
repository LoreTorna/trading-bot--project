import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import mysql from "mysql2/promise";

let db: any = null;

export async function getDb() {
  if (!db) {
    if (process.env.DATABASE_URL) {
      try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        db = drizzle(connection, { schema, mode: "default" });
      } catch (error) {
        console.error("[Database] Failed to connect to MySQL:", error);
        db = createMockDb();
      }
    } else {
      console.warn("[Database] DATABASE_URL not set, using mock database");
      db = createMockDb();
    }
  }
  return db;
}

// Simple mock database for development/sandbox
function createMockDb() {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve([]),
          }),
          limit: () => Promise.resolve([]),
        }),
        orderBy: () => ({
          limit: () => Promise.resolve([]),
        }),
        limit: () => Promise.resolve([]),
      }),
    }),
    insert: () => ({
      values: () => Promise.resolve({ insertId: 1 }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve({ affectedRows: 1 }),
      }),
    }),
    delete: () => ({
      where: () => Promise.resolve({ affectedRows: 1 }),
    }),
  };
}

// User queries
export async function getUserByOpenId(openId: string) {
  const database = await getDb();
  if (!database || !database.select) return null;
  try {
    const result = await database.select().from(schema.users).where(eq(schema.users.openId, openId));
    return result[0] || null;
  } catch (e) {
    return null;
  }
}

export async function createUser(user: schema.InsertUser) {
  const database = await getDb();
  if (!database || !database.insert) return null;
  try {
    await database.insert(schema.users).values(user);
    return getUserByOpenId(user.openId);
  } catch (e) {
    return null;
  }
}

// Bot config queries
export async function getBotConfig(userId: number) {
  const database = await getDb();
  if (!database || !database.select) return null;
  try {
    const result = await database.select().from(schema.botConfigs).where(eq(schema.botConfigs.userId, userId));
    return result[0] || null;
  } catch (e) {
    return null;
  }
}

export async function saveBotConfig(config: schema.InsertBotConfig) {
  const database = await getDb();
  if (!database) return null;
  try {
    const existing = await getBotConfig(config.userId as number);
    if (existing) {
      await database.update(schema.botConfigs).set(config).where(eq(schema.botConfigs.userId, config.userId as number));
    } else {
      await database.insert(schema.botConfigs).values(config);
    }
    return getBotConfig(config.userId as number);
  } catch (e) {
    return null;
  }
}

// Trade queries
export async function createTrade(trade: schema.InsertTrade) {
  const database = await getDb();
  if (!database || !database.insert) return null;
  try {
    const result = await database.insert(schema.trades).values(trade);
    return result;
  } catch (e) {
    return null;
  }
}

export async function getTrades(userId: number, limit: number = 100) {
  const database = await getDb();
  if (!database || !database.select) return [];
  try {
    return await database
      .select()
      .from(schema.trades)
      .where(eq(schema.trades.userId, userId))
      .orderBy(desc(schema.trades.createdAt))
      .limit(limit);
  } catch (e) {
    return [];
  }
}

export async function updateTrade(tradeId: number, updates: Partial<schema.Trade>) {
  const database = await getDb();
  if (!database || !database.update) return null;
  try {
    await database.update(schema.trades).set(updates).where(eq(schema.trades.id, tradeId));
    return database.select().from(schema.trades).where(eq(schema.trades.id, tradeId));
  } catch (e) {
    return null;
  }
}

export async function getTradeStats(userId: number, days: number = 30) {
  const database = await getDb();
  if (!database || !database.select) return null;
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trades = await database
      .select()
      .from(schema.trades)
      .where(
        and(
          eq(schema.trades.userId, userId),
          gte(schema.trades.createdAt, startDate),
          eq(schema.trades.status, "closed")
        )
      );

    const winningTrades = trades.filter((t: any) => t.pnl && t.pnl > 0);
    const losingTrades = trades.filter((t: any) => t.pnl && t.pnl < 0);
    const totalPnL = trades.reduce((sum: number, t: any) => sum + (Number(t.pnl) || 0), 0);

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      totalPnL,
      avgWin: winningTrades.length > 0 ? winningTrades.reduce((sum: number, t: any) => sum + (Number(t.pnl) || 0), 0) / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? losingTrades.reduce((sum: number, t: any) => sum + (Number(t.pnl) || 0), 0) / losingTrades.length : 0,
    };
  } catch (e) {
    return null;
  }
}

// Metrics queries
export async function saveDailyMetrics(metrics: schema.InsertDailyMetric) {
  const database = await getDb();
  if (!database || !database.insert) return null;
  try {
    const result = await database.insert(schema.dailyMetrics).values(metrics);
    return result;
  } catch (e) {
    return null;
  }
}

export async function getDailyMetrics(userId: number, days: number = 30) {
  const database = await getDb();
  if (!database || !database.select) return [];
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await database
      .select()
      .from(schema.dailyMetrics)
      .where(
        and(
          eq(schema.dailyMetrics.userId, userId),
          gte(schema.dailyMetrics.date, startDate)
        )
      )
      .orderBy(desc(schema.dailyMetrics.date));
  } catch (e) {
    return [];
  }
}

// Backtest queries
export async function saveBacktestResult(result: schema.InsertBacktestResult) {
  const database = await getDb();
  if (!database || !database.insert) return null;
  try {
    await database.insert(schema.backtestResults).values(result);
    return result;
  } catch (e) {
    return null;
  }
}

export async function getBacktestResults(userId: number) {
  const database = await getDb();
  if (!database || !database.select) return [];
  try {
    return await database
      .select()
      .from(schema.backtestResults)
      .where(eq(schema.backtestResults.userId, userId))
      .orderBy(desc(schema.backtestResults.createdAt));
  } catch (e) {
    return [];
  }
}

// Notification queries
export async function createNotification(notification: schema.InsertNotification) {
  const database = await getDb();
  if (!database || !database.insert) return null;
  try {
    await database.insert(schema.notifications).values(notification);
    return notification;
  } catch (e) {
    return null;
  }
}

export async function getNotifications(userId: number, limit: number = 50) {
  const database = await getDb();
  if (!database || !database.select) return [];
  try {
    return await database
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit);
  } catch (e) {
    return [];
  }
}

export async function markNotificationAsRead(notificationId: number) {
  const database = await getDb();
  if (!database || !database.update) return null;
  try {
    await database
      .update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.id, notificationId));
  } catch (e) {
    // ignore
  }
}

// Activity log queries
export async function logActivity(log: schema.InsertActivityLog) {
  const database = await getDb();
  if (!database || !database.insert) return null;
  try {
    await database.insert(schema.activityLogs).values(log);
  } catch (e) {
    // ignore
  }
}

export async function getActivityLogs(userId: number, limit: number = 100) {
  const database = await getDb();
  if (!database || !database.select) return [];
  try {
    return await database
      .select()
      .from(schema.activityLogs)
      .where(eq(schema.activityLogs.userId, userId))
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(limit);
  } catch (e) {
    return [];
  }
}
