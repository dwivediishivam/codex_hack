export type AppVisibility = "private" | "public" | "organization";
export type JobType = "create" | "edit" | "rebuild";
export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface MicroAppRecord {
  id: string;
  name: string;
  summary: string;
  visibility: AppVisibility;
  status: "draft" | "building" | "ready" | "reviewing";
  deploymentUrl?: string;
  updatedAt: string;
}

export interface GenerationJobRecord {
  id: string;
  appId: string;
  type: JobType;
  status: JobStatus;
  prompt: string;
  createdAt: string;
}
