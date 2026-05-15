import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    socket.emit("bot-status", {
      running: false,
      uptime: "0h 0m",
      tradesCount: 0,
      portfolioValue: 10000,
      totalReturn: 0,
      winRate: 0,
      activeSymbols: [],
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });

    socket.on("bot-start", () => {
      console.log("[WebSocket] Bot start requested");
    });

    socket.on("bot-stop", () => {
      console.log("[WebSocket] Bot stop requested");
    });
  });

  return io;
}

export function getWebSocket() {
  return io;
}

export function broadcastMetrics(metrics: unknown) {
  io?.emit("metrics-update", metrics);
}

export function broadcastTradeExecuted(trade: unknown) {
  io?.emit("trade-executed", trade);
}

export function broadcastTradesSnapshot(trades: unknown) {
  io?.emit("trades-snapshot", trades);
}

export function broadcastBacktestProgress(progress: unknown) {
  io?.emit("backtest-progress", progress);
}

export function broadcastBacktestComplete(result: unknown) {
  io?.emit("backtest-complete", result);
}

export function broadcastBotStatus(status: unknown) {
  io?.emit("bot-status", status);
}
