import { buildHostedAppConfig } from "./hostedAppGenerator.js";
import { maybeRenderAiLiveBundle } from "./liveBundleAiRenderer.js";
import type { LiveBundleV2Document } from "../types/liveBundleV2.js";
import type { HostedAppConfig } from "../types/hostedApp.js";

export async function buildLiveBundleV2Document(input: {
  appId: string;
  prompt: string;
  ownerId: string;
}) {
  const hostedApp = await buildHostedAppConfig(input.prompt, input.ownerId);
  const focus = hostedApp.kind === "persistent_tracker"
    ? hostedApp.trackerSpec.focus
    : deriveFocusFromPrompt(input.prompt);
  const fallbackHtml = renderLiveBundleHtml({
    appId: input.appId,
    prompt: input.prompt,
    ownerId: input.ownerId,
    focus,
    hostedApp
  });
  const rendered = await maybeRenderAiLiveBundle({
    appId: input.appId,
    prompt: input.prompt,
    ownerId: input.ownerId,
    focus,
    hostedApp,
    fallbackHtml
  });
  hostedApp.name = rendered.name;
  hostedApp.summary = rendered.summary;

  return {
    mode: "bundle_v2",
    version: 2,
    appId: input.appId,
    name: rendered.name,
    summary: rendered.summary,
    prompt: input.prompt,
    ownerId: input.ownerId,
    accent: hostedApp.accent,
    primaryKind: hostedApp.kind,
    focus,
    createdAt: new Date().toISOString(),
    hostedApp,
    bundleHtml: rendered.html
  } satisfies LiveBundleV2Document;
}

