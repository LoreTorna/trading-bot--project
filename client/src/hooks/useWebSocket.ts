import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface BotStatus {
  running: boolean;
  uptime: string;
  tradesCount: number;
  portfolioValue: number;
  totalReturn: number;
  winRate: number;
}

interface Metrics {
  portfolioValue: number;
  totalReturn: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  trades: number;
  timestamp: string;
}

interface Trade {
  id: number | string;
  symbol: string;
  type: string;
  price: number;
  quantity: number;
  pnl: number;
  time: string | Date;
  status: string;
}

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
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

    newSocket.on("metrics-update", (metricsData: Metrics) => {
      console.log("[WebSocket] Metrics update:", metricsData);
      setMetrics(metricsData);
    });

    newSocket.on("trade-executed", (trade: Trade) => {
      console.log("[WebSocket] Trade executed:", trade);
      setTrades((prev) => [trade, ...prev].slice(0, 50));
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
