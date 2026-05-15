export type TradingSymbol = "XAUUSD.r" | "BTCUSD.r";

export interface TradingSymbolProfile {
  symbol: TradingSymbol;
  label: string;
  market: "metal" | "crypto";
  description: string;
  weekendTrading: boolean;
  tradingHoursLabel: string;
  defaultLotSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  pricePrecision: number;
  simulationStartPrice: number;
}

export const SYMBOL_PROFILES: Record<TradingSymbol, TradingSymbolProfile> = {
  "XAUUSD.r": {
    symbol: "XAUUSD.r",
    label: "Gold",
    market: "metal",
    description: "Metallo spot con operativita feriale H23.",
    weekendTrading: false,
    tradingHoursLabel: "H23 / 5 giorni",
    defaultLotSize: 0.1,
    stopLossPercent: 0.18,
    takeProfitPercent: 0.34,
    pricePrecision: 2,
    simulationStartPrice: 2330.5,
  },
  "BTCUSD.r": {
    symbol: "BTCUSD.r",
    label: "Bitcoin",
    market: "crypto",
    description: "Asset crypto sempre attivo, incluso il weekend.",
    weekendTrading: true,
    tradingHoursLabel: "H24 / 7 giorni",
    defaultLotSize: 0.03,
    stopLossPercent: 0.55,
    takeProfitPercent: 0.95,
    pricePrecision: 2,
    simulationStartPrice: 65000,
  },
};

export const SUPPORTED_SYMBOLS = Object.keys(
  SYMBOL_PROFILES
) as TradingSymbol[];

export const DEFAULT_LIVE_SYMBOLS: TradingSymbol[] = ["XAUUSD.r"];
export const DEFAULT_BACKTEST_SYMBOLS: TradingSymbol[] = [
  "XAUUSD.r",
  "BTCUSD.r",
];

export function isSupportedSymbol(value: string): value is TradingSymbol {
  return value in SYMBOL_PROFILES;
}

export function normalizeSymbolList(
  values: readonly string[] | null | undefined,
  fallback: readonly TradingSymbol[] = DEFAULT_LIVE_SYMBOLS
): TradingSymbol[] {
  const normalized: TradingSymbol[] = [];
  const seen = new Set<TradingSymbol>();

  for (const value of values ?? []) {
    if (!isSupportedSymbol(value) || seen.has(value)) {
      continue;
    }

    seen.add(value);
    normalized.push(value);
  }

  return normalized.length > 0 ? normalized : [...fallback];
}

export function getSymbolProfile(symbol: string): TradingSymbolProfile {
  const normalized = isSupportedSymbol(symbol)
    ? symbol
    : DEFAULT_LIVE_SYMBOLS[0];

  return SYMBOL_PROFILES[normalized];
}

export function isSymbolTradingNow(
  symbol: string,
  referenceDate: Date = new Date()
): boolean {
  const profile = getSymbolProfile(symbol);

  if (profile.weekendTrading) {
    return true;
  }

  const weekday = referenceDate.getDay();
  return weekday >= 1 && weekday <= 5;
}
