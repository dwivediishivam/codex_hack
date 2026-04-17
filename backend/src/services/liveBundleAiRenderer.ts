import OpenAI from "openai";
import { env } from "../config/env.js";
import type { HostedAppConfig } from "../types/hostedApp.js";

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

export async function maybeRenderAiLiveBundle(input: {
  appId: string;
  ownerId: string;
  prompt: string;
  focus: string[];
  hostedApp: HostedAppConfig;
  fallbackHtml: string;
}) {
  if (!openai) {
    return {
      name: input.hostedApp.name,
      summary: input.hostedApp.summary,
      html: input.fallbackHtml
    };
  }

  try {
    const response = await openai.responses.create({
      model: env.OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: `
You generate real, self-contained micro-app frontends for Pocket Foundry V2.

Return JSON only.

Rules:
- Build a focused, working app for the user's prompt.
- This app is hosted immediately at a fresh endpoint.
- Use browser JavaScript only. No imports. No bundlers. No external dependencies.
- Do not return full html/head/body tags.
- Do not include <script> or <style> tags in the strings.
- The app can use the helper API exposed as window.foundry:
  - foundry.appId
  - foundry.ownerId
  - foundry.prompt
  - foundry.hostedApp
  - foundry.showStatus(message, isError?)
  - foundry.fetchBlob(url, options)
  - foundry.fetchJson(url, options)
  - foundry.downloadBlob(blob, filename)
  - foundry.loadState()
  - foundry.saveState(state)
- The JS you return runs after the DOM is ready.
- If the exact request cannot be fulfilled, build the closest useful working tool instead of giving up.
- Prefer a specific workflow UI, not a generic tool wrapper.
- Keep the layout small and clean.
`.trim()
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildRendererPrompt(input)
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "pocket_foundry_v2_bundle",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["displayName", "displaySummary", "uiHtml", "uiCss", "uiScript"],
            properties: {
              displayName: { type: "string" },
              displaySummary: { type: "string" },
              uiHtml: { type: "string" },
              uiCss: { type: "string" },
              uiScript: { type: "string" }
            }
          }
        }
      }
    });

    if (!response.output_text) {
      throw new Error("Model returned no output text");
    }

    const parsed = JSON.parse(response.output_text) as {
      displayName: string;
      displaySummary: string;
      uiHtml: string;
      uiCss: string;
      uiScript: string;
    };

    return {
      name: normalizeLabel(parsed.displayName, input.hostedApp.name),
      summary: normalizeLabel(parsed.displaySummary, input.hostedApp.summary),
      html: renderGeneratedShell({
        appId: input.appId,
        ownerId: input.ownerId,
        prompt: input.prompt,
        focus: input.focus,
        hostedApp: input.hostedApp,
        displayName: normalizeLabel(parsed.displayName, input.hostedApp.name),
        displaySummary: normalizeLabel(parsed.displaySummary, input.hostedApp.summary),
        uiHtml: sanitizeFragment(parsed.uiHtml),
        uiCss: sanitizeStyle(parsed.uiCss),
        uiScript: sanitizeScript(parsed.uiScript)
      })
    };
  } catch {
    return {
      name: input.hostedApp.name,
      summary: input.hostedApp.summary,
      html: input.fallbackHtml
    };
  }
}

function buildRendererPrompt(input: {
  appId: string;
  ownerId: string;
  prompt: string;
  focus: string[];
  hostedApp: HostedAppConfig;
}) {
  return `
Prompt:
${input.prompt}

Current detected backend capability:
${input.hostedApp.kind}

Current capability config:
${JSON.stringify(input.hostedApp, null, 2)}

Suggested focus points:
${input.focus.map((item) => `- ${item}`).join("\n")}

Build context:
- app id: ${input.appId}
- owner id: ${input.ownerId}
- base backend route prefix for this app: /api/v2/hosted/${input.appId}

Available server actions for this app:
${availableActionsForKind(input.hostedApp)}

What to produce:
- displayName: short, specific app name
- displaySummary: short useful explanation
- uiHtml: inner markup for the main tool area
- uiCss: only the extra CSS needed for your tool
- uiScript: working JavaScript for your generated UI

Important:
- For file upload actions, use FormData.
- For downloads, use foundry.downloadBlob.
- For saved state, use await foundry.loadState() and await foundry.saveState(state).
- Prefer ids on important elements so your JS is simple and robust.
- If this prompt is a simple calculator, planner, formatter, or transformer that can run fully in browser, build that directly instead of using the backend capability unnecessarily.
`.trim();
}

