import { supabaseAdmin } from "../lib/supabase.js";
import { AppVisibility, GenerationJobRecord, JobType, MicroAppRecord } from "../types/api.js";

interface CreateAppInput {
  ownerId: string;
  name: string;
  summary: string;
  visibility: AppVisibility;
  audience: string;
  category: string;
  generationMode: string;
}

interface CreateJobInput {
  appId: string;
  type: JobType;
  prompt: string;
  systemPrompt: string;
}

export async function listApps(ownerId?: string) {
  let query = supabaseAdmin.from("micro_apps").select("*").order("updated_at", { ascending: false });

  if (ownerId) {
    query = query.eq("owner_id", ownerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MicroAppRecord[];
}

export async function listPublicApps() {
  const { data, error } = await supabaseAdmin
    .from("micro_apps")
    .select("*")
    .eq("visibility", "public")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as MicroAppRecord[];
}

export async function createApp(input: CreateAppInput) {
  const { data, error } = await supabaseAdmin
    .from("micro_apps")
    .insert({
      owner_id: input.ownerId,
      name: input.name,
      summary: input.summary,
      visibility: input.visibility,
      audience: input.audience,
      category: input.category,
      generation_mode: input.generationMode,
      status: input.visibility === "public" ? "reviewing" : "building"
    })
    .select()
    .single();

  if (error) throw error;
  return data as MicroAppRecord;
}

export async function createJob(input: CreateJobInput) {
  const { data, error } = await supabaseAdmin
    .from("generation_jobs")
    .insert({
      app_id: input.appId,
      type: input.type,
      status: "queued",
      prompt: input.prompt,
      system_prompt: input.systemPrompt
    })
    .select()
    .single();

  if (error) throw error;
  return data as GenerationJobRecord;
}

export async function listJobs(appId?: string) {
  let query = supabaseAdmin.from("generation_jobs").select("*").order("created_at", { ascending: false });

  if (appId) {
    query = query.eq("app_id", appId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as GenerationJobRecord[];
}
