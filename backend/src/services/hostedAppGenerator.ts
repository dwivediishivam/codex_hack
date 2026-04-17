import OpenAI from "openai";
import { env } from "../config/env.js";
import type { HostedAppConfig, HostedAppKind } from "../types/hostedApp.js";
import { generateAppSpec } from "./appSpecGenerator.js";

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

export async function buildHostedAppConfig(prompt: string, ownerId: string): Promise<HostedAppConfig> {
  const trackerSpec = await generateAppSpec(prompt);
  const kind = await detectHostedAppKind(prompt);
  const pdfSpec = kind === "pdf_studio" ? buildPdfStudioSpec(prompt) : undefined;

  return {
    mode: "hosted",
    kind,
    name: preferUtilityName(kind, trackerSpec.name),
    summary: preferUtilitySummary(kind, trackerSpec.summary),
    prompt,
    ownerId,
    accent: trackerSpec.accent,
    ...(kind === "persistent_tracker" ? { trackerSpec } : {}),
    ...(kind === "pdf_studio" && pdfSpec ? { pdfSpec } : {})
  } as HostedAppConfig;
}

async function detectHostedAppKind(prompt: string): Promise<HostedAppKind> {
  const heuristicKind = detectHostedAppKindHeuristically(prompt);
  if (heuristicKind === "pdf_studio") {
    return heuristicKind;
  }

  if (openai) {
    try {
      const response = await openai.responses.create({
        model: env.OPENAI_MODEL,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "Classify the user request into one hosted app capability. Return JSON only with a single field named kind."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Prompt: ${prompt}

Supported kinds:
- image_to_pdf: convert uploaded images into a PDF
- image_studio: resize, compress, grayscale, rotate, convert format, watermark images
- pdf_studio: trim, crop, blank, pad, or otherwise edit uploaded PDF pages
- text_to_pdf: convert entered text or markdown-like content into a PDF
- qr_generator: generate downloadable QR codes
- csv_json_converter: convert CSV to JSON or JSON to CSV
- unit_converter: unit conversions
- persistent_tracker: forms and saved records`
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "hosted_app_kind",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["kind"],
              properties: {
                kind: {
                  type: "string",
                  enum: [
                    "image_to_pdf",
                    "image_studio",
                    "pdf_studio",
                    "text_to_pdf",
                    "qr_generator",
                    "csv_json_converter",
                    "unit_converter",
                    "persistent_tracker"
                  ]
                }
              }
            }
          }
        }
      });

      if (response.output_text) {
        const parsed = JSON.parse(response.output_text) as { kind?: HostedAppKind };
        if (parsed.kind) {
          return parsed.kind;
        }
      }
    } catch {
      // Fall through to heuristics.
    }
  }

  return heuristicKind;
}

function detectHostedAppKindHeuristically(prompt: string): HostedAppKind {
  const lower = prompt.toLowerCase();
  if (
    lower.includes("pdf") &&
    mentionsAny(lower, ["trim", "crop", "blank", "erase", "remove", "margin", "padding", "pad", "whitespace", "white space", "top", "bottom", "left", "right"])
  ) {
    return "pdf_studio";
  }

  if (mentionsAny(lower, ["edit image", "edit photo", "resize", "compress", "crop", "watermark", "webp", "png", "jpeg"]) &&
    mentionsAny(lower, ["image", "photo", "picture"])) {
    return "image_studio";
  }

  if (mentionsAny(lower, ["image", "photo", "png", "jpg", "jpeg", "heic"]) && lower.includes("pdf")) {
    return "image_to_pdf";
  }

  if (mentionsAny(lower, ["text", "note", "essay", "document", "write", "markdown"]) && lower.includes("pdf")) {
    return "text_to_pdf";
  }

  if (mentionsAny(lower, ["qr", "qrcode", "qr code"])) {
    return "qr_generator";
  }

  if (mentionsAny(lower, ["csv", "json", "spreadsheet", "rows", "table"]) && mentionsAny(lower, ["convert", "converter", "transform"])) {
    return "csv_json_converter";
  }

  if (mentionsAny(lower, ["unit", "temperature", "length", "distance", "weight", "mass", "km", "miles", "celsius", "fahrenheit"])) {
    return "unit_converter";
  }

  return "persistent_tracker";
}

function preferUtilityName(kind: HostedAppKind, fallback: string) {
  switch (kind) {
    case "image_to_pdf":
      return "Image To PDF";
    case "image_studio":
      return "Image Studio";
    case "pdf_studio":
      return fallback.toLowerCase().includes("pdf") ? fallback : "PDF Studio";
    case "text_to_pdf":
      return "Text To PDF";
    case "qr_generator":
      return "QR Generator";
    case "csv_json_converter":
      return "CSV JSON Converter";
    case "unit_converter":
      return "Unit Converter";
    case "persistent_tracker":
      return fallback;
  }
}

function preferUtilitySummary(kind: HostedAppKind, fallback: string) {
  switch (kind) {
    case "image_to_pdf":
      return "Upload one or more images and export them as a clean PDF.";
    case "image_studio":
      return "Upload an image, then resize, rotate, convert, grayscale, or watermark it on the backend.";
    case "pdf_studio":
      return "Upload a PDF, then trim or blank page edges and download the transformed file.";
    case "text_to_pdf":
      return "Write or paste text, then turn it into a downloadable PDF.";
    case "qr_generator":
      return "Generate downloadable QR codes from links, text, or contact details.";
    case "csv_json_converter":
      return "Convert CSV to JSON or JSON to CSV and download the result.";
    case "unit_converter":
      return "Convert between common units for length, weight, temperature, and time.";
    case "persistent_tracker":
      return fallback;
  }
}

function mentionsAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function buildPdfStudioSpec(prompt: string) {
  const lower = prompt.toLowerCase();
  const trimTopPercent = extractDirectionalPercent(lower, "top");
  const trimBottomPercent = extractDirectionalPercent(lower, "bottom");
  const trimLeftPercent = extractDirectionalPercent(lower, "left");
  const trimRightPercent = extractDirectionalPercent(lower, "right");
  const preservePageSize = mentionsAny(lower, ["blank", "fill", "pad", "padding", "margin", "whitespace", "white space"])
    ? true
    : !mentionsAny(lower, ["crop to smaller page", "shrink page", "reduce page size"]);

  return {
    trimTopPercent,
    trimBottomPercent,
    trimLeftPercent,
    trimRightPercent,
    preservePageSize
  };
}

function extractDirectionalPercent(prompt: string, direction: "top" | "bottom" | "left" | "right") {
  const index = prompt.indexOf(direction);
  if (index < 0) {
    return 0;
  }

  const windowStart = Math.max(0, index - 18);
  const windowEnd = Math.min(prompt.length, index + 42);
  const windowText = prompt.slice(windowStart, windowEnd);
  const fractionMatch = windowText.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0) {
      return clamp(Math.round((numerator / denominator) * 100), 0, 90);
    }
  }

  const percentMatch = windowText.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch) {
    return clamp(Math.round(Number(percentMatch[1])), 0, 90);
  }

  const decimalMatch = windowText.match(/\b0?\.(\d+)\b/);
  if (decimalMatch) {
    return clamp(Math.round(Number(`0.${decimalMatch[1]}`) * 100), 0, 90);
  }

  if (mentionsAny(windowText, ["half"])) {
    return 50;
  }

  if (mentionsAny(windowText, ["quarter", "fourth"])) {
    return 25;
  }

  if (mentionsAny(windowText, ["fifth"])) {
    return 20;
  }

  return 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
