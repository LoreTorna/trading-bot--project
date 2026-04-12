/**
 * HeroFx Account Configuration
 * Account Demo: 923721
 * Server: HeroFx-Trade
 * Symbol: XAUUSD.r (con .r per maggiore precisione)
 */

export const HEROFX_CONFIG = {
  // Account Demo Credentials
  login: 923721,
  password: "Lt020507!",
  server: "HeroFx-Trade",
  
  // Trading Symbol
  symbol: "XAUUSD.r", // Gold trading pair with .r precision
  
  // Account Settings
  accountType: "demo",
  leverage: 100,
  
  // API Endpoints
  apiUrl: "https://api.herofx.com",
  wsUrl: "wss://ws.herofx.com",
  
  // Trading Parameters
  trading: {
    minLotSize: 0.01,
    maxLotSize: 100,
    defaultLotSize: 0.1,
    stopLossPoints: 20,
    takeProfitPoints: 40,
    maxOpenPositions: 5,
    maxDailyLoss: 100, // USD
  },
  
  // Backtesting Parameters
  backtesting: {
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    endDate: new Date(),
    timeframe: "H1", // 1 hour candles
    initialBalance: 10000,
    commission: 0.0001, // 0.01% commission
  },
  
  // Data Feed
  dataFeed: {
    provider: "herofx",
    updateInterval: 1000, // 1 second
    historyBars: 500,
  },
  
  // Notifications
  notifications: {
    email: true,
    telegram: false,
    discord: false,
  },
};

export type HeroFxConfig = typeof HEROFX_CONFIG;
