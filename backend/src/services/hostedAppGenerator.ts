import type { HostedAppConfig, HostedAppKind } from "../types/hostedApp.js";
import { generateAppSpec } from "./appSpecGenerator.js";

export async function buildHostedAppConfig(prompt: string, ownerId: string): Promise<HostedAppConfig> {
  const trackerSpec = await generateAppSpec(prompt);
  const kind = detectHostedAppKind(prompt);

  return {
    mode: "hosted",
    kind,
    name: preferUtilityName(kind, trackerSpec.name),
    summary: preferUtilitySummary(kind, trackerSpec.summary),
    prompt,
    ownerId,
    accent: trackerSpec.accent,
    ...(kind === "persistent_tracker" ? { trackerSpec } : {})
  } as HostedAppConfig;
}

function detectHostedAppKind(prompt: string): HostedAppKind {
  const lower = prompt.toLowerCase();

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
