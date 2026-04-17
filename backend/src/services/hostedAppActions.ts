import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Papa from "papaparse";
import QRCode from "qrcode";
import sharp from "sharp";

export async function imagesToPdf(files: Express.Multer.File[]) {
  if (files.length === 0) {
    throw new Error("At least one image is required");
  }

  const pdf = await PDFDocument.create();

  for (const file of files) {
    const normalized = await sharp(file.buffer).rotate().png().toBuffer();
    const image = await pdf.embedPng(normalized);
    const imageWidth = image.width;
    const imageHeight = image.height;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const ratio = Math.min(pageWidth / imageWidth, pageHeight / imageHeight);
    const width = imageWidth * ratio;
    const height = imageHeight * ratio;
    const x = (pageWidth - width) / 2;
    const y = (pageHeight - height) / 2;
    const page = pdf.addPage([pageWidth, pageHeight]);
    page.drawImage(image, { x, y, width, height });
  }

  return Buffer.from(await pdf.save());
}

interface ImageStudioOptions {
  width?: number;
  height?: number;
  format?: "jpeg" | "png" | "webp";
  grayscale?: boolean;
  rotate?: number;
  quality?: number;
  watermark?: string;
}

export async function transformImage(file: Express.Multer.File, options: ImageStudioOptions) {
  let pipeline = sharp(file.buffer).rotate();

  if (options.width || options.height) {
    pipeline = pipeline.resize({
      width: options.width,
      height: options.height,
      fit: "inside",
      withoutEnlargement: true
    });
  }

  if (options.grayscale) {
    pipeline = pipeline.grayscale();
  }

  if (options.rotate) {
    pipeline = pipeline.rotate(options.rotate);
  }

  if (options.watermark?.trim()) {
    const svg = buildWatermarkSvg(options.watermark.trim());
    pipeline = pipeline.composite([{ input: Buffer.from(svg), gravity: "southeast" }]);
  }

  const quality = clamp(options.quality ?? 90, 10, 100);
  const format = options.format ?? "png";

  switch (format) {
    case "jpeg":
      return {
        buffer: await pipeline.jpeg({ quality }).toBuffer(),
        filename: "edited-image.jpg",
        contentType: "image/jpeg"
      };
    case "webp":
      return {
        buffer: await pipeline.webp({ quality }).toBuffer(),
        filename: "edited-image.webp",
        contentType: "image/webp"
      };
    case "png":
    default:
      return {
        buffer: await pipeline.png({ quality }).toBuffer(),
        filename: "edited-image.png",
        contentType: "image/png"
      };
  }
}

export async function textToPdf(input: { title: string; author?: string; text: string }) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595.28, 841.89]);
  let cursorY = 800;
  const marginX = 40;
  const lineHeight = 18;
  const maxWidth = 515;

  page.drawText(input.title || "Document", {
    x: marginX,
    y: cursorY,
    font: bold,
    size: 22,
    color: rgb(0.08, 0.08, 0.08)
  });
  cursorY -= 32;

  const lines = wrapText(input.text || "", font, 12, maxWidth);
  for (const line of lines) {
    if (cursorY < 60) {
      page = pdf.addPage([595.28, 841.89]);
      cursorY = 800;
    }
    page.drawText(line, {
      x: marginX,
      y: cursorY,
      font,
      size: 12,
      color: rgb(0.18, 0.18, 0.18)
    });
    cursorY -= lineHeight;
  }

  pdf.setTitle(input.title || "Document");
  if (input.author) {
    pdf.setAuthor(input.author);
  }

  return Buffer.from(await pdf.save());
}

export async function generateQrPng(text: string) {
  if (!text.trim()) {
    throw new Error("Text is required");
  }

  return QRCode.toBuffer(text, {
    type: "png",
    margin: 1,
    width: 1024,
    color: {
      dark: "#111827",
      light: "#ffffff"
    }
  });
}

export function convertStructuredData(mode: "csv_to_json" | "json_to_csv", input: string) {
  if (mode === "csv_to_json") {
    const parsed = Papa.parse<Record<string, string>>(input, {
      header: true,
      skipEmptyLines: true
    });

    if (parsed.errors.length > 0) {
      throw new Error(parsed.errors[0].message);
    }

    return {
      content: JSON.stringify(parsed.data, null, 2),
      filename: "converted.json",
      contentType: "application/json; charset=utf-8"
    };
  }

  const parsed = JSON.parse(input);
  if (!Array.isArray(parsed)) {
    throw new Error("JSON input must be an array of objects");
  }

  return {
    content: Papa.unparse(parsed),
    filename: "converted.csv",
    contentType: "text/csv; charset=utf-8"
  };
}

function buildWatermarkSvg(text: string) {
  const escaped = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

  return `
    <svg width="220" height="72" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="26" width="204" height="34" rx="12" fill="rgba(17,24,39,0.58)" />
      <text x="110" y="49" text-anchor="middle" font-size="20" font-family="Arial, sans-serif" fill="white">${escaped}</text>
    </svg>
  `;
}

function wrapText(text: string, font: PDFFontLike, fontSize: number, maxWidth: number) {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = words[0];
    for (const word of words.slice(1)) {
      const candidate = `${current} ${word}`;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }

  return lines;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

interface PDFFontLike {
  widthOfTextAtSize(text: string, size: number): number;
}
