import type { GeneratedAppSpec } from "./generatedApp.js";

export type HostedAppKind =
  | "image_to_pdf"
  | "image_studio"
  | "pdf_studio"
  | "text_to_pdf"
  | "qr_generator"
  | "csv_json_converter"
  | "unit_converter"
  | "persistent_tracker";

export interface HostedAppBase {
  mode: "hosted";
  kind: HostedAppKind;
  name: string;
  summary: string;
  prompt: string;
  ownerId: string;
  accent: string;
}

export interface PersistentTrackerApp extends HostedAppBase {
  kind: "persistent_tracker";
  trackerSpec: GeneratedAppSpec;
}

export interface PdfStudioSpec {
  trimTopPercent: number;
  trimBottomPercent: number;
  trimLeftPercent: number;
  trimRightPercent: number;
  preservePageSize: boolean;
}

export interface PdfStudioApp extends HostedAppBase {
  kind: "pdf_studio";
  pdfSpec: PdfStudioSpec;
}

export interface UtilityHostedApp extends HostedAppBase {
  kind: Exclude<HostedAppKind, "persistent_tracker" | "pdf_studio">;
}

export type HostedAppConfig = PersistentTrackerApp | PdfStudioApp | UtilityHostedApp;

export interface StoredSpecApp {
  mode: "spec";
  spec: GeneratedAppSpec;
}

export type StoredGeneratedApp = HostedAppConfig | StoredSpecApp;

export interface HostedAppStateEntry {
  id: string;
  createdAt: string;
  values: Record<string, string>;
}

export interface HostedAppUserState {
  entries: HostedAppStateEntry[];
  notes: string;
}
