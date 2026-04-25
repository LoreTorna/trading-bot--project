import express from "express";
import { createServer } from "http";
import path from "path";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { initWebSocket } from "./_core/websocket";

// In CJS (compiled by esbuild --format=cjs), __dirname is available as a global
declare const __dirname: string;

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Initialize WebSocket
  initWebSocket(server);

  // tRPC middleware
  app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: () => ({}),
    })
  );

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    res.sendFile(indexPath);
  });

  const port = Number(process.env.PORT) || 3000;
  const host = "0.0.0.0";

  server.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}/`);
    console.log(`tRPC endpoint: http://${host}:${port}/trpc`);
  });
}

startServer().catch(console.error);
