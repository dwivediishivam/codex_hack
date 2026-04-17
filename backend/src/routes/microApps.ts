import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { compilePrompt } from "../services/promptCompiler.js";
import { getAppById, createApp, createJob, listApps, listJobs, listPublicApps } from "../services/appRepository.js";
import { env } from "../config/env.js";
import { buildHostedAppConfig } from "../services/hostedAppGenerator.js";
import { readGeneratedAppDocument, writeGeneratedAppDocument } from "../services/generatedAppStore.js";
import type { StoredGeneratedApp } from "../types/hostedApp.js";

export const microAppsRouter = Router();

const instantCreateSchema = z.object({
  ownerId: z.string().min(2),
  prompt: z.string().min(12)
});

const managedCreateSchema = instantCreateSchema.extend({
  name: z.string().min(2).optional(),
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

microAppsRouter.get("/:id", (req, res) => {
  void (async () => {
    try {
      const app = await getAppById(req.params.id);
      if (!app) {
        return res.status(404).json({ error: "App not found" });
      }

      const document = await readGeneratedAppDocument<StoredGeneratedApp>(req.params.id);
      if (document.mode === "spec") {
        return res.json({ app, spec: document.spec });
      }

      return res.json({ app, hostedApp: document });
    } catch (error) {
      return res.status(404).json({ error: (error as Error).message });
    }
  })();
});

microAppsRouter.post("/", (req, res) => {
  void (async () => {
    try {
      if (isManagedCreateRequest(req.body)) {
        const parsed = managedCreateSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            error: "Invalid request body",
            details: parsed.error.flatten()
          });
        }

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
      }

      const parsed = instantCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid request body",
          details: parsed.error.flatten()
        });
      }

      const id = randomUUID();
      const hostedApp = await buildHostedAppConfig(parsed.data.prompt, parsed.data.ownerId);
      await writeGeneratedAppDocument(id, hostedApp);

      const app = await createApp({
        id,
        ownerId: parsed.data.ownerId,
        name: hostedApp.name,
        summary: hostedApp.summary,
        visibility: "private",
        audience: "personal",
        category: hostedApp.kind === "persistent_tracker" ? "custom" : "utility",
        generationMode: "hosted-runtime",
        status: "ready",
        deploymentUrl: buildGeneratedAppUrl(id, parsed.data.ownerId)
      });

      const job = await createJob({
        appId: app.id,
        type: "create",
        prompt: parsed.data.prompt,
        systemPrompt: `hosted-app:${hostedApp.kind}`,
        status: "completed"
      });

      return res.status(201).json({ app, hostedApp, job });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  })();
});

function isManagedCreateRequest(value: unknown): value is z.infer<typeof managedCreateSchema> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.visibility === "string" &&
    typeof candidate.audience === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.generationMode === "string"
  );
}

function buildGeneratedAppUrl(id: string, ownerId: string) {
  const baseUrl = env.APP_BASE_URL.replace(/\/$/, "");
  const encodedOwnerId = encodeURIComponent(ownerId);
  return `${baseUrl}/micro-app-hosted/${id}?ownerId=${encodedOwnerId}`;
}

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
