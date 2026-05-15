import express from "express";
import { createServer } from "http";
import type { Server } from "http";
import path from "path";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { initWebSocket } from "./_core/websocket";

// In CJS (compiled by esbuild --format=cjs), __dirname is available as a global
declare const __dirname: string;

function listen(server: Server, port: number, host: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const onError = (error: NodeJS.ErrnoException) => {
      server.off("listening", onListening);
      reject(error);
    };

    const onListening = () => {
      server.off("error", onError);
      resolve(port);
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

async function listenWithPortFallback(
  server: Server,
  requestedPort: number,
  host: string
) {
  const retryLimit = Math.max(Number(process.env.PORT_RETRY_LIMIT) || 10, 1);

  for (let offset = 0; offset < retryLimit; offset += 1) {
    const port = requestedPort + offset;

    try {
      return await listen(server, port, host);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EADDRINUSE" || offset === retryLimit - 1) {
        throw error;
      }

      console.warn(
        `Port ${port} is already in use. Trying http://localhost:${port + 1}/`
      );
    }
  }

  throw new Error(`No free port found starting from ${requestedPort}.`);
}

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

  const actualPort = await listenWithPortFallback(server, port, host);

  console.log(`Server running on http://${host}:${actualPort}/`);
  console.log(`Local URL: http://localhost:${actualPort}/`);
  console.log(`tRPC endpoint: http://${host}:${actualPort}/trpc`);
}

startServer().catch(console.error);
