import { randomUUID } from "node:crypto";
import { GenerationJobRecord, MicroAppRecord } from "../types/domain.js";

const apps: MicroAppRecord[] = [
  {
    id: randomUUID(),
    name: "Spend Hours",
    summary: "Convert purchases into work-hours before spending.",
    visibility: "private",
    status: "ready",
    deploymentUrl: "https://example.vercel.app/spend-hours",
    updatedAt: new Date().toISOString()
  }
];

const jobs: GenerationJobRecord[] = [];

export function listApps() {
  return apps;
}

export function createApp(input: Omit<MicroAppRecord, "id" | "updatedAt">) {
  const app: MicroAppRecord = {
    id: randomUUID(),
    updatedAt: new Date().toISOString(),
    ...input
  };
  apps.unshift(app);
  return app;
}

export function createJob(input: Omit<GenerationJobRecord, "id" | "createdAt">) {
  const job: GenerationJobRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input
  };
  jobs.unshift(job);
  return job;
}

export function listJobs() {
  return jobs;
}
