"use client";

import { jsPDF } from "jspdf";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";

type SpendTab = "Calculator" | "Profile";
type Basis = "work" | "life";
type PayMode = "year" | "month" | "hour";
type Currency = "USD" | "INR";

type PolaroidTab = "Overview" | "Single" | "Sheet";
type PolaroidAsset = {
  id: string;
  name: string;
  sourceUrl: string;
  polaroidUrl: string;
};

type PolaroidFormat = {
  id: "classic" | "square" | "wide";
  label: string;
  widthMm: number;
  heightMm: number;
  frame: string;
};

const polaroidFormats: PolaroidFormat[] = [
  { id: "classic", label: "Classic", widthMm: 88, heightMm: 107, frame: "88 x 107 mm" },
  { id: "square", label: "Square", widthMm: 80, heightMm: 100, frame: "80 x 100 mm" },
  { id: "wide", label: "Wide", widthMm: 108, heightMm: 86, frame: "108 x 86 mm" }
];

export default function MicroAppPage() {
  const params = useParams<{ slug: string }>();

  if (params.slug === "spend-hours") return <SpendHoursApp />;
  if (params.slug === "polaroid-print") return <PolaroidPrintApp />;

  return (
    <main className="micro-shell">
      <Link href="/" className="micro-back">
        Back
      </Link>
      <section className="micro-card">
        <h1>App not found</h1>
      </section>
    </main>
  );
}

function SpendHoursApp() {
  const [tab, setTab] = useState<SpendTab>("Calculator");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [payMode, setPayMode] = useState<PayMode>("month");
  const [payAmount, setPayAmount] = useState("90000");
  const [price, setPrice] = useState("3499");
  const [basis, setBasis] = useState<Basis>("work");
  const [hoursPerDay, setHoursPerDay] = useState("8");
  const [daysPerWeek, setDaysPerWeek] = useState("5");

  const effectiveHourly = useMemo(() => {
    const amount = toNumber(payAmount);
    const daily = Math.max(toNumber(hoursPerDay), 1);
    const weekly = Math.max(toNumber(daysPerWeek), 1);

    if (payMode === "hour") {
      if (basis === "work") return amount;
      return (amount * daily * weekly * 52) / (365 * 24);
    }

    if (payMode === "month") {
      if (basis === "life") return amount / (30.44 * 24);
      return amount / Math.max(daily * weekly * 4.33, 1);
    }

    if (basis === "life") return amount / (365 * 24);
    return amount / Math.max(daily * weekly * 52, 1);
  }, [basis, daysPerWeek, hoursPerDay, payAmount, payMode]);

  const totalHours = Math.max(toNumber(price), 0) / Math.max(effectiveHourly, 0.0001);
  const totalDays = basis === "life" ? totalHours / 24 : totalHours / Math.max(toNumber(hoursPerDay), 1);
  const symbol = currency === "INR" ? "₹" : "$";

  return (
    <MicroShell title="Spend Hours">
      <div className="micro-top">
        <p>See what a price costs in working time or life time.</p>
        <div className="segmented micro-tabs">
          {(["Calculator", "Profile"] as SpendTab[]).map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)} type="button">
              {item}
            </button>
          ))}
        </div>
      </div>

      {tab === "Calculator" ? (
        <div className="micro-stack centered-stack">
          <section className="price-card">
            <div className="currency-mark">{currency === "INR" ? "₹" : "$"}</div>
            <input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Enter a price" />
          </section>

          <section className="micro-result">
            <strong>{totalHours.toFixed(1)} hours</strong>
            <span>
              {totalDays.toFixed(1)} {basis === "life" ? "days of life" : "days of work"}
            </span>
          </section>

          <div className="metric-grid">
            <article className="metric-card">
              <span>Pay rate</span>
              <strong>
                {symbol}
                {effectiveHourly.toFixed(2)}/hour
              </strong>
            </article>
            <article className="metric-card">
              <span>Basis</span>
              <strong>{basis === "life" ? "Life hours" : "Working hours"}</strong>
            </article>
          </div>
        </div>
      ) : (
        <div className="micro-stack">
          <div className="segmented micro-tabs">
            {(["INR", "USD"] as Currency[]).map((item) => (
              <button key={item} className={currency === item ? "active" : ""} onClick={() => setCurrency(item)} type="button">
                {item === "INR" ? "₹ INR" : "$ USD"}
              </button>
            ))}
          </div>

          <div className="segmented micro-tabs">
            {(["year", "month", "hour"] as PayMode[]).map((item) => (
              <button key={item} className={payMode === item ? "active" : ""} onClick={() => setPayMode(item)} type="button">
                {item}
              </button>
            ))}
          </div>

          <input
            value={payAmount}
            onChange={(event) => setPayAmount(event.target.value)}
            placeholder={`Pay per ${payMode}`}
          />

          <div className="segmented micro-tabs">
            {(["work", "life"] as Basis[]).map((item) => (
              <button key={item} className={basis === item ? "active" : ""} onClick={() => setBasis(item)} type="button">
                {item === "work" ? "Working hours" : "Life hours"}
              </button>
            ))}
          </div>

          <div className="micro-inline">
            <input value={hoursPerDay} onChange={(event) => setHoursPerDay(event.target.value)} placeholder="Hours/day" />
            <input value={daysPerWeek} onChange={(event) => setDaysPerWeek(event.target.value)} placeholder="Days/week" />
          </div>
        </div>
      )}
    </MicroShell>
  );
}

