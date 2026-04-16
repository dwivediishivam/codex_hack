import OpenAI from "openai";
import type { GeneratedAppSpec } from "../generated-apps";

const outputSchema = {
  name: "foundry_generated_app",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "name",
      "summary",
      "description",
      "accent",
      "focus",
      "fields",
      "views",
      "primaryActionLabel",
      "emptyStateTitle",
      "emptyStateBody"
    ],
    properties: {
      name: { type: "string" },
      summary: { type: "string" },
      description: { type: "string" },
      accent: { type: "string" },
      focus: {
        type: "array",
        minItems: 3,
        maxItems: 4,
        items: { type: "string" }
      },
      fields: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "label", "placeholder", "type"],
          properties: {
            id: { type: "string" },
            label: { type: "string" },
            placeholder: { type: "string" },
            type: { type: "string", enum: ["text", "number", "date", "notes"] }
          }
        }
      },
      views: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "title", "description"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" }
          }
        }
      },
      primaryActionLabel: { type: "string" },
      emptyStateTitle: { type: "string" },
      emptyStateBody: { type: "string" }
    }
  }
} as const;

const instructions = `
You generate runtime specs for Foundry, a mobile-first micro app platform.

Return JSON only.

Rules:
- Build one small useful app from the user's prompt.
- Keep the tone calm, direct, and human.
- The app must feel real on first launch, not generic.
- Prefer 2 to 4 input fields.
- Generate exactly 3 views:
  1. Overview
  2. Capture
  3. Entries
- Keep labels short.
- Avoid any reference to dashboards, analytics suites, enterprise tools, SaaS, visibility, reviews, or app generation.
- Accent must be a valid hex color.
`.trim();

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const defaultModel = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

export async function generateAppSpec(prompt: string): Promise<GeneratedAppSpec> {
  if (!openai) {
    return buildFallbackSpec(prompt);
  }

  try {
    const response = await openai.responses.create({
      model: defaultModel,
      instructions,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          ...outputSchema
        }
      }
    });

    if (response.output_text) {
      return JSON.parse(response.output_text) as GeneratedAppSpec;
    }
  } catch {
    // Fallback below keeps creation working even if the model call fails.
  }

  return buildFallbackSpec(prompt);
}

function buildFallbackSpec(prompt: string): GeneratedAppSpec {
  const name = deriveTitle(prompt);
  const summary = deriveSummary(prompt);
  const lower = prompt.toLowerCase();
  const accent = pickAccent(lower);
  const noun = pickNoun(lower);

  return {
    name,
    summary,
    description: `A focused tool for ${summary.charAt(0).toLowerCase()}${summary.slice(1)}`,
    accent,
    focus: deriveFocus(prompt),
    fields: deriveFields(prompt, noun),
    views: [
      { id: "overview", title: "Overview", description: "See the purpose of this app and what to track." },
      { id: "capture", title: "Capture", description: `Add a new ${noun} in one step.` },
      { id: "entries", title: "Entries", description: `Review every saved ${noun} in one place.` }
    ],
    primaryActionLabel: `Save ${capitalize(noun)}`,
    emptyStateTitle: `No ${pluralize(noun)} yet`,
    emptyStateBody: `Your saved ${pluralize(noun)} will appear here as soon as you add the first one.`
  };
}

function deriveTitle(prompt: string) {
  const stopWords = new Set(["make", "build", "create", "app", "tool", "for", "to", "a", "an", "the", "me", "my"]);
  const tokens = prompt
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !stopWords.has(token.toLowerCase()))
    .slice(0, 3)
    .map(capitalize);

  return tokens.join(" ") || "New App";
}

function deriveSummary(prompt: string) {
  const clean = prompt.trim().replace(/\s+/g, " ");
  return clean.length <= 90 ? clean : `${clean.slice(0, 87).trim()}...`;
}

function deriveFocus(prompt: string) {
  const pieces = prompt
    .split(/,| and | with /i)
    .map((piece) => piece.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (pieces.length >= 3) {
    return pieces.map((item) => sentenceCase(item));
  }

  return ["Clear capture", "Fast review", "Personal notes"];
}

function deriveFields(prompt: string, noun: string) {
  const lower = prompt.toLowerCase();

  if (lower.includes("budget") || lower.includes("spend") || lower.includes("money") || lower.includes("price")) {
    return [
      { id: "title", label: "Item", placeholder: "What is it?", type: "text" as const },
      { id: "amount", label: "Amount", placeholder: "Enter amount", type: "number" as const },
      { id: "date", label: "Date", placeholder: "Pick date", type: "date" as const },
      { id: "notes", label: "Notes", placeholder: "Why it matters", type: "notes" as const }
    ];
  }

  if (lower.includes("event") || lower.includes("guest") || lower.includes("trip") || lower.includes("plan")) {
    return [
      { id: "title", label: capitalize(noun), placeholder: `Add a ${noun}`, type: "text" as const },
      { id: "date", label: "Date", placeholder: "Pick date", type: "date" as const },
      { id: "status", label: "Status", placeholder: "Current status", type: "text" as const },
      { id: "notes", label: "Notes", placeholder: "Anything to remember", type: "notes" as const }
    ];
  }

  return [
    { id: "title", label: capitalize(noun), placeholder: `Add a ${noun}`, type: "text" as const },
    { id: "detail", label: "Detail", placeholder: "Main detail", type: "text" as const },
    { id: "date", label: "Date", placeholder: "Pick date", type: "date" as const },
    { id: "notes", label: "Notes", placeholder: "Extra notes", type: "notes" as const }
  ];
}

function pickAccent(lower: string) {
  if (lower.includes("money") || lower.includes("finance") || lower.includes("hours")) return "#2563eb";
  if (lower.includes("photo") || lower.includes("print") || lower.includes("image")) return "#c2410c";
  if (lower.includes("health") || lower.includes("habit")) return "#0f766e";
  return "#111827";
}

function pickNoun(lower: string) {
  if (lower.includes("expense") || lower.includes("spend") || lower.includes("budget")) return "entry";
  if (lower.includes("guest")) return "guest";
  if (lower.includes("photo") || lower.includes("print")) return "image";
  if (lower.includes("trip")) return "plan";
  return "entry";
}

function pluralize(value: string) {
  return value.endsWith("s") ? value : `${value}s`;
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value;
}

function sentenceCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
