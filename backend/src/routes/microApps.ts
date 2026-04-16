import { Router } from "express";
import { z } from "zod";
import { compilePrompt } from "../services/promptCompiler.js";
import { createApp, createJob, listApps, listJobs } from "../services/mockStore.js";

export const microAppsRouter = Router();

const createSchema = z.object({
  prompt: z.string().min(12),
  visibility: z.enum(["private", "public", "organization"]),
  audience: z.string().min(2),
  category: z.string().min(2),
  generationMode: z.string().min(2)
});

microAppsRouter.get("/", (_req, res) => {
  res.json({ items: listApps() });
});

microAppsRouter.get("/jobs", (_req, res) => {
  res.json({ items: listJobs() });
});

microAppsRouter.post("/", (req, res) => {
  const parsed = createSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten()
    });
  }

  const promptPackage = compilePrompt(parsed.data);
  const app = createApp({
    name: parsed.data.prompt.split(" ").slice(0, 3).join(" "),
    summary: parsed.data.prompt,
    visibility: parsed.data.visibility,
    status: parsed.data.visibility === "public" ? "reviewing" : "building",
    deploymentUrl: undefined
  });

  const job = createJob({
    appId: app.id,
    type: "create",
    status: "queued",
    prompt: parsed.data.prompt
  });

  return res.status(201).json({
    app,
    job,
    promptPackage
  });
});
