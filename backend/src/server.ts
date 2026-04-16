import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { microAppsRouter } from "./routes/microApps.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "Codex Hack API",
    environment: env.NODE_ENV,
    endpoints: ["/health", "/api/micro-apps", "/api/micro-apps/jobs"]
  });
});

app.use("/health", healthRouter);
app.use("/api/micro-apps", microAppsRouter);

app.listen(env.PORT, () => {
  console.log(`codex-hack-backend listening on ${env.APP_BASE_URL}`);
});
