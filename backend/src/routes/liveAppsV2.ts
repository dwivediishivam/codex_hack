import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { createApp, createJob, getAppById, listApps } from "../services/appRepository.js";
import { convertStructuredData, generateQrPng, imagesToPdf, textToPdf, transformImage, transformPdf } from "../services/hostedAppActions.js";
import { readGeneratedAppDocument, writeGeneratedAppDocument } from "../services/generatedAppStore.js";
import { readHostedAppState, writeHostedAppState } from "../services/hostedAppStateStore.js";
import { buildLiveBundleV2Document } from "../services/liveBundleV2Generator.js";
import type { LiveBundleV2Document } from "../types/liveBundleV2.js";

export const liveAppsV2Router = Router();
export const liveAppsV2HostedRouter = Router();
export const liveAppsV2HostedApiRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

const createSchema = z.object({
  ownerId: z.string().min(2),
  prompt: z.string().min(12)
});

const stateSchema = z.object({
  entries: z.array(
    z.object({
      id: z.string(),
      createdAt: z.string(),
      values: z.record(z.string())
    })
  ),
  notes: z.string()
});

const textPdfSchema = z.object({
  title: z.string().optional().default("Document"),
  author: z.string().optional(),
  text: z.string().min(1)
});

const qrSchema = z.object({
  text: z.string().min(1)
});

const structuredDataSchema = z.object({
  mode: z.enum(["csv_to_json", "json_to_csv"]),
  input: z.string().min(1)
});

const pdfStudioSchema = z.object({
  trimTopPercent: z.coerce.number().min(0).max(90).optional().default(0),
  trimBottomPercent: z.coerce.number().min(0).max(90).optional().default(0),
  trimLeftPercent: z.coerce.number().min(0).max(90).optional().default(0),
  trimRightPercent: z.coerce.number().min(0).max(90).optional().default(0),
  preservePageSize: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === undefined ? true : value === true || value === "true")
});