function renderLiveBundleHtml(input: {
  appId: string;
  prompt: string;
  ownerId: string;
  focus: string[];
  hostedApp: HostedAppConfig;
}) {
  const escapedName = escapeHtml(input.hostedApp.name);
  const escapedSummary = escapeHtml(input.hostedApp.summary);
  const escapedPrompt = escapeHtml(input.prompt);
  const focusMarkup = input.focus
    .slice(0, 4)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

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
        .grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
        .two-up { display: grid; gap: 16px; grid-template-columns: 1fr 1fr; }
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
        button.secondary {
          background: #edf2f8;
          color: var(--ink);
        }
        .row { display: flex; gap: 12px; flex-wrap: wrap; }
        .tool-card h2, .panel h2 { margin: 0 0 10px; font-size: 1.06rem; }
        .code {
          min-height: 160px;
          border-radius: 18px;
          background: #0f172a;
          color: #dbe4f0;
          padding: 16px;
          font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
          white-space: pre-wrap;
        }
        .entry {
          border-radius: 16px;
          border: 1px solid var(--line);
          background: white;
          padding: 14px;
        }
        .status {
          margin-top: 12px;
          border-radius: 18px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.92);
          border: 1px solid var(--line);
          color: var(--muted);
        }
        .drop {
          border: 2px dashed color-mix(in srgb, var(--accent) 30%, white);
          background: color-mix(in srgb, var(--accent) 7%, white);
          text-align: center;
        }
        .preview img, .preview canvas {
          max-width: 100%;
          border-radius: 20px;
          border: 1px solid var(--line);
          background: white;
        }
        .hidden { display: none !important; }
        .prompt-box {
          margin-top: 16px;
          border-radius: 18px;
          border: 1px dashed color-mix(in srgb, var(--accent) 26%, white);
          background: rgba(255,255,255,0.78);
          padding: 14px 16px;
        }
        @media (max-width: 800px) {
          main { width: 100vw; margin: 0; border-radius: 0; min-height: 100vh; }
          .hero, .two-up { grid-template-columns: 1fr; }
        }
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
            <p style="margin-top:12px">This V2 build is materialized at creation time and served from its own URL instead of reusing a store template route.</p>
          </section>
        </section>
        <section class="stack">
          ${renderToolMarkup(input.hostedApp)}
          <section id="status" class="status">Ready. This app was generated and published to its own endpoint.</section>
        </section>
      </main>
      <script>
        const appId = ${JSON.stringify(input.appId)};
        const ownerId = ${JSON.stringify(input.ownerId)};
        const appConfig = ${JSON.stringify(input.hostedApp)};

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

        ${renderToolScript(input.hostedApp)}
      </script>
      <script src="https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js"></script>
    </body>
  </html>`;
}

function renderToolMarkup(config: HostedAppConfig) {
  switch (config.kind) {
    case "image_to_pdf":
      return `
        <section class="tool-card drop stack">
          <div>
            <h2>Images To PDF</h2>
            <p>Upload one or more images and export them into a single PDF.</p>
          </div>
          <input id="image-files" type="file" accept="image/*" multiple />
          <div id="image-preview" class="preview grid"></div>
          <div class="row"><button id="image-pdf-run">Build PDF</button></div>
        </section>
      `;
    case "image_studio":
      return `
        <section class="tool-card stack">
          <div>
            <h2>Image Studio</h2>
            <p>Use the controls generated for this image workflow and process everything on the backend.</p>
          </div>
          <section class="drop tool-card" style="padding:16px">
            <input id="studio-file" type="file" accept="image/*" />
          </section>
          <section class="grid">
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
          </section>
          <label style="display:flex;gap:10px;align-items:center">
            <input id="studio-grayscale" type="checkbox" style="width:auto" />
            <span>Grayscale</span>
          </label>
          <div class="row"><button id="studio-run">Process Image</button></div>
          <section class="preview"><img id="studio-preview" class="hidden" alt="Preview" /></section>
        </section>
      `;
    case "pdf_studio":
      return `
        <section class="tool-card stack">
          <div>
            <h2>PDF Studio</h2>
            <p>This app starts with defaults detected from your prompt, but you can adjust them before running.</p>
          </div>
          <section class="drop tool-card" style="padding:16px">
            <input id="pdf-studio-file" type="file" accept="application/pdf" />
          </section>
          <section class="grid">
            <input id="pdf-studio-top" type="number" min="0" max="90" value="${escapeHtml(String(config.pdfSpec.trimTopPercent))}" placeholder="Trim top %" />
            <input id="pdf-studio-bottom" type="number" min="0" max="90" value="${escapeHtml(String(config.pdfSpec.trimBottomPercent))}" placeholder="Trim bottom %" />
            <input id="pdf-studio-left" type="number" min="0" max="90" value="${escapeHtml(String(config.pdfSpec.trimLeftPercent))}" placeholder="Trim left %" />
            <input id="pdf-studio-right" type="number" min="0" max="90" value="${escapeHtml(String(config.pdfSpec.trimRightPercent))}" placeholder="Trim right %" />
          </section>
          <label style="display:flex;gap:10px;align-items:center">
            <input id="pdf-studio-preserve" type="checkbox" style="width:auto" ${config.pdfSpec.preservePageSize ? "checked" : ""} />
            <span>Keep original page size and leave removed space blank</span>
          </label>
          <div class="row"><button id="pdf-studio-run">Process PDF</button></div>
        </section>
      `;
    case "text_to_pdf":
      return `
        <section class="tool-card stack">
          <div>
            <h2>Text To PDF</h2>
            <p>Write or paste content and export it as a PDF generated on the backend.</p>
          </div>
          <section class="grid">
            <input id="pdf-title" placeholder="Document title" />
            <input id="pdf-author" placeholder="Author" />
          </section>
          <textarea id="pdf-text" placeholder="Write or paste your content"></textarea>
          <div class="row"><button id="text-pdf-run">Download PDF</button></div>
        </section>
      `;
    case "qr_generator":
      return `
        <section class="two-up">
          <section class="tool-card stack">
            <div>
              <h2>QR Generator</h2>
              <p>Generate a QR code from text or a URL and download it instantly.</p>
            </div>
            <input id="qr-text" placeholder="Paste text or a URL" />
            <div class="row">
              <button id="qr-preview-run">Preview</button>
              <button id="qr-download-run" class="secondary">Download PNG</button>
            </div>
          </section>
          <section class="tool-card preview">
            <canvas id="qr-canvas" width="320" height="320"></canvas>
          </section>
        </section>
      `;
    case "csv_json_converter":
      return `
        <section class="stack">
          <section class="tool-card">
            <div class="row">
              <button id="csv-to-json">CSV to JSON</button>
              <button id="json-to-csv" class="secondary">JSON to CSV</button>
            </div>
          </section>
          <section class="two-up">
            <section class="tool-card">
              <h2>Input</h2>
              <textarea id="converter-input" placeholder="Paste CSV or a JSON array of objects"></textarea>
            </section>
            <section class="tool-card">
              <h2>Output</h2>
              <div id="converter-output" class="code"></div>
              <div class="row" style="margin-top:12px"><button id="converter-run">Convert and Download</button></div>
            </section>
          </section>
        </section>
      `;
    case "unit_converter":
      return `
        <section class="two-up">
          <section class="tool-card stack">
            <div>
              <h2>Unit Converter</h2>
              <p>Convert common measurement groups directly in the browser.</p>
            </div>
            <section class="grid">
              <select id="converter-group">
                <option value="length">Length</option>
                <option value="weight">Weight</option>
                <option value="temperature">Temperature</option>
                <option value="time">Time</option>
              </select>
              <input id="converter-value" value="1" placeholder="Enter a value" />
            </section>
            <section class="grid">
              <select id="converter-from"></select>
              <select id="converter-to"></select>
            </section>
            <div class="row"><button id="convert-now">Convert</button></div>
          </section>
          <section class="tool-card">
            <h2>Result</h2>
            <div id="converter-result" style="font-size:34px;font-weight:800"></div>
          </section>
        </section>
      `;
    case "persistent_tracker":
      return `
        <section class="stack">
          <section class="tool-card stack">
            <div>
              <h2>${escapeHtml(config.trackerSpec.name)}</h2>
              <p>${escapeHtml(config.trackerSpec.description)}</p>
            </div>
            <section class="grid">
              ${config.trackerSpec.fields
                .map((field) =>
                  field.type === "notes"
                    ? `<textarea data-field="${escapeHtml(field.id)}" placeholder="${escapeHtml(field.placeholder)}"></textarea>`
                    : `<input data-field="${escapeHtml(field.id)}" type="${escapeHtml(field.type)}" placeholder="${escapeHtml(field.placeholder)}" />`
                )
                .join("")}
            </section>
            <div class="row">
              <button id="tracker-save-entry">${escapeHtml(config.trackerSpec.primaryActionLabel)}</button>
            </div>
          </section>
          <section class="two-up">
            <section class="tool-card">
              <h2>Entries</h2>
              <div id="tracker-empty">${escapeHtml(config.trackerSpec.emptyStateBody)}</div>
              <div id="tracker-entries" class="stack"></div>
            </section>
            <section class="tool-card">
              <h2>Notes</h2>
              <textarea id="tracker-notes" placeholder="Persistent notes for this app"></textarea>
              <div class="row" style="margin-top:12px"><button id="tracker-save-notes" class="secondary">Save Notes</button></div>
            </section>
          </section>
        </section>
      `;
  }
}

function renderToolScript(config: HostedAppConfig) {
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
            const blob = await fetchBlob('/api/v2/hosted/' + appId + '/run/image-to-pdf', { method: 'POST', body: formData });
            downloadBlob(blob, 'generated-image-pack.pdf');
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
            const blob = await fetchBlob('/api/v2/hosted/' + appId + '/run/image-studio', { method: 'POST', body: formData });
            const previewUrl = URL.createObjectURL(blob);
            studioPreview.src = previewUrl;
            studioPreview.classList.remove('hidden');
            downloadBlob(blob, 'generated-image-output');
            showStatus('Image processed.');
          } catch (error) {
            showStatus(error.message, true);
          }
        });
      `;
    case "pdf_studio":
      return `
        const pdfStudioFile = document.getElementById('pdf-studio-file');
        document.getElementById('pdf-studio-run')?.addEventListener('click', async () => {
          if (!pdfStudioFile.files?.[0]) return;
          showStatus('Processing PDF...');
          try {
            const formData = new FormData();
            formData.append('file', pdfStudioFile.files[0]);
            formData.append('trimTopPercent', document.getElementById('pdf-studio-top').value);
            formData.append('trimBottomPercent', document.getElementById('pdf-studio-bottom').value);
            formData.append('trimLeftPercent', document.getElementById('pdf-studio-left').value);
            formData.append('trimRightPercent', document.getElementById('pdf-studio-right').value);
            formData.append('preservePageSize', String(document.getElementById('pdf-studio-preserve').checked));
            const blob = await fetchBlob('/api/v2/hosted/' + appId + '/run/pdf-studio', { method: 'POST', body: formData });
            downloadBlob(blob, 'generated-pdf-output.pdf');
            showStatus('PDF ready.');
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
            const blob = await fetchBlob('/api/v2/hosted/' + appId + '/run/text-to-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: document.getElementById('pdf-title').value,
                author: document.getElementById('pdf-author').value,
                text: document.getElementById('pdf-text').value
              })
            });
            const title = document.getElementById('pdf-title').value || 'generated-document';
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
            const blob = await fetchBlob('/api/v2/hosted/' + appId + '/run/qr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: qrInput.value })
            });
            downloadBlob(blob, 'generated-qr.png');
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
            const blob = await fetchBlob('/api/v2/hosted/' + appId + '/run/structured-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode: converterMode, input: converterInput.value })
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
          return fetchJson('/api/v2/hosted/' + appId + '/state?ownerId=' + encodeURIComponent(ownerId), { cache: 'no-store' })
            .catch(() => ({ entries: [], notes: '' }));
        }
        async function saveState(state) {
          return fetchJson('/api/v2/hosted/' + appId + '/state?ownerId=' + encodeURIComponent(ownerId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
          });
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
            state.entries.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), values });
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

function deriveFocusFromPrompt(prompt: string) {
  const cleaned = prompt
    .split(/,| and | with /i)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (cleaned.length > 0) {
    return cleaned.map((item) => sentenceCase(item));
  }

  return ["Prompt-shaped workflow", "Fresh hosted endpoint", "Downloadable output"];
}

function sentenceCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
