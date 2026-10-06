import express from "express";
import path from "path";
import fs from "fs";
import "dotenv/config";
import { raceRouter } from "./server/race/routes.js";
import { initStore } from "./server/race/db.js";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const distPath = path.join(process.cwd(), "dist");
  const hasBuiltApp = fs.existsSync(path.join(distPath, "index.html"));
  const isProduction = process.env.NODE_ENV === "production" || hasBuiltApp;

  app.use(express.json({ limit: "1mb" }));

  // Server-side API route: responds immediately to Cloud Run health checks
  app.get("/api/health", (req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  // RACE engine routes
  app.use("/api/race", raceRouter());

  // Static production serving vs Vite development middleware
  if (isProduction) {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  // Bind to PORT immediately so Cloud Run rollout health check probes receive instant 200 responses
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (${isProduction ? "production" : "development"})`);
  });

  // Graceful shutdown handling for Cloud Run container lifecycle
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      process.exit(0);
    });
  });

  // Background initialization of storage backend without blocking port binding or health checks
  initStore().catch((err) => {
    console.warn("[race] initStore warning:", err);
  });
}

startServer();
