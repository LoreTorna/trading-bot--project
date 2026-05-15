import * as db from "../db";
import type { InsertBacktestResult } from "../../drizzle/schema";

export interface BacktestParams {
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  macdFastPeriod: number;
  macdSlowPeriod: number;
  macdSignalPeriod: number;
  stopLossPercent: number;
  takeProfitPercent: number;
}

export interface BacktestResult {
  totalReturn: number;
  annualReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
}

// Simulated backtest function - in production, connect to real market data
export async function runBacktest(
  symbol: string,
  startDate: Date,
  endDate: Date,
  initialCapital: number,
  params: BacktestParams
): Promise<BacktestResult> {
  // Simulate backtest results
  const totalTrades = Math.floor(Math.random() * 100) + 20;
  const winningTrades = Math.floor(totalTrades * 0.55);
  const losingTrades = totalTrades - winningTrades;

  const avgWin = 150 + Math.random() * 100;
  const avgLoss = -100 - Math.random() * 50;

  const totalPnL = winningTrades * avgWin + losingTrades * avgLoss;
  const finalCapital = initialCapital + totalPnL;
  const totalReturn = (totalPnL / initialCapital) * 100;

  // Calculate Sharpe Ratio (simplified)
  const dailyReturns = Array.from({ length: Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) }, () => (Math.random() - 0.5) * 2);
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

  // Calculate Max Drawdown (simplified)
  let peak = initialCapital;
  let maxDrawdown = 0;
  let currentCapital = initialCapital;

  for (let i = 0; i < totalTrades; i++) {
    const tradeReturn = Math.random() > 0.55 ? avgWin : avgLoss;
    currentCapital += tradeReturn;
    if (currentCapital > peak) {
      peak = currentCapital;
    }
    const drawdown = ((peak - currentCapital) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  const profitFactor = Math.abs((winningTrades * avgWin) / (losingTrades * avgLoss));

  return {
    totalReturn,
    annualReturn: totalReturn * (365 / Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))),
    sharpeRatio,
    maxDrawdown,
    winRate: (winningTrades / totalTrades) * 100,
    profitFactor,
    totalTrades,
    winningTrades,
    losingTrades,
    avgWin,
    avgLoss,
  };
}

// Optimize strategy parameters using grid search (simplified Optuna alternative)
export async function optimizeStrategy(
  symbol: string,
  startDate: Date,
  endDate: Date,
  initialCapital: number,
  trials: number = 50
): Promise<{ bestParams: BacktestParams; bestResult: BacktestResult }> {
  let bestResult: BacktestResult | null = null;
  let bestParams: BacktestParams | null = null;
  let bestScore = -Infinity;

  const paramRanges = {
    rsiPeriod: [10, 14, 21],
    rsiOverbought: [65, 70, 75],
    rsiOversold: [25, 30, 35],
    macdFastPeriod: [8, 12, 16],
    macdSlowPeriod: [17, 26, 35],
    macdSignalPeriod: [7, 9, 11],
    stopLossPercent: [1, 2, 3],
    takeProfitPercent: [2, 3, 4],
  };

  for (let i = 0; i < trials; i++) {
    const params: BacktestParams = {
      rsiPeriod: paramRanges.rsiPeriod[Math.floor(Math.random() * paramRanges.rsiPeriod.length)],
      rsiOverbought: paramRanges.rsiOverbought[Math.floor(Math.random() * paramRanges.rsiOverbought.length)],
      rsiOversold: paramRanges.rsiOversold[Math.floor(Math.random() * paramRanges.rsiOversold.length)],
      macdFastPeriod: paramRanges.macdFastPeriod[Math.floor(Math.random() * paramRanges.macdFastPeriod.length)],
      macdSlowPeriod: paramRanges.macdSlowPeriod[Math.floor(Math.random() * paramRanges.macdSlowPeriod.length)],
      macdSignalPeriod: paramRanges.macdSignalPeriod[Math.floor(Math.random() * paramRanges.macdSignalPeriod.length)],
      stopLossPercent: paramRanges.stopLossPercent[Math.floor(Math.random() * paramRanges.stopLossPercent.length)],
      takeProfitPercent: paramRanges.takeProfitPercent[Math.floor(Math.random() * paramRanges.takeProfitPercent.length)],
    };

    const result = await runBacktest(symbol, startDate, endDate, initialCapital, params);

    // Score = Sharpe Ratio * Win Rate (higher is better)
    const score = result.sharpeRatio * (result.winRate / 100);

    if (score > bestScore) {
      bestScore = score;
      bestResult = result;
      bestParams = params;
    }
  }

  return {
    bestParams: bestParams!,
    bestResult: bestResult!,
  };
}

// Save backtest result to database
export async function saveBacktestResult(
  userId: number,
  strategyName: string,
  startDate: Date,
  endDate: Date,
  initialCapital: number,
  result: BacktestResult
) {
  const backtest: InsertBacktestResult = {
    userId,
    strategyName,
    startDate,
    endDate,
    initialCapital: initialCapital as any,
    finalCapital: (initialCapital + (result.totalReturn / 100) * initialCapital) as any,
    totalReturn: result.totalReturn as any,
    annualReturn: result.annualReturn as any,
    sharpeRatio: result.sharpeRatio as any,
    maxDrawdown: result.maxDrawdown as any,
    winRate: result.winRate as any,
    profitFactor: result.profitFactor as any,
    totalTrades: result.totalTrades,
    winningTrades: result.winningTrades,
    losingTrades: result.losingTrades,
    avgWin: result.avgWin as any,
    avgLoss: result.avgLoss as any,
  };

  return await db.saveBacktestResult(backtest);
}
