import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { codexRouter } from "./routes/codex.js";
import { healthRouter } from "./routes/health.js";
import { hostedAppsApiRouter, hostedAppsRouter } from "./routes/hostedApps.js";
import { liveAppsV2HostedApiRouter, liveAppsV2HostedRouter, liveAppsV2Router } from "./routes/liveAppsV2.js";
import { microAppsRouter } from "./routes/microApps.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "Foundry API",
    environment: env.NODE_ENV,
    endpoints: [
      "/health",
      "/api/micro-apps",
      "/api/micro-apps/:id",
      "/api/micro-apps/jobs",
      "/api/v2/apps",
      "/api/v2/apps/:id",
      "/api/v2/hosted/:id/state",
      "/api/hosted-apps/:id/state",
      "/v2-hosted/:id",
      "/micro-app-hosted/:id",
      "/api/codex/plan"
    ]
  });
});

app.use("/health", healthRouter);
app.use("/api/micro-apps", microAppsRouter);
app.use("/api/v2/apps", liveAppsV2Router);
app.use("/api/v2/hosted", liveAppsV2HostedApiRouter);
app.use("/api/hosted-apps", hostedAppsApiRouter);
app.use("/v2-hosted", liveAppsV2HostedRouter);
app.use("/micro-app-hosted", hostedAppsRouter);
app.use("/api/codex", codexRouter);

app.listen(env.PORT, () => {
  console.log(`codex-hack-backend listening on ${env.APP_BASE_URL}`);
});
