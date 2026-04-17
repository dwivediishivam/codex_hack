import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { supabaseAdmin } from "../lib/supabase.js";
import { env } from "../config/env.js";
import type { GeneratedAppSpec } from "../types/generatedApp.js";
import type { StoredGeneratedApp } from "../types/hostedApp.js";

const bucketName = env.GENERATED_APPS_BUCKET;
const __dirname = dirname(fileURLToPath(import.meta.url));
const localSpecsDirectory = join(__dirname, "../../data/generated-app-specs");

export async function writeGeneratedAppSpec(id: string, spec: GeneratedAppSpec) {
  return writeGeneratedAppDocument<StoredGeneratedApp>(id, {
    mode: "spec",
    spec
  });
}

export async function writeGeneratedAppDocument<T>(id: string, document: T) {
  try {
    await ensureBucket();
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(`${id}.json`, JSON.stringify(document), { upsert: true, contentType: "application/json" });

    if (error) {
      throw error;
    }
  } catch {
    await mkdir(localSpecsDirectory, { recursive: true });
    await writeFile(join(localSpecsDirectory, `${id}.json`), JSON.stringify(document, null, 2), "utf8");
  }
}

export async function readGeneratedAppSpec(id: string) {
  const document = await readGeneratedAppDocument<StoredGeneratedApp>(id);
  if (document.mode !== "spec") {
    throw new Error("Stored app is hosted, not spec-based");
  }

  return document.spec;
}

export async function readGeneratedAppDocument<T>(id: string) {
  try {
    const { data, error } = await supabaseAdmin.storage.from(bucketName).download(`${id}.json`);
    if (error) {
      throw error;
    }

    return JSON.parse(await data.text()) as T;
  } catch {
    const localPath = join(localSpecsDirectory, `${id}.json`);
    const raw = await readFile(localPath, "utf8");
    return JSON.parse(raw) as T;
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