function availableActionsForKind(config: HostedAppConfig) {
  switch (config.kind) {
    case "image_to_pdf":
      return `
- POST /api/v2/hosted/${config.ownerId ? "{appId}" : "{appId}"}/run/image-to-pdf
  multipart field: files (multiple image files)
  returns: pdf blob`;
    case "image_studio":
      return `
- POST /api/v2/hosted/{appId}/run/image-studio
  multipart fields: file, width, height, format, rotate, quality, watermark, grayscale
  returns: processed image blob`;
    case "pdf_studio":
      return `
- POST /api/v2/hosted/{appId}/run/pdf-studio
  multipart fields: file, trimTopPercent, trimBottomPercent, trimLeftPercent, trimRightPercent, preservePageSize
  returns: processed pdf blob`;
    case "text_to_pdf":
      return `
- POST /api/v2/hosted/{appId}/run/text-to-pdf
  json body: { title, author, text }
  returns: pdf blob`;
    case "qr_generator":
      return `
- POST /api/v2/hosted/{appId}/run/qr
  json body: { text }
  returns: png blob`;
    case "csv_json_converter":
      return `
- POST /api/v2/hosted/{appId}/run/structured-data
  json body: { mode: "csv_to_json" | "json_to_csv", input }
  returns: text file blob`;
    case "unit_converter":
      return `
- No server action required. Prefer a browser-side converter.`;
    case "persistent_tracker":
      return `
- foundry.loadState() -> { entries, notes }
- foundry.saveState(state) persists entries and notes for this app and owner`;
  }
}

