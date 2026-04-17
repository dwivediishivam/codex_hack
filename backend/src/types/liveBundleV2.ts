import type { HostedAppConfig, HostedAppKind } from "./hostedApp.js";

export interface LiveBundleV2Document {
  mode: "bundle_v2";
  version: 2;
  appId: string;
  name: string;
  summary: string;
  prompt: string;
  ownerId: string;
  accent: string;
  primaryKind: HostedAppKind;
  focus: string[];
  createdAt: string;
  hostedApp: HostedAppConfig;
  bundleHtml: string;
}
