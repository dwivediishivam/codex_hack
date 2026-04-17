import { supabaseAdmin } from "../lib/supabase.js";
import { AppVisibility, GenerationJobRecord, JobType, MicroAppRecord } from "../types/api.js";
import {
  createLocalApp,
  createLocalJob,
  getLocalApp,
  listLocalApps,
  listLocalJobs,
  listLocalPublicApps
} from "./localStore.js";

interface CreateAppInput {
  id?: string;
  ownerId: string;
  name: string;
  summary: string;
  visibility: AppVisibility;
  audience: string;
  category: string;
  generationMode: string;
  status?: MicroAppRecord["status"];
  deploymentUrl?: string | null;
}

interface CreateJobInput {
  id?: string;
  appId: string;
  type: JobType;
  prompt: string;
  systemPrompt: string;
  status?: GenerationJobRecord["status"];
  createdAt?: string;
}

let repositoryMode: "supabase" | "local" | null = null;

export async function listApps(ownerId?: string) {
  if (await useLocalRepository()) {
    return listLocalApps(ownerId);
  }

  let query = supabaseAdmin.from("micro_apps").select("*").order("updated_at", { ascending: false });

  if (ownerId) {
    query = query.eq("owner_id", ownerId);
  }

  const { data, error } = await query;
  if (error) {
    if (shouldFallback(error)) {
      repositoryMode = "local";
      return listLocalApps(ownerId);
    }

    throw error;
  }

  return (data ?? []) as MicroAppRecord[];
}

export async function listPublicApps() {
  if (await useLocalRepository()) {
    return listLocalPublicApps();
  }

  const { data, error } = await supabaseAdmin
    .from("micro_apps")
    .select("*")
    .eq("visibility", "public")
    .order("updated_at", { ascending: false });

  if (error) {
    if (shouldFallback(error)) {
      repositoryMode = "local";
      return listLocalPublicApps();
    }

    throw error;
  }

  return (data ?? []) as MicroAppRecord[];
}

export async function getAppById(id: string) {
  if (await useLocalRepository()) {
    return getLocalApp(id);
  }

  const { data, error } = await supabaseAdmin.from("micro_apps").select("*").eq("id", id).single();
  if (error) {
    if (shouldFallback(error)) {
      repositoryMode = "local";
      return getLocalApp(id);
    }

    throw error;
  }

  return data as MicroAppRecord;
}

export async function createApp(input: CreateAppInput) {
  if (await useLocalRepository()) {
    return createLocalApp(input);
  }

  const { data, error } = await supabaseAdmin
    .from("micro_apps")
    .insert({
      id: input.id,
      owner_id: input.ownerId,
      name: input.name,
      summary: input.summary,
      visibility: input.visibility,
      audience: input.audience,
      category: input.category,
      generation_mode: input.generationMode,
      status: input.status ?? (input.visibility === "public" ? "reviewing" : "building"),
      deployment_url: input.deploymentUrl
    })
    .select()
    .single();

  if (error) {
    if (shouldFallback(error)) {
      repositoryMode = "local";
      return createLocalApp(input);
    }

    throw error;
  }

  return data as MicroAppRecord;
}

export async function createJob(input: CreateJobInput) {
  if (await useLocalRepository()) {
    return createLocalJob(input);
  }

  const { data, error } = await supabaseAdmin
    .from("generation_jobs")
    .insert({
      id: input.id,
      app_id: input.appId,
      type: input.type,
      status: input.status ?? "queued",
      prompt: input.prompt,
      system_prompt: input.systemPrompt,
      created_at: input.createdAt
    })
    .select()
    .single();

  if (error) {
    if (shouldFallback(error)) {
      repositoryMode = "local";
      return createLocalJob(input);
    }

    throw error;
  }

  return data as GenerationJobRecord;
}

export async function listJobs(appId?: string) {
  if (await useLocalRepository()) {
    return listLocalJobs(appId);
  }

  let query = supabaseAdmin.from("generation_jobs").select("*").order("created_at", { ascending: false });

  if (appId) {
    query = query.eq("app_id", appId);
  }

  const { data, error } = await query;
  if (error) {
    if (shouldFallback(error)) {
      repositoryMode = "local";
      return listLocalJobs(appId);
    }

    throw error;
  }

  return (data ?? []) as GenerationJobRecord[];
}

async function useLocalRepository() {
  if (repositoryMode) {
    return repositoryMode === "local";
  }

  const { error } = await supabaseAdmin.from("micro_apps").select("id").limit(1);
  repositoryMode = error ? "local" : "supabase";
  return repositoryMode === "local";
}

function shouldFallback(error: { code?: string; message?: string }) {
  return error.code === "PGRST205" || error.message?.includes("schema cache") === true;
}
