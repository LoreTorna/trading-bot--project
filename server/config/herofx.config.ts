import { readRuntimeEnv, readRuntimeNumber } from "./runtime-env";

export const HEROFX_CONFIG = {
  login: readRuntimeNumber("HEROFX_LOGIN", 923721),
  password: readRuntimeEnv("HEROFX_PASSWORD", ""),
  server: readRuntimeEnv("HEROFX_SERVER", "HeroFx-Trade"),
  symbol: readRuntimeEnv("HEROFX_SYMBOL", "XAUUSD.r"),
  accountType: readRuntimeEnv("HEROFX_ACCOUNT_TYPE", "demo"),
  leverage: readRuntimeNumber("HEROFX_LEVERAGE", 100),
  apiUrl: readRuntimeEnv("HEROFX_API_URL", "https://api.herofx.com"),
  wsUrl: readRuntimeEnv("HEROFX_WS_URL", "wss://ws.herofx.com"),
  trading: {
    minLotSize: readRuntimeNumber("HEROFX_MIN_LOT_SIZE", 0.01),
    maxLotSize: readRuntimeNumber("HEROFX_MAX_LOT_SIZE", 100),
    defaultLotSize: readRuntimeNumber("DEFAULT_LOT", 0.1),
    stopLossPoints: readRuntimeNumber("STOP_LOSS_POINTS", 20),
    takeProfitPoints: readRuntimeNumber("TAKE_PROFIT_POINTS", 40),
    maxOpenPositions: readRuntimeNumber("MAX_OPEN_POSITIONS", 5),
    maxDailyLoss: readRuntimeNumber("MAX_DAILY_LOSS", 100),
    tradingHours: readRuntimeEnv("TRADING_HOURS", "H23"),
    tradingDays: readRuntimeEnv("TRADING_DAYS", "5/7"),
  },
  backtesting: {
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    timeframe: readRuntimeEnv("BACKTEST_TIMEFRAME", "H1"),
    initialBalance: readRuntimeNumber("BACKTEST_INITIAL_BALANCE", 10000),
    commission: readRuntimeNumber("BACKTEST_COMMISSION", 0.0001),
  },
  dataFeed: {
    provider: readRuntimeEnv("DATA_FEED_PROVIDER", "herofx"),
    updateInterval: readRuntimeNumber("DATA_FEED_UPDATE_INTERVAL", 1000),
    historyBars: readRuntimeNumber("DATA_FEED_HISTORY_BARS", 500),
  },
  notifications: {
    email: readRuntimeEnv("NOTIFY_EMAIL", "true") === "true",
    telegram: readRuntimeEnv("NOTIFY_TELEGRAM", "false") === "true",
    discord: readRuntimeEnv("NOTIFY_DISCORD", "false") === "true",
  },
};

export type HeroFxConfig = typeof HEROFX_CONFIG;
