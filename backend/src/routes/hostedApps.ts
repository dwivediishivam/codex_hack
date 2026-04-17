import { Router } from "express";
import { z } from "zod";
import { readGeneratedAppDocument } from "../services/generatedAppStore.js";
import { readHostedAppState, writeHostedAppState } from "../services/hostedAppStateStore.js";
import type { HostedAppConfig, HostedAppStateEntry, HostedAppUserState, StoredGeneratedApp } from "../types/hostedApp.js";

export const hostedAppsRouter = Router();
export const hostedAppsApiRouter = Router();

hostedAppsRouter.get("/:id", (req, res) => {
  void (async () => {
    try {
      const document = await readGeneratedAppDocument<StoredGeneratedApp>(req.params.id);

      if (document.mode !== "hosted") {
        return res.status(404).type("html").send("<h1>Hosted app not found</h1>");
      }

      res.type("html").send(renderHostedAppHtml(req.params.id, document));
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
    const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId.trim() : "";
    if (!ownerId) {
      return res.status(400).json({ error: "ownerId is required" });
    }

    try {
      const state = await readHostedAppState(req.params.id, ownerId);
      return res.json(state);
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  })();
});

hostedAppsApiRouter.post("/:id/state", (req, res) => {
  void (async () => {
    const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId.trim() : "";
    if (!ownerId) {
      return res.status(400).json({ error: "ownerId is required" });
    }

    const parsed = stateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid state payload", details: parsed.error.flatten() });
    }

    try {
      await writeHostedAppState(req.params.id, ownerId, parsed.data);
      return res.json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  })();
});

function renderHostedAppHtml(appId: string, config: HostedAppConfig) {
  const ownerQuery = encodeURIComponent(config.ownerId);
  const escapedTitle = escapeHtml(config.name);
  const escapedSummary = escapeHtml(config.summary);
  const commonShell = `
    <style>
      :root {
        --accent: ${escapeHtml(config.accent)};
        --bg: #f5efe4;
        --card: rgba(255,255,255,0.92);
        --ink: #161616;
        --muted: #5e5e5e;
        --line: rgba(22,22,22,0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(255,255,255,0.95), transparent 36%),
          linear-gradient(180deg, #efe6d5 0%, #f9f6ef 45%, #f2ecdf 100%);
        min-height: 100vh;
      }
      a { color: inherit; }
      .shell {
        width: min(760px, calc(100vw - 28px));
        margin: 24px auto;
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 28px;
        padding: 24px;
        box-shadow: 0 24px 60px rgba(56, 47, 22, 0.12);
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
        background: color-mix(in srgb, var(--accent) 16%, white);
        color: var(--accent);
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      h1 { margin: 12px 0 8px; font-size: clamp(28px, 4vw, 42px); line-height: 1.02; }
      p { margin: 0; color: var(--muted); line-height: 1.5; }
      .stack { display: grid; gap: 16px; }
      .panel {
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(255,255,255,0.82);
        padding: 18px;
      }
      input, textarea, select, button {
        font: inherit;
      }
      input, textarea, select {
        width: 100%;
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid rgba(22,22,22,0.12);
        background: #fff;
      }
      textarea { min-height: 140px; resize: vertical; }
      button {
        border: 0;
        cursor: pointer;
        border-radius: 16px;
        padding: 14px 18px;
        background: var(--accent);
        color: white;
        font-weight: 700;
      }
      button.secondary {
        background: #f2f2f2;
        color: #202020;
      }
      .row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }
      .entry {
        border-radius: 18px;
        border: 1px solid var(--line);
        padding: 14px;
        background: white;
      }
      .entry small, .muted { color: var(--muted); }
      .hidden { display: none !important; }
      .dropzone {
        border: 2px dashed color-mix(in srgb, var(--accent) 30%, white);
        border-radius: 20px;
        padding: 22px;
        text-align: center;
        background: color-mix(in srgb, var(--accent) 6%, white);
      }
      .actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 12px;
      }
      .preview {
        display: grid;
        gap: 12px;
      }
      .preview img, canvas {
        max-width: 100%;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: white;
      }
      .code {
        white-space: pre-wrap;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 13px;
        background: #0f172a;
        color: #e2e8f0;
        padding: 16px;
        border-radius: 18px;
      }
      @media (max-width: 640px) {
        .shell { margin: 0; width: 100vw; min-height: 100vh; border-radius: 0; }
        .hero { flex-direction: column; }
      }
    </style>
  `;

  const header = `
    <section class="hero">
      <div>
        <span class="badge">${escapeHtml(config.kind.replaceAll("_", " "))}</span>
        <h1>${escapedTitle}</h1>
        <p>${escapedSummary}</p>
      </div>
      <a href="/" style="text-decoration:none" class="badge">Back</a>
    </section>
  `;

  const pageScript = renderHostedAppScript(appId, config, ownerQuery);

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapedTitle}</title>
      ${commonShell}
    </head>
    <body>
      <main class="shell">
        ${header}
        ${renderHostedAppBody(config)}
      </main>
      ${pageScript}
    </body>
  </html>`;
}

function renderHostedAppBody(config: HostedAppConfig) {
  switch (config.kind) {
    case "image_to_pdf":
      return `
        <section class="stack">
          <section class="panel dropzone">
            <input id="image-files" type="file" accept="image/*" multiple />
            <p class="muted" style="margin-top:10px">Pick one or more images. The app will export a single PDF.</p>
            <div class="actions">
              <button id="image-pdf-download">Download PDF</button>
            </div>
          </section>
          <section class="panel preview" id="image-preview"></section>
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
            <textarea id="pdf-text" placeholder="Write or paste your text"></textarea>
            <div class="actions">
              <button id="text-pdf-download">Download PDF</button>
            </div>
          </section>
        </section>
      `;
    case "qr_generator":
      return `
        <section class="stack">
          <section class="panel">
            <input id="qr-text" placeholder="Paste a link, text, or contact payload" />
            <div class="actions">
              <button id="qr-generate">Generate QR</button>
              <button id="qr-download" class="secondary">Download PNG</button>
            </div>
          </section>
          <section class="panel preview">
            <canvas id="qr-canvas" width="320" height="320"></canvas>
          </section>
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
            <p class="muted" style="margin-top:10px">Paste CSV with a header row, or paste a JSON array of objects.</p>
          </section>
          <section class="panel">
            <textarea id="converter-input" placeholder="Paste CSV or JSON here"></textarea>
          </section>
          <section class="panel">
            <div class="actions">
              <button id="converter-download">Download Result</button>
            </div>
            <div id="converter-output" class="code"></div>
          </section>
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
            <div class="actions">
              <button id="convert-now">Convert</button>
            </div>
          </section>
          <section class="panel">
            <h3 style="margin-top:0">Result</h3>
            <div id="converter-result" style="font-size:28px;font-weight:800"></div>
          </section>
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
            <div class="actions">
              <button id="tracker-save-entry">${escapeHtml(config.trackerSpec.primaryActionLabel)}</button>
            </div>
          </section>
          <section class="panel">
            <h3 style="margin-top:0">Saved items</h3>
            <div id="tracker-empty" class="muted">${escapeHtml(config.trackerSpec.emptyStateBody)}</div>
            <div id="tracker-entries" class="stack"></div>
          </section>
          <section class="panel">
            <h3 style="margin-top:0">Notes</h3>
            <textarea id="tracker-notes" placeholder="Persistent notes for this app"></textarea>
            <div class="actions">
              <button id="tracker-save-notes" class="secondary">Save Notes</button>
            </div>
          </section>
        </section>
      `;
  }
}

function renderHostedAppScript(appId: string, config: HostedAppConfig, ownerQuery: string) {
  const configJson = JSON.stringify(config);
  return `
    <script>
      const appId = ${JSON.stringify(appId)};
      const ownerId = decodeURIComponent(${JSON.stringify(ownerQuery)});
      const appConfig = ${configJson};

      function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      }

      ${renderSharedStateHelpers()}
      ${renderTrackerScript(config)}
      ${renderImageToPdfScript(config)}
      ${renderTextToPdfScript(config)}
      ${renderQrScript(config)}
      ${renderCsvJsonScript(config)}
      ${renderUnitConverterScript(config)}
    </script>
    <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js"></script>
  `;
}

function renderSharedStateHelpers() {
  return `
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
  `;
}

function renderTrackerScript(config: HostedAppConfig) {
  if (config.kind !== "persistent_tracker") {
    return "";
  }

  return `
    if (appConfig.kind === 'persistent_tracker') {
      const saveEntryButton = document.getElementById('tracker-save-entry');
      const saveNotesButton = document.getElementById('tracker-save-notes');
      const entriesRoot = document.getElementById('tracker-entries');
      const emptyState = document.getElementById('tracker-empty');
      const notesField = document.getElementById('tracker-notes');

      function entryMarkup(entry) {
        const fields = appConfig.trackerSpec.fields
          .map((field) => entry.values[field.id] ? '<div><small>' + field.label + '</small><div>' + entry.values[field.id] + '</div></div>' : '')
          .join('');
        return '<article class="entry"><strong>' + (entry.values[appConfig.trackerSpec.fields[0].id] || 'Untitled') + '</strong><div class="muted">' + new Date(entry.createdAt).toLocaleString() + '</div><div class="grid" style="margin-top:10px">' + fields + '</div></article>';
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

        const state = await currentState();
        state.entries.unshift({
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          values
        });
        await saveState(state);
        document.querySelectorAll('[data-field]').forEach((element) => { element.value = ''; });
        renderState(state);
      });

      saveNotesButton?.addEventListener('click', async () => {
        const state = await currentState();
        state.notes = notesField.value || '';
        await saveState(state);
      });

      currentState().then(renderState);
    }
  `;
}

function renderImageToPdfScript(config: HostedAppConfig) {
  if (config.kind !== "image_to_pdf") {
    return "";
  }

  return `
    if (appConfig.kind === 'image_to_pdf') {
      const filesInput = document.getElementById('image-files');
      const preview = document.getElementById('image-preview');
      const download = document.getElementById('image-pdf-download');
      let selectedFiles = [];

      filesInput?.addEventListener('change', async (event) => {
        selectedFiles = Array.from(event.target.files || []);
        preview.innerHTML = '';
        for (const file of selectedFiles) {
          const url = URL.createObjectURL(file);
          const img = document.createElement('img');
          img.src = url;
          preview.appendChild(img);
        }
      });

      download?.addEventListener('click', async () => {
        if (selectedFiles.length === 0 || !window.jspdf) return;
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: 'pt', format: 'a4' });

        for (let index = 0; index < selectedFiles.length; index += 1) {
          const file = selectedFiles[index];
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          const image = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = dataUrl;
          });
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const ratio = Math.min(pageWidth / image.width, pageHeight / image.height);
          const width = image.width * ratio;
          const height = image.height * ratio;
          const x = (pageWidth - width) / 2;
          const y = (pageHeight - height) / 2;
          if (index > 0) pdf.addPage();
          pdf.addImage(dataUrl, 'JPEG', x, y, width, height);
        }

        pdf.save('image-to-pdf.pdf');
      });
    }
  `;
}

function renderTextToPdfScript(config: HostedAppConfig) {
  if (config.kind !== "text_to_pdf") {
    return "";
  }

  return `
    if (appConfig.kind === 'text_to_pdf') {
      document.getElementById('text-pdf-download')?.addEventListener('click', () => {
        if (!window.jspdf) return;
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
        const title = document.getElementById('pdf-title').value || 'Document';
        const author = document.getElementById('pdf-author').value || '';
        const text = document.getElementById('pdf-text').value || '';
        pdf.setProperties({ title, author });
        pdf.setFontSize(22);
        pdf.text(title, 40, 56);
        pdf.setFontSize(12);
        const lines = pdf.splitTextToSize(text || ' ', 515);
        pdf.text(lines, 40, 92);
        pdf.save((title || 'document').replace(/\\s+/g, '-').toLowerCase() + '.pdf');
      });
    }
  `;
}

function renderQrScript(config: HostedAppConfig) {
  if (config.kind !== "qr_generator") {
    return "";
  }

  return `
    if (appConfig.kind === 'qr_generator') {
      const canvas = document.getElementById('qr-canvas');
      const input = document.getElementById('qr-text');
      const qr = new QRious({ element: canvas, value: 'https://example.com', size: 320, foreground: appConfig.accent });

      document.getElementById('qr-generate')?.addEventListener('click', () => {
        qr.value = input.value || ' ';
      });

      document.getElementById('qr-download')?.addEventListener('click', () => {
        canvas.toBlob((blob) => {
          if (blob) downloadBlob(blob, 'qr-code.png');
        });
      });
    }
  `;
}

function renderCsvJsonScript(config: HostedAppConfig) {
  if (config.kind !== "csv_json_converter") {
    return "";
  }

  return `
    if (appConfig.kind === 'csv_json_converter') {
      const input = document.getElementById('converter-input');
      const output = document.getElementById('converter-output');
      let lastResult = '';
      let lastFilename = 'converted.txt';

      function parseCsv(csv) {
        const lines = csv.trim().split(/\\r?\\n/).filter(Boolean);
        const headers = lines.shift().split(',').map((value) => value.trim());
        return lines.map((line) => {
          const cells = line.split(',');
          return Object.fromEntries(headers.map((header, index) => [header, (cells[index] || '').trim()]));
        });
      }

      function toCsv(rows) {
        if (!Array.isArray(rows) || rows.length === 0) return '';
        const headers = Array.from(rows.reduce((set, row) => {
          Object.keys(row || {}).forEach((key) => set.add(key));
          return set;
        }, new Set()));
        const lines = [headers.join(',')];
        rows.forEach((row) => {
          lines.push(headers.map((header) => JSON.stringify(row[header] ?? '')).join(','));
        });
        return lines.join('\\n');
      }

      document.getElementById('csv-to-json')?.addEventListener('click', () => {
        const result = JSON.stringify(parseCsv(input.value || ''), null, 2);
        lastResult = result;
        lastFilename = 'converted.json';
        output.textContent = result;
      });

      document.getElementById('json-to-csv')?.addEventListener('click', () => {
        const parsed = JSON.parse(input.value || '[]');
        const result = toCsv(parsed);
        lastResult = result;
        lastFilename = 'converted.csv';
        output.textContent = result;
      });

      document.getElementById('converter-download')?.addEventListener('click', () => {
        if (!lastResult) return;
        downloadBlob(new Blob([lastResult], { type: 'text/plain;charset=utf-8' }), lastFilename);
      });
    }
  `;
}

function renderUnitConverterScript(config: HostedAppConfig) {
  if (config.kind !== "unit_converter") {
    return "";
  }

  return `
    if (appConfig.kind === 'unit_converter') {
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
    }
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
