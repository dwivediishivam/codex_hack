import { Router } from "express";
import { z } from "zod";
import { compilePrompt } from "../services/promptCompiler.js";
import { createApp, createJob, listApps, listJobs, listPublicApps } from "../services/appRepository.js";

export const microAppsRouter = Router();

const createSchema = z.object({
  name: z.string().min(2).optional(),
  prompt: z.string().min(12),
  visibility: z.enum(["private", "public", "organization"]),
  audience: z.string().min(2),
  category: z.string().min(2),
  generationMode: z.string().min(2)
});

microAppsRouter.get("/", (req, res) => {
  void (async () => {
    try {
      const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId : undefined;
      const items = await listApps(ownerId);
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  })();
});

microAppsRouter.get("/jobs", (req, res) => {
  void (async () => {
    try {
      const appId = typeof req.query.appId === "string" ? req.query.appId : undefined;
      const items = await listJobs(appId);
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  })();
});

microAppsRouter.get("/public", (_req, res) => {
  void (async () => {
    try {
      const items = await listPublicApps();
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  })();
});

microAppsRouter.post("/", (req, res) => {
  void (async () => {
    const parsed = createSchema.extend({ ownerId: z.string().min(2) }).safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten()
      });
    }

    try {
      const promptPackage = compilePrompt(parsed.data);
      const app = await createApp({
        ownerId: parsed.data.ownerId,
        name: parsed.data.name?.trim() || suggestName(parsed.data.prompt),
        summary: parsed.data.prompt,
        visibility: parsed.data.visibility,
        audience: parsed.data.audience,
        category: parsed.data.category,
        generationMode: parsed.data.generationMode
      });

      const job = await createJob({
        appId: app.id,
        type: "create",
        prompt: parsed.data.prompt,
        systemPrompt: promptPackage.systemPrompt
      });

      return res.status(201).json({
        app,
        job,
        promptPackage
      });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  })();
});

function suggestName(prompt: string) {
  const stopWords = new Set([
    "make",
    "build",
    "create",
    "me",
    "my",
    "i",
    "want",
    "need",
    "needful",
    "to",
    "into",
    "before",
    "after",
    "this",
    "it",
    "any",
    "one",
    "a",
    "an",
    "the",
    "app",
    "small",
    "tiny",
    "that",
    "shows",
    "for",
    "with",
    "our",
    "that",
    "should",
    "can",
    "would"
  ]);

  const tokens = prompt
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !stopWords.has(token.toLowerCase()))
    .slice(0, 3)
    .map((token) => token[0].toUpperCase() + token.slice(1).toLowerCase());

  return tokens.join(" ") || "New App";
}
