import express from "express";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { initWebSocket } from "./_core/websocket";

declare const __dirname: string;

function resolveStaticPath() {
  const productionStaticPath = path.resolve(__dirname, "public");
  const fallbackStaticPath = path.resolve(__dirname, "..", "dist", "public");

  if (fs.existsSync(path.join(productionStaticPath, "index.html"))) {
    return productionStaticPath;
  }

  return fallbackStaticPath;
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  initWebSocket(server);

  app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: () => ({}),
    })
  );

  const staticPath = resolveStaticPath();

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = Number(process.env.PORT) || 3000;
  const host = "0.0.0.0";

  server.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}/`);
    console.log(`tRPC endpoint: http://${host}:${port}/trpc`);
  });
}

startServer().catch((error) => {
  console.error(error);
});
