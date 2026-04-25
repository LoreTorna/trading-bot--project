import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { BotMetrics, BotStatus, BotTrade } from "@/lib/bot-data";
import { normalizeTrade, normalizeTrades } from "@/lib/bot-data";

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [metrics, setMetrics] = useState<BotMetrics | null>(null);
  const [trades, setTrades] = useState<BotTrade[]>([]);
  const [backtestProgress, setBacktestProgress] = useState(0);
  const [backtestResult, setBacktestResult] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("[WebSocket] Connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
      setIsConnected(false);
    });

    newSocket.on("bot-status", (statusData: BotStatus) => {
      console.log("[WebSocket] Bot status:", statusData);
      setStatus(statusData);
    });

    newSocket.on("metrics-update", (metricsData: BotMetrics) => {
      console.log("[WebSocket] Metrics update:", metricsData);
      setMetrics(metricsData);
    });

    newSocket.on("trade-executed", (trade: BotTrade) => {
      console.log("[WebSocket] Trade executed:", trade);
      setTrades((prev) =>
        normalizeTrades([normalizeTrade(trade), ...prev]).slice(0, 50)
      );
    });

    newSocket.on("trades-snapshot", (snapshot: BotTrade[]) => {
      console.log("[WebSocket] Trades snapshot:", snapshot);
      setTrades(normalizeTrades(snapshot).slice(0, 50));
    });

    newSocket.on("backtest-progress", (progress: number) => {
      console.log("[WebSocket] Backtest progress:", progress);
      setBacktestProgress(progress);
    });

    newSocket.on("backtest-complete", (result: any) => {
      console.log("[WebSocket] Backtest complete:", result);
      setBacktestResult(result);
      setBacktestProgress(100);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const startBot = useCallback(() => {
    if (socket) {
      socket.emit("bot-start");
    }
  }, [socket]);

  const stopBot = useCallback(() => {
    if (socket) {
      socket.emit("bot-stop");
    }
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
