import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import { supabaseAdmin } from "../lib/supabase.js";
import type { HostedAppUserState } from "../types/hostedApp.js";

const bucketName = env.GENERATED_APP_USER_DATA_BUCKET;
const __dirname = dirname(fileURLToPath(import.meta.url));
const localStateDirectory = join(__dirname, "../../data/generated-app-user-data");

const emptyState: HostedAppUserState = {
  entries: [],
  notes: ""
};

export async function readHostedAppState(appId: string, ownerId: string) {
  const key = storageKey(appId, ownerId);

  try {
    const { data, error } = await supabaseAdmin.storage.from(bucketName).download(key);
    if (error) {
      throw error;
    }

    return JSON.parse(await data.text()) as HostedAppUserState;
  } catch {
    try {
      const raw = await readFile(join(localStateDirectory, key), "utf8");
      return JSON.parse(raw) as HostedAppUserState;
    } catch {
      return emptyState;
    }
  }
}

export async function writeHostedAppState(appId: string, ownerId: string, state: HostedAppUserState) {
  const key = storageKey(appId, ownerId);

  try {
    await ensureBucket();
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(key, JSON.stringify(state), { upsert: true, contentType: "application/json" });

    if (error) {
      throw error;
    }
  } catch {
    const localPath = join(localStateDirectory, key);
    await mkdir(dirname(localPath), { recursive: true });
    await writeFile(localPath, JSON.stringify(state, null, 2), "utf8");
  }
}

function storageKey(appId: string, ownerId: string) {
  return `${appId}/${encodeURIComponent(ownerId)}.json`;
}

async function ensureBucket() {
  const { data, error } = await supabaseAdmin.storage.getBucket(bucketName);
  if (!error && data) {
    return;
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
    public: false,
    fileSizeLimit: 1024 * 1024
  });

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw createError;
  }
}
