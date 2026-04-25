export interface BotStatus {
  running: boolean;
  uptime: string;
  tradesCount: number;
  portfolioValue: number;
  totalReturn: number;
  winRate: number;
}

export interface BotMetrics {
  portfolioValue: number;
  balance?: number;
  equity?: number;
  margin?: number;
  freeMargin?: number;
  totalReturn: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  trades: number;
  timestamp: string;
}

export interface BotTrade {
  id: number | string;
  symbol: string;
  type: string;
  price: number;
  quantity: number;
  profit?: number;
  pnl?: number;
  time: string | Date;
  status: string;
}

export interface PerformancePoint {
  label: string;
  value: number;
  return: number;
}

export interface DailyPnlPoint {
  label: string;
  pnl: number;
  trades: number;
}

function formatLabel(value: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
  }).format(value);
}

function parseTradeDate(value: string | Date): Date {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function getTradeProfit(trade: BotTrade): number {
  const rawValue = trade.profit ?? trade.pnl ?? 0;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeTrade(trade: BotTrade): BotTrade {
  return {
    ...trade,
    price: Number(trade.price ?? 0),
    quantity: Number(trade.quantity ?? 0),
    profit: getTradeProfit(trade),
    pnl: getTradeProfit(trade),
    status: trade.status ?? "closed",
    time: trade.time ?? new Date().toISOString(),
  };
}

export function normalizeTrades(trades: BotTrade[] = []): BotTrade[] {
  return trades
    .map(normalizeTrade)
    .sort(
      (left, right) =>
        parseTradeDate(right.time).getTime() - parseTradeDate(left.time).getTime()
    );
}

export function buildPerformanceSeries(
  trades: BotTrade[] = [],
  metrics?: BotMetrics | null
): PerformancePoint[] {
  const normalizedTrades = normalizeTrades(trades).slice().reverse();
  const totalProfit = normalizedTrades.reduce(
    (accumulator, trade) => accumulator + getTradeProfit(trade),
    0
  );

  const baseCapital =
    metrics?.balance ??
    (metrics?.portfolioValue ? metrics.portfolioValue - totalProfit : 10000);

  if (normalizedTrades.length === 0) {
    return [
      {
        label: formatLabel(new Date()),
        value: Number(baseCapital.toFixed(2)),
        return: Number(metrics?.totalReturn?.toFixed(2) ?? 0),
      },
    ];
  }

  let cumulativeProfit = 0;

  return normalizedTrades.map((trade) => {
    cumulativeProfit += getTradeProfit(trade);
    const value = baseCapital + cumulativeProfit;
    const tradeReturn = baseCapital === 0 ? 0 : (cumulativeProfit / baseCapital) * 100;

    return {
      label: formatLabel(parseTradeDate(trade.time)),
      value: Number(value.toFixed(2)),
      return: Number(tradeReturn.toFixed(2)),
    };
  });
}

export function buildDailyPnlSeries(trades: BotTrade[] = []): DailyPnlPoint[] {
  const normalizedTrades = normalizeTrades(trades).slice().reverse();
  const grouped = new Map<string, DailyPnlPoint>();

  for (const trade of normalizedTrades) {
    const date = parseTradeDate(trade.time);
    const key = date.toISOString().slice(0, 10);
    const current = grouped.get(key) ?? {
      label: formatLabel(date),
      pnl: 0,
      trades: 0,
    };

    current.pnl += getTradeProfit(trade);
    current.trades += 1;
    grouped.set(key, current);
  }

  return Array.from(grouped.values())
    .map((entry) => ({
      ...entry,
      pnl: Number(entry.pnl.toFixed(2)),
    }))
    .slice(-10);
}

export function summarizeTrades(trades: BotTrade[] = []) {
  const normalizedTrades = normalizeTrades(trades);
  const profits = normalizedTrades.map(getTradeProfit);
  const totalTrades = profits.length;
  const totalProfit = profits.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );
  const winningTrades = profits.filter((value) => value > 0);
  const losingTrades = profits.filter((value) => value < 0);
  const avgTrade = totalTrades === 0 ? 0 : totalProfit / totalTrades;
  const avgWin =
    winningTrades.length === 0
      ? 0
      : winningTrades.reduce((accumulator, value) => accumulator + value, 0) /
        winningTrades.length;
  const avgLoss =
    losingTrades.length === 0
      ? 0
      : losingTrades.reduce((accumulator, value) => accumulator + value, 0) /
        losingTrades.length;
  const grossProfit = winningTrades.reduce(
    (accumulator, value) => accumulator + value,
    0
  );
  const grossLoss = losingTrades.reduce(
    (accumulator, value) => accumulator + Math.abs(value),
    0
  );

  let cumulativeProfit = 0;
  let peak = 0;
  let maxDrawdown = 0;

  for (const profit of profits.slice().reverse()) {
    cumulativeProfit += profit;
    peak = Math.max(peak, cumulativeProfit);
    maxDrawdown = Math.min(maxDrawdown, cumulativeProfit - peak);
  }

  return {
    totalTrades,
    totalProfit: Number(totalProfit.toFixed(2)),
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    avgTrade: Number(avgTrade.toFixed(2)),
    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    profitFactor: grossLoss === 0 ? grossProfit : grossProfit / grossLoss,
    riskReward: avgLoss === 0 ? avgWin : Math.abs(avgWin / avgLoss),
    winRate:
      totalTrades === 0 ? 0 : (winningTrades.length / totalTrades) * 100,
    maxDrawdown: Number(Math.abs(maxDrawdown).toFixed(2)),
  };
}