liveAppsV2Router.get("/", (req, res) => {
  void (async () => {
    try {
      const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId : undefined;
      const items = await listApps(ownerId);
      res.json({
        items: items.filter((item) => item.generation_mode === "bundle-v2")
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  })();
});

liveAppsV2Router.get("/:id", (req, res) => {
  void (async () => {
    try {
      const app = await getAppById(req.params.id);
      if (!app || app.generation_mode !== "bundle-v2") {
        return res.status(404).json({ error: "App not found" });
      }

      const document = await readLiveDocument(req.params.id);
      return res.json({ app, document });
    } catch (error) {
      return res.status(404).json({ error: (error as Error).message });
    }
  })();
});

liveAppsV2Router.post("/", (req, res) => {
  void (async () => {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
      }

      const id = randomUUID();
      const document = await buildLiveBundleV2Document({
        appId: id,
        prompt: parsed.data.prompt,
        ownerId: parsed.data.ownerId
      });

      await writeGeneratedAppDocument(id, document);

      const app = await createApp({
        id,
        ownerId: parsed.data.ownerId,
        name: document.name,
        summary: document.summary,
        visibility: "private",
        audience: "personal",
        category: "generated-v2",
        generationMode: "bundle-v2",
        status: "ready",
        deploymentUrl: buildGeneratedAppUrl(id, parsed.data.ownerId)
      });

      const job = await createJob({
        appId: id,
        type: "create",
        prompt: parsed.data.prompt,
        systemPrompt: `bundle-v2:${document.primaryKind}`,
        status: "completed"
      });

      return res.status(201).json({ app, document, job });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  })();
});

liveAppsV2HostedRouter.get("/:id", (req, res) => {
  void (async () => {
    try {
      const document = await readLiveDocument(normalizeParam(req.params.id));
      res.type("html").send(document.bundleHtml);
    } catch (error) {
      res.status(404).type("html").send(`<h1>V2 app not found</h1><p>${escapeHtml((error as Error).message)}</p>`);
    }
  })();
});

liveAppsV2HostedApiRouter.get("/:id/state", (req, res) => {
  void (async () => {
    const appId = normalizeParam(req.params.id);
    const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId.trim() : "";
    if (!ownerId) {
      return res.status(400).json({ error: "ownerId is required" });
    }

    try {
      const state = await readHostedAppState(appId, ownerId);
      return res.json(state);
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  })();
});

liveAppsV2HostedApiRouter.post("/:id/state", (req, res) => {
  void (async () => {
    const appId = normalizeParam(req.params.id);
    const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId.trim() : "";
    if (!ownerId) {
      return res.status(400).json({ error: "ownerId is required" });
    }

    const parsed = stateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid state payload", details: parsed.error.flatten() });
    }

    try {
      await writeHostedAppState(appId, ownerId, parsed.data);
      return res.json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  })();
});

liveAppsV2HostedApiRouter.post("/:id/run/image-to-pdf", upload.array("files", 20), (req, res) => {
  void (async () => {
    try {
      const document = await readLiveDocument(normalizeParam(req.params.id));
      if (document.primaryKind !== "image_to_pdf") {
        return res.status(400).json({ error: "App is not an image-to-pdf tool" });
      }

      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      const pdf = await imagesToPdf(files);
      sendAttachment(res, pdf, "generated-image-pack.pdf", "application/pdf");
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  })();
});

liveAppsV2HostedApiRouter.post("/:id/run/image-studio", upload.single("file"), (req, res) => {
  void (async () => {
    try {
      const document = await readLiveDocument(normalizeParam(req.params.id));
      if (document.primaryKind !== "image_studio") {
        return res.status(400).json({ error: "App is not an image studio tool" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      const transformed = await transformImage(file, {
        width: parseOptionalNumber(req.body.width),
        height: parseOptionalNumber(req.body.height),
        format: parseFormat(req.body.format),
        grayscale: req.body.grayscale === "true",
        rotate: parseOptionalNumber(req.body.rotate),
        quality: parseOptionalNumber(req.body.quality),
        watermark: typeof req.body.watermark === "string" ? req.body.watermark : undefined
      });

      sendAttachment(res, transformed.buffer, transformed.filename, transformed.contentType);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  })();
});

liveAppsV2HostedApiRouter.post("/:id/run/pdf-studio", upload.single("file"), (req, res) => {
  void (async () => {
    try {
      const document = await readLiveDocument(normalizeParam(req.params.id));
      if (document.primaryKind !== "pdf_studio") {
        return res.status(400).json({ error: "App is not a PDF studio tool" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "PDF file is required" });
      }

      const parsed = pdfStudioSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid pdf transform payload", details: parsed.error.flatten() });
      }

      const transformed = await transformPdf(file, parsed.data);
      sendAttachment(res, transformed.buffer, transformed.filename, transformed.contentType);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  })();
});

liveAppsV2HostedApiRouter.post("/:id/run/text-to-pdf", (req, res) => {
  void (async () => {
    try {
      const document = await readLiveDocument(normalizeParam(req.params.id));
      if (document.primaryKind !== "text_to_pdf") {
        return res.status(400).json({ error: "App is not a text-to-pdf tool" });
      }

      const parsed = textPdfSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid text payload", details: parsed.error.flatten() });
      }

      const pdf = await textToPdf(parsed.data);
      sendAttachment(res, pdf, `${slugify(parsed.data.title || "generated-document") || "generated-document"}.pdf`, "application/pdf");
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  })();
});

liveAppsV2HostedApiRouter.post("/:id/run/qr", (req, res) => {
  void (async () => {
    try {
      const document = await readLiveDocument(normalizeParam(req.params.id));
      if (document.primaryKind !== "qr_generator") {
        return res.status(400).json({ error: "App is not a QR generator" });
      }

      const parsed = qrSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid qr payload", details: parsed.error.flatten() });
      }

      const png = await generateQrPng(parsed.data.text);
      sendAttachment(res, png, "generated-qr.png", "image/png");
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  })();
});

liveAppsV2HostedApiRouter.post("/:id/run/structured-data", (req, res) => {
  void (async () => {
    try {
      const document = await readLiveDocument(normalizeParam(req.params.id));
      if (document.primaryKind !== "csv_json_converter") {
        return res.status(400).json({ error: "App is not a CSV/JSON converter" });
      }

      const parsed = structuredDataSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid conversion payload", details: parsed.error.flatten() });
      }

      const result = convertStructuredData(parsed.data.mode, parsed.data.input);
      sendAttachment(res, Buffer.from(result.content, "utf8"), result.filename, result.contentType);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  })();
});

async function readLiveDocument(id: string) {
  const document = await readGeneratedAppDocument<LiveBundleV2Document>(id);
  if (document.mode !== "bundle_v2") {
    throw new Error("Stored app is not a V2 live bundle");
  }
  return document;
}

function buildGeneratedAppUrl(id: string, ownerId: string) {
  const baseUrl = (process.env.APP_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
  return `${baseUrl}/v2-hosted/${id}?ownerId=${encodeURIComponent(ownerId)}`;
}

function sendAttachment(res: Response, buffer: Buffer, filename: string, contentType: string) {
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", buffer.length.toString());
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

function normalizeParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parseOptionalNumber(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseFormat(value: unknown) {
  if (value === "jpeg" || value === "png" || value === "webp") {
    return value;
  }
  return undefined;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
