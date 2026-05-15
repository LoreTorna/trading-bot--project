import {
  DEFAULT_BACKTEST_SYMBOLS,
  DEFAULT_LIVE_SYMBOLS,
  SYMBOL_PROFILES,
  normalizeSymbolList,
} from "../../shared/trading";
import {
  readRuntimeEnv,
  readRuntimeList,
  readRuntimeNumber,
} from "./runtime-env";

export const HEROFX_CONFIG = {
  login: readRuntimeNumber("HEROFX_LOGIN", 923721),
  password: readRuntimeEnv("HEROFX_PASSWORD", ""),
  server: readRuntimeEnv("HEROFX_SERVER", "HeroFx-Trade"),
  defaultSymbol: normalizeSymbolList(
    [readRuntimeEnv("HEROFX_SYMBOL", DEFAULT_LIVE_SYMBOLS[0])],
    DEFAULT_LIVE_SYMBOLS
  )[0],
  supportedSymbols: Object.keys(SYMBOL_PROFILES),
  defaultLiveSymbols: normalizeSymbolList(
    readRuntimeList("BOT_SYMBOLS", DEFAULT_LIVE_SYMBOLS),
    DEFAULT_LIVE_SYMBOLS
  ),
  defaultBacktestSymbols: normalizeSymbolList(
    readRuntimeList("BACKTEST_SYMBOLS", DEFAULT_BACKTEST_SYMBOLS),
    DEFAULT_BACKTEST_SYMBOLS
  ),
  symbolProfiles: SYMBOL_PROFILES,
  accountType: "demo",
  leverage: 100,
  apiUrl: "https://api.herofx.com",
  wsUrl: "wss://ws.herofx.com",
  trading: {
    minLotSize: 0.01,
    maxLotSize: 100,
    maxOpenPositions: readRuntimeNumber("MAX_OPEN_POSITIONS", 3),
    maxDailyLoss: readRuntimeNumber("MAX_DAILY_LOSS", 100),
    livePollingSeconds: readRuntimeNumber("BOT_POLL_SECONDS", 3),
  },
  backtesting: {
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    timeframe: "H1",
    initialBalance: readRuntimeNumber("BACKTEST_INITIAL_CAPITAL", 10000),
    defaultYears: readRuntimeNumber("BACKTEST_YEARS", 2),
    commission: 0.0001,
  },
  dataFeed: {
    provider: "herofx",
    updateInterval: 1000,
    historyBars: 500,
  },
  notifications: {
    email: true,
    telegram: false,
    discord: false,
  },
};

export type HeroFxConfig = typeof HEROFX_CONFIG;
