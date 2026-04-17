import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { convertStructuredData, generateQrPng, imagesToPdf, textToPdf, transformImage } from "../services/hostedAppActions.js";
import { readGeneratedAppDocument } from "../services/generatedAppStore.js";
import { readHostedAppState, writeHostedAppState } from "../services/hostedAppStateStore.js";
import type { HostedAppConfig, StoredGeneratedApp } from "../types/hostedApp.js";

export const hostedAppsRouter = Router();
export const hostedAppsApiRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

hostedAppsRouter.get("/:id", (req, res) => {
  void (async () => {
    try {
      const appId = normalizeParam(req.params.id);
      const config = await readHostedConfig(appId);
      res.type("html").send(renderHostedAppHtml(appId, config));
    } catch (error) {
      res.status(404).type("html").send(`<h1>Hosted app not found</h1><p>${escapeHtml((error as Error).message)}</p>`);
    }
  })();
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

hostedAppsApiRouter.get("/:id/state", (req, res) => {
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

hostedAppsApiRouter.post("/:id/state", (req, res) => {
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

hostedAppsApiRouter.post("/:id/run/image-to-pdf", upload.array("files", 20), (req, res) => {
  void (async () => {
    try {
      const appId = normalizeParam(req.params.id);
      const config = await readHostedConfig(appId);
      if (config.kind !== "image_to_pdf") {
        return res.status(400).json({ error: "App is not an image-to-pdf tool" });
      }

      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      const pdf = await imagesToPdf(files);
      sendAttachment(res, pdf, "image-to-pdf.pdf", "application/pdf");
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  })();
});

hostedAppsApiRouter.post("/:id/run/image-studio", upload.single("file"), (req, res) => {
  void (async () => {
    try {
      const appId = normalizeParam(req.params.id);
      const config = await readHostedConfig(appId);
      if (config.kind !== "image_studio") {
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

const textPdfSchema = z.object({
  title: z.string().optional().default("Document"),
  author: z.string().optional(),
  text: z.string().min(1)
});

hostedAppsApiRouter.post("/:id/run/text-to-pdf", (req, res) => {
  void (async () => {
    try {
      const appId = normalizeParam(req.params.id);
      const config = await readHostedConfig(appId);
      if (config.kind !== "text_to_pdf") {
        return res.status(400).json({ error: "App is not a text-to-pdf tool" });
      }

      const parsed = textPdfSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid text payload", details: parsed.error.flatten() });
      }

      const pdf = await textToPdf(parsed.data);
      sendAttachment(res, pdf, `${slugify(parsed.data.title || "document") || "document"}.pdf`, "application/pdf");
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  })();
});

const qrSchema = z.object({
  text: z.string().min(1)
});

hostedAppsApiRouter.post("/:id/run/qr", (req, res) => {
  void (async () => {
    try {
      const appId = normalizeParam(req.params.id);
      const config = await readHostedConfig(appId);
      if (config.kind !== "qr_generator") {
        return res.status(400).json({ error: "App is not a QR generator" });
      }

      const parsed = qrSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid qr payload", details: parsed.error.flatten() });
      }

      const png = await generateQrPng(parsed.data.text);
      sendAttachment(res, png, "qr-code.png", "image/png");
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  })();
});

const structuredDataSchema = z.object({
  mode: z.enum(["csv_to_json", "json_to_csv"]),
  input: z.string().min(1)
});

hostedAppsApiRouter.post("/:id/run/structured-data", (req, res) => {
  void (async () => {
    try {
      const appId = normalizeParam(req.params.id);
      const config = await readHostedConfig(appId);
      if (config.kind !== "csv_json_converter") {
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

async function readHostedConfig(id: string) {
  const document = await readGeneratedAppDocument<StoredGeneratedApp>(id);
  if (document.mode !== "hosted") {
    throw new Error("Hosted app not found");
  }

  return document;
}

function renderHostedAppHtml(appId: string, config: HostedAppConfig) {
  const ownerQuery = encodeURIComponent(config.ownerId);
  const escapedTitle = escapeHtml(config.name);
  const escapedSummary = escapeHtml(config.summary);

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapedTitle}</title>
      <style>
        :root {
          --accent: ${escapeHtml(config.accent)};
          --ink: #151515;
          --muted: #5f5f5f;
          --line: rgba(21,21,21,0.1);
          --bg: linear-gradient(180deg, #f5f0e5 0%, #fbf8f2 50%, #f0ebe2 100%);
          --card: rgba(255,255,255,0.9);
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          min-height: 100vh;
          color: var(--ink);
          background: var(--bg);
          font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
        }
        main {
          width: min(820px, calc(100vw - 24px));
          margin: 24px auto;
          padding: 24px;
          border-radius: 28px;
          background: var(--card);
          border: 1px solid var(--line);
          box-shadow: 0 28px 70px rgba(76, 61, 32, 0.12);
        }
        .hero {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .badge {
          display: inline-flex;
          padding: 8px 12px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--accent) 14%, white);
          color: var(--accent);
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        h1 {
          margin: 12px 0 8px;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.02;
        }
        p, small { color: var(--muted); line-height: 1.55; }
        .stack { display: grid; gap: 16px; }
        .panel {
          border-radius: 22px;
          border: 1px solid var(--line);
          background: rgba(255,255,255,0.86);
          padding: 18px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }
        .row { display: flex; gap: 12px; flex-wrap: wrap; }
        input, textarea, select, button {
          font: inherit;
        }
        input, textarea, select {
          width: 100%;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid rgba(21,21,21,0.12);
          background: white;
        }
        textarea { min-height: 160px; resize: vertical; }
        button {
          border: 0;
          border-radius: 16px;
          padding: 14px 18px;
          background: var(--accent);
          color: white;
          font-weight: 700;
          cursor: pointer;
        }
        button.secondary {
          background: #f2f2f2;
          color: #202020;
        }
        .dropzone {
          border: 2px dashed color-mix(in srgb, var(--accent) 32%, white);
          background: color-mix(in srgb, var(--accent) 6%, white);
          text-align: center;
        }
        .preview {
          display: grid;
          gap: 12px;
        }
        .preview img, .preview canvas {
          max-width: 100%;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: white;
        }
        .entry {
          border-radius: 18px;
          border: 1px solid var(--line);
          background: white;
          padding: 14px;
        }
        .code {
          white-space: pre-wrap;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          background: #0f172a;
          color: #e2e8f0;
          border-radius: 18px;
          padding: 16px;
          min-height: 140px;
        }
        .status {
          margin-top: 12px;
          padding: 12px 14px;
          border-radius: 14px;
          background: #f8f8f8;
          color: var(--muted);
        }
        .hidden { display: none !important; }
        @media (max-width: 640px) {
          main {
            width: 100vw;
            min-height: 100vh;
            margin: 0;
            border-radius: 0;
          }
          .hero { flex-direction: column; }
        }
      </style>
    </head>
    <body>
      <main>
        <section class="hero">
          <div>
            <span class="badge">${escapeHtml(config.kind.replaceAll("_", " "))}</span>
            <h1>${escapedTitle}</h1>
            <p>${escapedSummary}</p>
          </div>
          <a href="/" class="badge" style="text-decoration:none">Back</a>
        </section>
        ${renderBody(config)}
      </main>
      <script>
        const appId = ${JSON.stringify(appId)};
        const ownerId = decodeURIComponent(${JSON.stringify(ownerQuery)});
        const appConfig = ${JSON.stringify(config)};

        function showStatus(message, isError = false) {
          const node = document.getElementById('status');
          if (!node) return;
          node.textContent = message;
          node.style.color = isError ? '#b42318' : '#5f5f5f';
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

        function downloadBlob(blob, filename) {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = filename;
          anchor.click();
          setTimeout(() => URL.revokeObjectURL(url), 4000);
        }

        async function loadState() {
          const response = await fetch('/api/hosted-apps/' + appId + '/state?ownerId=' + encodeURIComponent(ownerId), { cache: 'no-store' });
          if (!response.ok) throw new Error('Could not load saved state');
          return response.json();
        }

        async function saveState(state) {
          const response = await fetch('/api/hosted-apps/' + appId + '/state?ownerId=' + encodeURIComponent(ownerId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
          });
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || 'Could not save state');
          }
        }

        ${renderClientScript(config)}
      </script>
      <script src="https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js"></script>
    </body>
  </html>`;
}

function renderBody(config: HostedAppConfig) {
  switch (config.kind) {
    case "image_to_pdf":
      return `
        <section class="stack">
          <section class="panel dropzone">
            <input id="image-files" type="file" accept="image/*" multiple />
            <div class="row" style="margin-top:12px">
              <button id="image-pdf-run">Build PDF</button>
            </div>
          </section>
          <section id="image-preview" class="panel preview"></section>
          <section id="status" class="status">Upload images and export a PDF generated by the backend.</section>
        </section>
      `;
    case "image_studio":
      return `
        <section class="stack">
          <section class="panel dropzone">
            <input id="studio-file" type="file" accept="image/*" />
            <div class="grid" style="margin-top:12px">
              <input id="studio-width" type="number" min="1" placeholder="Width" />
              <input id="studio-height" type="number" min="1" placeholder="Height" />
              <select id="studio-format">
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WEBP</option>
              </select>
              <select id="studio-rotate">
                <option value="0">Rotate 0</option>
                <option value="90">Rotate 90</option>
                <option value="180">Rotate 180</option>
                <option value="270">Rotate 270</option>
              </select>
              <input id="studio-quality" type="number" min="10" max="100" value="90" placeholder="Quality" />
              <input id="studio-watermark" placeholder="Watermark text" />
            </div>
            <label style="display:flex;gap:10px;align-items:center;margin-top:12px">
              <input id="studio-grayscale" type="checkbox" style="width:auto" />
              <span>Grayscale</span>
            </label>
            <div class="row" style="margin-top:12px">
              <button id="studio-run">Process Image</button>
            </div>
          </section>
          <section class="panel preview">
            <img id="studio-preview" class="hidden" alt="Processed preview" />
          </section>
          <section id="status" class="status">Upload an image and process it on the backend.</section>
        </section>
      `;
    case "text_to_pdf":
      return `
        <section class="stack">
          <section class="panel">
            <div class="grid">
              <input id="pdf-title" placeholder="Document title" />
              <input id="pdf-author" placeholder="Author" />
            </div>
            <textarea id="pdf-text" placeholder="Write or paste your content"></textarea>
            <div class="row">
              <button id="text-pdf-run">Download PDF</button>
            </div>
          </section>
          <section id="status" class="status">The PDF is generated by the backend.</section>
        </section>
      `;
    case "qr_generator":
      return `
        <section class="stack">
          <section class="panel">
            <input id="qr-text" placeholder="Paste a link, text, or contact payload" />
            <div class="row">
              <button id="qr-preview-run">Preview</button>
              <button id="qr-download-run" class="secondary">Download PNG</button>
            </div>
          </section>
          <section class="panel preview">
            <canvas id="qr-canvas" width="320" height="320"></canvas>
          </section>
          <section id="status" class="status">Generate QR output and download it as PNG.</section>
        </section>
      `;
    case "csv_json_converter":
      return `
        <section class="stack">
          <section class="panel">
            <div class="row">
              <button id="csv-to-json">CSV to JSON</button>
              <button id="json-to-csv" class="secondary">JSON to CSV</button>
            </div>
            <small>Paste CSV with a header row, or paste a JSON array of objects.</small>
          </section>
          <section class="panel">
            <textarea id="converter-input" placeholder="Paste CSV or JSON here"></textarea>
          </section>
          <section class="panel">
            <div class="row">
              <button id="converter-run">Convert and Download</button>
            </div>
            <div id="converter-output" class="code"></div>
          </section>
          <section id="status" class="status">Structured data conversion runs on the backend.</section>
        </section>
      `;
    case "unit_converter":
      return `
        <section class="stack">
          <section class="panel">
            <div class="grid">
              <select id="converter-group">
                <option value="length">Length</option>
                <option value="weight">Weight</option>
                <option value="temperature">Temperature</option>
                <option value="time">Time</option>
              </select>
              <input id="converter-value" placeholder="Enter a value" value="1" />
            </div>
            <div class="grid" style="margin-top:12px">
              <select id="converter-from"></select>
              <select id="converter-to"></select>
            </div>
            <div class="row">
              <button id="convert-now">Convert</button>
            </div>
          </section>
          <section class="panel">
            <h3 style="margin-top:0">Result</h3>
            <div id="converter-result" style="font-size:28px;font-weight:800"></div>
          </section>
          <section id="status" class="status">This tool runs fully in the browser.</section>
        </section>
      `;
    case "persistent_tracker":
      return `
        <section class="stack">
          <section class="panel">
            <div class="grid">
              ${config.trackerSpec.fields
                .map((field) =>
                  field.type === "notes"
                    ? `<textarea data-field="${escapeHtml(field.id)}" placeholder="${escapeHtml(field.placeholder)}"></textarea>`
                    : `<input data-field="${escapeHtml(field.id)}" type="${escapeHtml(field.type)}" placeholder="${escapeHtml(field.placeholder)}" />`
                )
                .join("")}
            </div>
            <div class="row">
              <button id="tracker-save-entry">${escapeHtml(config.trackerSpec.primaryActionLabel)}</button>
            </div>
          </section>
          <section class="panel">
            <h3 style="margin-top:0">Saved items</h3>
            <div id="tracker-empty">${escapeHtml(config.trackerSpec.emptyStateBody)}</div>
            <div id="tracker-entries" class="stack"></div>
          </section>
          <section class="panel">
            <h3 style="margin-top:0">Notes</h3>
            <textarea id="tracker-notes" placeholder="Persistent notes for this app"></textarea>
            <div class="row">
              <button id="tracker-save-notes" class="secondary">Save Notes</button>
            </div>
          </section>
          <section id="status" class="status">Entries are saved on the backend by app and owner.</section>
        </section>
      `;
  }
}

function renderClientScript(config: HostedAppConfig) {
  switch (config.kind) {
    case "image_to_pdf":
      return `
        const filesInput = document.getElementById('image-files');
        const preview = document.getElementById('image-preview');

        filesInput?.addEventListener('change', (event) => {
          preview.innerHTML = '';
          Array.from(event.target.files || []).forEach((file) => {
            const url = URL.createObjectURL(file);
            const img = document.createElement('img');
            img.src = url;
            preview.appendChild(img);
          });
        });

        document.getElementById('image-pdf-run')?.addEventListener('click', async () => {
          const files = Array.from(filesInput.files || []);
          if (files.length === 0) return;
          showStatus('Building PDF...');
          try {
            const formData = new FormData();
            files.forEach((file) => formData.append('files', file));
            const blob = await fetchBlob('/api/hosted-apps/' + appId + '/run/image-to-pdf', { method: 'POST', body: formData });
            downloadBlob(blob, 'image-to-pdf.pdf');
            showStatus('PDF ready.');
          } catch (error) {
            showStatus(error.message, true);
          }
        });
      `;
    case "image_studio":
      return `
        const studioFile = document.getElementById('studio-file');
        const studioPreview = document.getElementById('studio-preview');
        document.getElementById('studio-run')?.addEventListener('click', async () => {
          if (!studioFile.files?.[0]) return;
          showStatus('Processing image...');
          try {
            const formData = new FormData();
            formData.append('file', studioFile.files[0]);
            formData.append('width', document.getElementById('studio-width').value);
            formData.append('height', document.getElementById('studio-height').value);
            formData.append('format', document.getElementById('studio-format').value);
            formData.append('rotate', document.getElementById('studio-rotate').value);
            formData.append('quality', document.getElementById('studio-quality').value);
            formData.append('watermark', document.getElementById('studio-watermark').value);
            formData.append('grayscale', String(document.getElementById('studio-grayscale').checked));
            const blob = await fetchBlob('/api/hosted-apps/' + appId + '/run/image-studio', { method: 'POST', body: formData });
            const previewUrl = URL.createObjectURL(blob);
            studioPreview.src = previewUrl;
            studioPreview.classList.remove('hidden');
            downloadBlob(blob, 'edited-image');
            showStatus('Image processed.');
          } catch (error) {
            showStatus(error.message, true);
          }
        });
      `;
    case "text_to_pdf":
      return `
        document.getElementById('text-pdf-run')?.addEventListener('click', async () => {
          showStatus('Generating PDF...');
          try {
            const blob = await fetchBlob('/api/hosted-apps/' + appId + '/run/text-to-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: document.getElementById('pdf-title').value,
                author: document.getElementById('pdf-author').value,
                text: document.getElementById('pdf-text').value
              })
            });
            const title = document.getElementById('pdf-title').value || 'document';
            downloadBlob(blob, title.replace(/\\s+/g, '-').toLowerCase() + '.pdf');
            showStatus('PDF ready.');
          } catch (error) {
            showStatus(error.message, true);
          }
        });
      `;
    case "qr_generator":
      return `
        const qrCanvas = document.getElementById('qr-canvas');
        const qrInput = document.getElementById('qr-text');
        const previewQr = new QRious({ element: qrCanvas, value: 'https://example.com', size: 320, foreground: appConfig.accent });

        document.getElementById('qr-preview-run')?.addEventListener('click', () => {
          previewQr.value = qrInput.value || ' ';
          showStatus('Preview updated.');
        });

        document.getElementById('qr-download-run')?.addEventListener('click', async () => {
          showStatus('Generating QR...');
          try {
            const blob = await fetchBlob('/api/hosted-apps/' + appId + '/run/qr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: qrInput.value })
            });
            downloadBlob(blob, 'qr-code.png');
            showStatus('QR downloaded.');
          } catch (error) {
            showStatus(error.message, true);
          }
        });
      `;
    case "csv_json_converter":
      return `
        const converterInput = document.getElementById('converter-input');
        const converterOutput = document.getElementById('converter-output');
        let converterMode = 'csv_to_json';

        document.getElementById('csv-to-json')?.addEventListener('click', () => {
          converterMode = 'csv_to_json';
          showStatus('Mode set to CSV to JSON.');
        });

        document.getElementById('json-to-csv')?.addEventListener('click', () => {
          converterMode = 'json_to_csv';
          showStatus('Mode set to JSON to CSV.');
        });

        document.getElementById('converter-run')?.addEventListener('click', async () => {
          showStatus('Converting data...');
          try {
            const blob = await fetchBlob('/api/hosted-apps/' + appId + '/run/structured-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mode: converterMode,
                input: converterInput.value
              })
            });
            const text = await blob.text();
            converterOutput.textContent = text;
            downloadBlob(new Blob([text], { type: blob.type }), converterMode === 'csv_to_json' ? 'converted.json' : 'converted.csv');
            showStatus('Conversion complete.');
          } catch (error) {
            showStatus(error.message, true);
          }
        });
      `;
    case "unit_converter":
      return `
        const groups = {
          length: {
            units: ['meters', 'kilometers', 'miles', 'feet'],
            toBase: { meters: (v) => v, kilometers: (v) => v * 1000, miles: (v) => v * 1609.344, feet: (v) => v * 0.3048 },
            fromBase: { meters: (v) => v, kilometers: (v) => v / 1000, miles: (v) => v / 1609.344, feet: (v) => v / 0.3048 }
          },
          weight: {
            units: ['grams', 'kilograms', 'pounds'],
            toBase: { grams: (v) => v, kilograms: (v) => v * 1000, pounds: (v) => v * 453.59237 },
            fromBase: { grams: (v) => v, kilograms: (v) => v / 1000, pounds: (v) => v / 453.59237 }
          },
          time: {
            units: ['seconds', 'minutes', 'hours', 'days'],
            toBase: { seconds: (v) => v, minutes: (v) => v * 60, hours: (v) => v * 3600, days: (v) => v * 86400 },
            fromBase: { seconds: (v) => v, minutes: (v) => v / 60, hours: (v) => v / 3600, days: (v) => v / 86400 }
          },
          temperature: {
            units: ['celsius', 'fahrenheit', 'kelvin'],
            toBase: {
              celsius: (v) => v,
              fahrenheit: (v) => (v - 32) * 5 / 9,
              kelvin: (v) => v - 273.15
            },
            fromBase: {
              celsius: (v) => v,
              fahrenheit: (v) => (v * 9 / 5) + 32,
              kelvin: (v) => v + 273.15
            }
          }
        };
        const groupSelect = document.getElementById('converter-group');
        const fromSelect = document.getElementById('converter-from');
        const toSelect = document.getElementById('converter-to');
        const valueInput = document.getElementById('converter-value');
        const result = document.getElementById('converter-result');

        function renderUnitOptions() {
          const group = groups[groupSelect.value];
          fromSelect.innerHTML = group.units.map((unit) => '<option value="' + unit + '">' + unit + '</option>').join('');
          toSelect.innerHTML = group.units.map((unit) => '<option value="' + unit + '">' + unit + '</option>').join('');
          toSelect.selectedIndex = Math.min(1, group.units.length - 1);
        }

        function convertNow() {
          const group = groups[groupSelect.value];
          const value = Number(valueInput.value || 0);
          const base = group.toBase[fromSelect.value](value);
          const converted = group.fromBase[toSelect.value](base);
          result.textContent = converted.toFixed(4).replace(/\\.0+$/, '') + ' ' + toSelect.value;
        }

        groupSelect.addEventListener('change', () => { renderUnitOptions(); convertNow(); });
        document.getElementById('convert-now')?.addEventListener('click', convertNow);
        renderUnitOptions();
        convertNow();
      `;
    case "persistent_tracker":
      return `
        const saveEntryButton = document.getElementById('tracker-save-entry');
        const saveNotesButton = document.getElementById('tracker-save-notes');
        const entriesRoot = document.getElementById('tracker-entries');
        const emptyState = document.getElementById('tracker-empty');
        const notesField = document.getElementById('tracker-notes');

        function entryMarkup(entry) {
          const fields = appConfig.trackerSpec.fields
            .map((field) => entry.values[field.id] ? '<div><small>' + field.label + '</small><div>' + entry.values[field.id] + '</div></div>' : '')
            .join('');
          return '<article class="entry"><strong>' + (entry.values[appConfig.trackerSpec.fields[0].id] || 'Untitled') + '</strong><div><small>' + new Date(entry.createdAt).toLocaleString() + '</small></div><div class="grid" style="margin-top:10px">' + fields + '</div></article>';
        }

        function renderState(state) {
          notesField.value = state.notes || '';
          entriesRoot.innerHTML = state.entries.map(entryMarkup).join('');
          emptyState.classList.toggle('hidden', state.entries.length > 0);
        }

        async function currentState() {
          return loadState().catch(() => ({ entries: [], notes: '' }));
        }

        saveEntryButton?.addEventListener('click', async () => {
          const values = {};
          let hasContent = false;
          document.querySelectorAll('[data-field]').forEach((element) => {
            const key = element.getAttribute('data-field');
            const value = element.value || '';
            values[key] = value;
            if (value.trim()) hasContent = true;
          });

          if (!hasContent) return;

          try {
            const state = await currentState();
            state.entries.unshift({
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              values
            });
            await saveState(state);
            document.querySelectorAll('[data-field]').forEach((element) => { element.value = ''; });
            renderState(state);
            showStatus('Entry saved.');
          } catch (error) {
            showStatus(error.message, true);
          }
        });

        saveNotesButton?.addEventListener('click', async () => {
          try {
            const state = await currentState();
            state.notes = notesField.value || '';
            await saveState(state);
            showStatus('Notes saved.');
          } catch (error) {
            showStatus(error.message, true);
          }
        });

        currentState().then(renderState).catch((error) => showStatus(error.message, true));
      `;
  }
}

function sendAttachment(res: Parameters<Router["get"]>[1] extends never ? never : any, buffer: Buffer, filename: string, contentType: string) {
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