function renderGeneratedShell(input: {
  appId: string;
  ownerId: string;
  prompt: string;
  focus: string[];
  hostedApp: HostedAppConfig;
  displayName: string;
  displaySummary: string;
  uiHtml: string;
  uiCss: string;
  uiScript: string;
}) {
  const escapedName = escapeHtml(input.displayName);
  const escapedSummary = escapeHtml(input.displaySummary);
  const escapedPrompt = escapeHtml(input.prompt);
  const focusMarkup = input.focus.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapedName} · Pocket Foundry V2</title>
      <style>
        :root {
          --accent: ${escapeHtml(input.hostedApp.accent)};
          --ink: #0f172a;
          --muted: #5a6578;
          --line: rgba(15, 23, 42, 0.12);
          --bg: linear-gradient(180deg, #f7efe4 0%, #fdfaf4 52%, #eef4ff 100%);
          --panel: rgba(255,255,255,0.88);
          --panel-strong: rgba(255,255,255,0.96);
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; min-height: 100%; }
        body {
          font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
          background: var(--bg);
          color: var(--ink);
        }
        main {
          width: min(980px, calc(100vw - 24px));
          margin: 18px auto;
          padding: 18px;
          border-radius: 30px;
          background: rgba(255,255,255,0.66);
          border: 1px solid rgba(255,255,255,0.72);
          box-shadow: 0 28px 80px rgba(15, 23, 42, 0.12);
          backdrop-filter: blur(12px);
        }
        .hero {
          display: grid;
          grid-template-columns: 1.35fr 0.9fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .hero-card, .panel, .tool-card {
          border-radius: 24px;
          border: 1px solid var(--line);
          background: var(--panel);
          padding: 18px;
        }
        .hero-card {
          min-height: 260px;
          background:
            radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 20%, transparent), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.88));
        }
        .eyebrow, .meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 8px 12px;
          background: color-mix(in srgb, var(--accent) 12%, white);
          color: var(--accent);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        h1 {
          margin: 14px 0 10px;
          font-size: clamp(34px, 5vw, 58px);
          line-height: 0.95;
          letter-spacing: -0.05em;
        }
        p { margin: 0; color: var(--muted); line-height: 1.55; }
        ul { margin: 0; padding-left: 18px; color: var(--muted); }
        .hero-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-top: 16px;
        }
        .stat {
          border-radius: 18px;
          border: 1px solid var(--line);
          background: var(--panel-strong);
          padding: 14px;
        }
        .stat strong {
          display: block;
          font-size: 1.1rem;
          margin-bottom: 4px;
        }
        .stack { display: grid; gap: 16px; }
        .tool-card {
          display: grid;
          gap: 14px;
        }
        input, textarea, select, button {
          font: inherit;
        }
        input, textarea, select {
          width: 100%;
          border-radius: 18px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: white;
          padding: 14px 16px;
          color: var(--ink);
        }
        textarea { min-height: 180px; resize: vertical; }
        button {
          border: 0;
          border-radius: 18px;
          padding: 14px 18px;
          background: var(--accent);
          color: white;
          font-weight: 700;
          cursor: pointer;
        }
        .status {
          margin-top: 12px;
          border-radius: 18px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.92);
          border: 1px solid var(--line);
          color: var(--muted);
        }
        .prompt-box {
          margin-top: 16px;
          border-radius: 18px;
          border: 1px dashed color-mix(in srgb, var(--accent) 26%, white);
          background: rgba(255,255,255,0.78);
          padding: 14px 16px;
        }
        @media (max-width: 800px) {
          main { width: 100vw; margin: 0; border-radius: 0; min-height: 100vh; }
          .hero { grid-template-columns: 1fr; }
        }
        ${input.uiCss}
      </style>
    </head>
    <body>
      <main>
        <section class="hero">
          <section class="hero-card">
            <span class="eyebrow">Pocket Foundry V2</span>
            <h1>${escapedName}</h1>
            <p>${escapedSummary}</p>
            <div class="prompt-box">
              <strong style="display:block;margin-bottom:6px">Built from this prompt</strong>
              <p>${escapedPrompt}</p>
            </div>
            <div class="hero-grid">
              <div class="stat">
                <strong>${escapeHtml(input.hostedApp.kind.replaceAll("_", " "))}</strong>
                <p>Fresh endpoint generated for this app only.</p>
              </div>
              <div class="stat">
                <strong>#${escapeHtml(input.appId.slice(0, 8))}</strong>
                <p>Build identity for this generated app.</p>
              </div>
            </div>
          </section>
          <section class="panel">
            <h2>What This Build Handles</h2>
            <ul>${focusMarkup}</ul>
            <div style="height:12px"></div>
            <div class="meta-chip">Hosted live now</div>
            <p style="margin-top:12px">This V2 build is generated from your prompt and published to a fresh hosted endpoint.</p>
          </section>
        </section>
        <section class="stack">
          <section class="tool-card" id="generated-app-root">
            ${input.uiHtml}
          </section>
          <section id="status" class="status">Ready. This app was generated and published to its own endpoint.</section>
        </section>
      </main>
      <script>
        const appId = ${JSON.stringify(input.appId)};
        const ownerId = ${JSON.stringify(input.ownerId)};
        const hostedApp = ${JSON.stringify(input.hostedApp)};

        function showStatus(message, isError = false) {
          const node = document.getElementById('status');
          if (!node) return;
          node.textContent = message;
          node.style.color = isError ? '#b42318' : '#5a6578';
        }

        async function fetchBlob(url, options) {
          const response = await fetch(url, options);
          if (!response.ok) {
            let message = 'Request failed';
            try {
              const payload = await response.json();
              message = payload.error || message;
            } catch {}
            throw new Error(message);
          }
          return response.blob();
        }

        async function fetchJson(url, options) {
          const response = await fetch(url, options);
          if (!response.ok) {
            let message = 'Request failed';
            try {
              const payload = await response.json();
              message = payload.error || message;
            } catch {}
            throw new Error(message);
          }
          return response.json();
        }

        function downloadBlob(blob, filename) {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = filename;
          anchor.click();
          setTimeout(() => URL.revokeObjectURL(url), 4000);
        }

        window.foundry = {
          appId,
          ownerId,
          prompt: ${JSON.stringify(input.prompt)},
          hostedApp,
          showStatus,
          fetchBlob,
          fetchJson,
          downloadBlob,
          loadState: () => fetchJson('/api/v2/hosted/' + appId + '/state?ownerId=' + encodeURIComponent(ownerId), { cache: 'no-store' }),
          saveState: (state) => fetchJson('/api/v2/hosted/' + appId + '/state?ownerId=' + encodeURIComponent(ownerId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
          })
        };

        ${input.uiScript}
      </script>
      <script src="https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js"></script>
    </body>
  </html>`;
}

function sanitizeFragment(value: string) {
  return value
    .replace(/<script/gi, "&lt;script")
    .replace(/<\/script>/gi, "&lt;/script&gt;");
}

function sanitizeStyle(value: string) {
  return value.replace(/<\/style>/gi, "");
}

function sanitizeScript(value: string) {
  return value.replace(/<\/script>/gi, "<\\/script>");
}

function normalizeLabel(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed || fallback;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
