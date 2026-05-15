import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import type {
  BacktestBatchResult,
  BotMetrics,
  BotStatus,
  BotTrade,
} from "@/lib/bot-data";
import {
  isBacktestBatchResult,
  normalizeTrade,
  normalizeTrades,
} from "@/lib/bot-data";

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [metrics, setMetrics] = useState<BotMetrics | null>(null);
  const [trades, setTrades] = useState<BotTrade[]>([]);
  const [backtestProgress, setBacktestProgress] = useState(0);
  const [backtestResult, setBacktestResult] =
    useState<BacktestBatchResult | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("bot-status", (statusData: BotStatus) => {
      setStatus(statusData);
    });

    newSocket.on("metrics-update", (metricsData: BotMetrics) => {
      setMetrics(metricsData);
    });

    newSocket.on("trade-executed", (trade: BotTrade) => {
      setTrades((prev) =>
        normalizeTrades([normalizeTrade(trade), ...prev]).slice(0, 50)
      );
    });

    newSocket.on("trades-snapshot", (snapshot: BotTrade[]) => {
      setTrades(normalizeTrades(snapshot).slice(0, 200));
    });

    newSocket.on("backtest-progress", (progress: number) => {
      setBacktestProgress(progress);
    });

    newSocket.on("backtest-complete", (result: unknown) => {
      if (isBacktestBatchResult(result)) {
        setBacktestResult(result);
        if (Array.isArray(result.trades)) {
          setTrades(normalizeTrades(result.trades).slice(0, 200));
        }
      }
      setBacktestProgress(100);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const startBot = useCallback(() => {
    socket?.emit("bot-start");
  }, [socket]);

  const stopBot = useCallback(() => {
    socket?.emit("bot-stop");
  }, [socket]);

  return {
    socket,
    isConnected,
    status,
    metrics,
    trades,
    backtestProgress,
    backtestResult,
    startBot,
    stopBot,
  };
}
