import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

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

    // Send initial status
    socket.emit("bot-status", {
      running: false,
      uptime: "0h 0m",
      tradesCount: 0,
      portfolioValue: 10000,
      totalReturn: 0,
      winRate: 0,
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });

    // Handle bot control events
    socket.on("bot-start", () => {
      console.log("[WebSocket] Bot start requested");
      io?.emit("bot-status", {
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
      io?.emit("bot-status", {
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
  if (io) {
    io.emit("metrics-update", metrics);
  }
}

export function broadcastTradeExecuted(trade: any) {
  if (io) {
    io.emit("trade-executed", trade);
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
  if (io) {
    io.emit("bot-status", status);
  }
}
