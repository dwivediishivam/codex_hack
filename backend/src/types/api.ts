export type AppVisibility = "private" | "public" | "organization";
export type JobType = "create" | "edit" | "rebuild";
export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface MicroAppRecord {
  id: string;
  owner_id: string;
  name: string;
  summary: string;
  visibility: AppVisibility;
  audience: string;
  category: string;
  generation_mode: string;
  status: "draft" | "building" | "ready" | "reviewing" | "failed";
  deployment_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerationJobRecord {
  id: string;
  app_id: string;
  type: JobType;
  status: JobStatus;
  prompt: string;
  system_prompt: string;
  created_at: string;
}
