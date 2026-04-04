import {
  int,
  varchar,
  text,
  decimal,
  datetime,
  boolean,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// Users table
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  createdAt: datetime("createdAt").notNull().default(new Date()),
  updatedAt: datetime("updatedAt").notNull().default(new Date()),
});

// Bot configurations table
export const botConfigs = mysqlTable("bot_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  brokerType: varchar("brokerType", { length: 50 }).notNull(),
  apiKey: text("apiKey").notNull(),
  apiSecret: text("apiSecret").notNull(),
  telegramBotToken: text("telegramBotToken"),
  telegramChatId: varchar("telegramChatId", { length: 255 }),
  emailNotifications: boolean("emailNotifications").default(true),
  maxDailyLoss: decimal("maxDailyLoss", { precision: 10, scale: 2 }).default("1000"),
  maxPositionSize: decimal("maxPositionSize", { precision: 10, scale: 2 }).default("5000"),
  riskPerTrade: decimal("riskPerTrade", { precision: 5, scale: 2 }).default("2"),
  isActive: boolean("isActive").default(false),
  createdAt: datetime("createdAt").notNull().default(new Date()),
  updatedAt: datetime("updatedAt").notNull().default(new Date()),
}, (table: any) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
}));

// Trades table
export const trades = mysqlTable("trades", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  type: mysqlEnum("type", ["BUY", "SELL"]).notNull(),
  entryPrice: decimal("entryPrice", { precision: 10, scale: 2 }).notNull(),
  exitPrice: decimal("exitPrice", { precision: 10, scale: 2 }),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  pnl: decimal("pnl", { precision: 12, scale: 2 }),
  pnlPercent: decimal("pnlPercent", { precision: 8, scale: 4 }),
  status: mysqlEnum("status", ["open", "closed", "cancelled"]).default("open").notNull(),
  entryTime: datetime("entryTime").notNull(),
  exitTime: datetime("exitTime"),
  stopLoss: decimal("stopLoss", { precision: 10, scale: 2 }),
  takeProfit: decimal("takeProfit", { precision: 10, scale: 2 }),
  commission: decimal("commission", { precision: 10, scale: 4 }).default("0"),
  notes: text("notes"),
  createdAt: datetime("createdAt").notNull().default(new Date()),
  updatedAt: datetime("updatedAt").notNull().default(new Date()),
}, (table: any) => ({
  userIdIdx: index("trades_user_id_idx").on(table.userId),
  symbolIdx: index("trades_symbol_idx").on(table.symbol),
  statusIdx: index("trades_status_idx").on(table.status),
}));

// Daily metrics table
export const dailyMetrics = mysqlTable("daily_metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: datetime("date").notNull(),
  portfolioValue: decimal("portfolioValue", { precision: 15, scale: 2 }).notNull(),
  totalReturn: decimal("totalReturn", { precision: 10, scale: 4 }).notNull(),
  dailyPnL: decimal("dailyPnL", { precision: 12, scale: 2 }).notNull(),
  winRate: decimal("winRate", { precision: 5, scale: 2 }).notNull(),
  sharpeRatio: decimal("sharpeRatio", { precision: 8, scale: 4 }),
  maxDrawdown: decimal("maxDrawdown", { precision: 8, scale: 4 }),
  tradesCount: int("tradesCount").default(0),
  winningTrades: int("winningTrades").default(0),
  losingTrades: int("losingTrades").default(0),
  profitFactor: decimal("profitFactor", { precision: 8, scale: 4 }),
  createdAt: datetime("createdAt").notNull().default(new Date()),
}, (table: any) => ({
  userIdIdx: index("metrics_user_id_idx").on(table.userId),
  dateIdx: index("metrics_date_idx").on(table.date),
  userDateIdx: uniqueIndex("metrics_user_date_idx").on(table.userId, table.date),
}));

// Backtest results table
export const backtestResults = mysqlTable("backtest_results", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  strategyName: varchar("strategyName", { length: 255 }).notNull(),
  startDate: datetime("startDate").notNull(),
  endDate: datetime("endDate").notNull(),
  initialCapital: decimal("initialCapital", { precision: 15, scale: 2 }).notNull(),
  finalCapital: decimal("finalCapital", { precision: 15, scale: 2 }).notNull(),
  totalReturn: decimal("totalReturn", { precision: 10, scale: 4 }).notNull(),
  annualReturn: decimal("annualReturn", { precision: 10, scale: 4 }),
  sharpeRatio: decimal("sharpeRatio", { precision: 8, scale: 4 }),
  maxDrawdown: decimal("maxDrawdown", { precision: 8, scale: 4 }),
  winRate: decimal("winRate", { precision: 5, scale: 2 }),
  profitFactor: decimal("profitFactor", { precision: 8, scale: 4 }),
  totalTrades: int("totalTrades").default(0),
  winningTrades: int("winningTrades").default(0),
  losingTrades: int("losingTrades").default(0),
  avgWin: decimal("avgWin", { precision: 12, scale: 2 }),
  avgLoss: decimal("avgLoss", { precision: 12, scale: 2 }),
  report: text("report"),
  createdAt: datetime("createdAt").notNull().default(new Date()),
}, (table: any) => ({
  userIdIdx: index("backtest_user_id_idx").on(table.userId),
}));

// Notifications table
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["trade", "error", "milestone", "alert", "info"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: datetime("createdAt").notNull().default(new Date()),
}, (table: any) => ({
  userIdIdx: index("notifications_user_id_idx").on(table.userId),
  isReadIdx: index("notifications_is_read_idx").on(table.isRead),
}));

// Activity logs table
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  description: text("description"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: datetime("createdAt").notNull().default(new Date()),
}, (table: any) => ({
  userIdIdx: index("logs_user_id_idx").on(table.userId),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type BotConfig = typeof botConfigs.$inferSelect;
export type InsertBotConfig = typeof botConfigs.$inferInsert;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

export type DailyMetric = typeof dailyMetrics.$inferSelect;
export type InsertDailyMetric = typeof dailyMetrics.$inferInsert;

export type BacktestResult = typeof backtestResults.$inferSelect;
export type InsertBacktestResult = typeof backtestResults.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
