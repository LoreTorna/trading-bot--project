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
  id: number;
  symbol: string;
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
  pnl: number;
  timestamp: string;
}

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [lastTrade, setLastTrade] = useState<Trade | null>(null);
  const [backtestProgress, setBacktestProgress] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("[WebSocket] Connected");
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
      setConnected(false);
    });

    newSocket.on("bot-status", (status: BotStatus) => {
      console.log("[WebSocket] Bot status:", status);
      setBotStatus(status);
    });

    newSocket.on("metrics-update", (metricsData: Metrics) => {
      console.log("[WebSocket] Metrics update:", metricsData);
      setMetrics(metricsData);
    });

    newSocket.on("trade-executed", (trade: Trade) => {
      console.log("[WebSocket] Trade executed:", trade);
      setLastTrade(trade);
    });

    newSocket.on("backtest-progress", (progress: number) => {
      console.log("[WebSocket] Backtest progress:", progress);
      setBacktestProgress(progress);
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
    connected,
    botStatus,
    metrics,
    lastTrade,
    backtestProgress,
    startBot,
    stopBot,
  };
}