function PolaroidPrintApp() {
  const [tab, setTab] = useState<PolaroidTab>("Overview");
  const [formatId, setFormatId] = useState<PolaroidFormat["id"]>("classic");
  const [assets, setAssets] = useState<PolaroidAsset[]>([]);
  const [singleAssetId, setSingleAssetId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const format = polaroidFormats.find((item) => item.id === formatId) ?? polaroidFormats[0];
  const singleAsset = assets.find((item) => item.id === singleAssetId) ?? assets[0] ?? null;
  const sheetLayout = useMemo(() => computeA4Layout(format), [format]);

  useEffect(() => {
    if (!singleAssetId && assets[0]) {
      setSingleAssetId(assets[0].id);
    }
  }, [assets, singleAssetId]);

  useEffect(() => {
    if (assets.length === 0) return;

    let cancelled = false;
    setIsProcessing(true);

    void Promise.all(
      assets.map(async (asset) => ({
        ...asset,
        polaroidUrl: await renderPolaroid(asset.sourceUrl, format)
      }))
    ).then((nextAssets) => {
      if (cancelled) return;
      setAssets(nextAssets);
      setIsProcessing(false);
    }).catch(() => {
      if (cancelled) return;
      setIsProcessing(false);
    });

    return () => {
      cancelled = true;
    };
  }, [formatId]);

  async function onPickSingle(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const asset = await buildPolaroidAsset(file, format);
    setAssets([asset]);
    setSingleAssetId(asset.id);
    setIsProcessing(false);
  }

  async function onPickMultiple(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setIsProcessing(true);
    const nextAssets = await Promise.all(files.map((file) => buildPolaroidAsset(file, format)));
    setAssets(nextAssets);
    setSingleAssetId(nextAssets[0]?.id ?? "");
    setIsProcessing(false);
  }

  async function exportA4Pdf() {
    if (assets.length === 0) return;

    setPdfBusy(true);
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const { slotsPerPage, positions } = sheetLayout;

    assets.forEach((asset, index) => {
      if (index > 0 && index % slotsPerPage === 0) {
        pdf.addPage("a4", "portrait");
      }

      const slot = positions[index % slotsPerPage];
      pdf.addImage(asset.polaroidUrl, "PNG", slot.x, slot.y, format.widthMm, format.heightMm, undefined, "FAST");
    });

    pdf.save(`polaroid-print-${format.id}-a4.pdf`);
    setPdfBusy(false);
  }

  return (
    <MicroShell title="Polaroid Print">
      <div className="micro-top">
        <p>Preview one photo, process many, and export an A4 print sheet.</p>
        <div className="segmented micro-tabs">
          {(["Overview", "Single", "Sheet"] as PolaroidTab[]).map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)} type="button">
              {item}
            </button>
          ))}
        </div>
      </div>

      {tab === "Overview" ? (
        <div className="micro-stack">
          <article className="feature-card">
            <strong>Single photo</strong>
            <span>Upload one photo and preview a styled instant-film frame.</span>
          </article>
          <article className="feature-card">
            <strong>Batch sheet</strong>
            <span>Upload many photos, sort them automatically, and export an A4 PDF.</span>
          </article>
          <article className="feature-card">
            <strong>Real sizes</strong>
            <span>Use classic, square, or wide formats with print-friendly dimensions.</span>
          </article>
        </div>
      ) : null}

      {tab === "Single" ? (
        <div className="micro-stack">
          <div className="segmented micro-tabs">
            {polaroidFormats.map((item) => (
              <button
                key={item.id}
                className={formatId === item.id ? "active" : ""}
                onClick={() => setFormatId(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
          <input type="file" accept="image/*" onChange={onPickSingle} />
          {isProcessing ? <div className="loader-card compact"><span>Processing photo...</span></div> : null}
          <section className="micro-result left">
            <strong>{format.frame}</strong>
            <span>Styled instant-film frame with print-safe margins.</span>
          </section>
          <div className="polaroid-preview large">
            <div className="polaroid-frame large">
              {singleAsset ? <img src={singleAsset.polaroidUrl} alt={singleAsset.name} /> : <span>Add one photo</span>}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "Sheet" ? (
        <div className="micro-stack">
          <div className="segmented micro-tabs">
            {polaroidFormats.map((item) => (
              <button
                key={item.id}
                className={formatId === item.id ? "active" : ""}
                onClick={() => setFormatId(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
          <input multiple type="file" accept="image/*" onChange={onPickMultiple} />
          <section className="micro-result left">
            <strong>{assets.length} photos</strong>
            <span>
              A4 layout • {sheetLayout.slotsPerPage} prints per page • {format.frame}
            </span>
          </section>
          <div className={`print-sheet preview-grid cols-${sheetLayout.columns}`}>
            {Array.from({ length: sheetLayout.slotsPerPage }).map((_, index) => {
              const asset = assets[index];
              return (
                <div className="print-tile" key={index}>
                  <div className="polaroid-frame small">
                    {asset ? <img src={asset.polaroidUrl} alt={asset.name} /> : <span /> }
                  </div>
                </div>
              );
            })}
          </div>
          <button className="micro-button" disabled={assets.length === 0 || pdfBusy} onClick={() => void exportA4Pdf()}>
            {pdfBusy ? "Generating PDF..." : "Export A4 PDF"}
          </button>
        </div>
      ) : null}
    </MicroShell>
  );
}

function MicroShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="micro-shell">
      <Link href="/" className="micro-back">
        Back
      </Link>
      <section className="micro-card">
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}

function computeA4Layout(format: PolaroidFormat) {
  const pageWidth = 210;
  const pageHeight = 297;
  const gap = 6;
  const margin = 10;
  const columns = Math.max(1, Math.floor((pageWidth - margin * 2 + gap) / (format.widthMm + gap)));
  const rows = Math.max(1, Math.floor((pageHeight - margin * 2 + gap) / (format.heightMm + gap)));
  const usedWidth = columns * format.widthMm + (columns - 1) * gap;
  const usedHeight = rows * format.heightMm + (rows - 1) * gap;
  const startX = (pageWidth - usedWidth) / 2;
  const startY = (pageHeight - usedHeight) / 2;
  const positions = Array.from({ length: columns * rows }).map((_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      x: startX + column * (format.widthMm + gap),
      y: startY + row * (format.heightMm + gap)
    };
  });

  return {
    columns,
    rows,
    slotsPerPage: columns * rows,
    positions
  };
}

async function buildPolaroidAsset(file: File, format: PolaroidFormat): Promise<PolaroidAsset> {
  const sourceUrl = URL.createObjectURL(file);
  const polaroidUrl = await renderPolaroid(sourceUrl, format);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    sourceUrl,
    polaroidUrl
  };
}

function renderPolaroid(sourceUrl: string, format: PolaroidFormat): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 10;
      const outerWidth = Math.round(format.widthMm * scale);
      const outerHeight = Math.round(format.heightMm * scale);
      const side = Math.round(outerWidth * 0.08);
      const top = Math.round(outerHeight * 0.06);
      const bottom = Math.round(outerHeight * 0.22);
      const innerWidth = outerWidth - side * 2;
      const innerHeight = outerHeight - top - bottom;

      canvas.width = outerWidth;
      canvas.height = outerHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Could not create canvas context."));
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, outerWidth, outerHeight);
      context.filter = "sepia(0.18) saturate(1.18) contrast(1.08) brightness(1.04)";

      const imageRatio = image.width / image.height;
      const frameRatio = innerWidth / innerHeight;
      let drawWidth = innerWidth;
      let drawHeight = innerHeight;
      let drawX = side;
      let drawY = top;

      if (imageRatio > frameRatio) {
        drawWidth = innerHeight * imageRatio;
        drawX = side - (drawWidth - innerWidth) / 2;
      } else {
        drawHeight = innerWidth / imageRatio;
        drawY = top - (drawHeight - innerHeight) / 2;
      }

      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      context.filter = "none";

      context.strokeStyle = "rgba(22, 20, 18, 0.08)";
      context.lineWidth = 6;
      context.strokeRect(0, 0, outerWidth, outerHeight);
      context.fillStyle = "rgba(30, 30, 30, 0.08)";
      context.fillRect(side, outerHeight - bottom + 42, innerWidth, 8);

      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => reject(new Error("Could not load image."));
    image.src = sourceUrl;
  });
}

function toNumber(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
