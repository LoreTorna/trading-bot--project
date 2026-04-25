import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;
let latestBotStatus = {
  running: false,
  uptime: "0h 0m",
  tradesCount: 0,
  portfolioValue: 10000,
  totalReturn: 0,
  winRate: 0,
};
let latestMetrics: any = null;
let latestTrades: any[] = [];

export function initWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    socket.emit("bot-status", latestBotStatus);

    if (latestMetrics) {
      socket.emit("metrics-update", latestMetrics);
    }

    if (latestTrades.length > 0) {
      socket.emit("trades-snapshot", latestTrades);
    }

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });

    socket.on("bot-start", () => {
      console.log("[WebSocket] Bot start requested");
      broadcastBotStatus({
        running: true,
        uptime: "0h 1m",
        tradesCount: 0,
        portfolioValue: 10000,
        totalReturn: 0,
        winRate: 0,
      });
    });

    socket.on("bot-stop", () => {
      console.log("[WebSocket] Bot stop requested");
      broadcastBotStatus({
        running: false,
        uptime: "0h 0m",
        tradesCount: 0,
        portfolioValue: 10000,
        totalReturn: 0,
        winRate: 0,
      });
    });
  });

  return io;
}

export function getWebSocket() {
  return io;
}

export function broadcastMetrics(metrics: any) {
  latestMetrics = metrics;
  if (io) {
    io.emit("metrics-update", metrics);
  }
}

export function broadcastTradeExecuted(trade: any) {
  latestTrades = [trade, ...latestTrades.filter((item) => item.id !== trade.id)].slice(0, 50);
  if (io) {
    io.emit("trade-executed", trade);
  }
}

export function broadcastTradesSnapshot(trades: any[]) {
  latestTrades = trades.slice(0, 50);
  if (io) {
    io.emit("trades-snapshot", latestTrades);
  }
}

export function broadcastBacktestProgress(progress: any) {
  if (io) {
    io.emit("backtest-progress", progress);
  }
}

export function broadcastBacktestComplete(result: any) {
  if (io) {
    io.emit("backtest-complete", result);
  }
}

export function broadcastBotStatus(status: any) {
  latestBotStatus = status;
  if (io) {
    io.emit("bot-status", status);
  }
}
