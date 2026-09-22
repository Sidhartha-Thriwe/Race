import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import "dotenv/config";
import { raceRouter } from "./server/race/routes.js";
import { initStore } from "./server/race/db.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "1mb" }));

  // Server-side API route
  app.get("/api/health", (req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  // RACE engine — skill 1 (identity resolution) and its run records.
  // Resolve the storage backend once, at boot, so the first run of a demo is
  // not also the first time we find out whether Firestore is reachable.
  await initStore();
  app.use("/api/race", raceRouter());

  // Vite middleware for development vs static production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
