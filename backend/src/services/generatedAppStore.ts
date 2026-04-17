import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { supabaseAdmin } from "../lib/supabase.js";
import { env } from "../config/env.js";
import type { GeneratedAppSpec } from "../types/generatedApp.js";

const bucketName = env.GENERATED_APPS_BUCKET;
const __dirname = dirname(fileURLToPath(import.meta.url));
const localSpecsDirectory = join(__dirname, "../../data/generated-app-specs");

export async function writeGeneratedAppSpec(id: string, spec: GeneratedAppSpec) {
  try {
    await ensureBucket();
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(`${id}.json`, JSON.stringify(spec), { upsert: true, contentType: "application/json" });

    if (error) {
      throw error;
    }
  } catch {
    await mkdir(localSpecsDirectory, { recursive: true });
    await writeFile(join(localSpecsDirectory, `${id}.json`), JSON.stringify(spec, null, 2), "utf8");
  }
}

export async function readGeneratedAppSpec(id: string) {
  try {
    const { data, error } = await supabaseAdmin.storage.from(bucketName).download(`${id}.json`);
    if (error) {
      throw error;
    }

    return JSON.parse(await data.text()) as GeneratedAppSpec;
  } catch {
    const localPath = join(localSpecsDirectory, `${id}.json`);
    const raw = await readFile(localPath, "utf8");
    return JSON.parse(raw) as GeneratedAppSpec;
  }
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
