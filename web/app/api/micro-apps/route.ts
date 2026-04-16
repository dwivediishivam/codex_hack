import { NextRequest, NextResponse } from "next/server";
import type { GeneratedAppRecord, GeneratedAppSpec } from "../../../lib/generated-apps";
import { generateAppSpec } from "../../../lib/server/app-generator";
import { supabaseAdmin } from "../../../lib/server/supabase-admin";

const bucketName = "generated-apps";

export async function GET(request: NextRequest) {
  const ownerId = request.nextUrl.searchParams.get("ownerId");

  let query = supabaseAdmin.from("micro_apps").select("*").order("updated_at", { ascending: false });
  if (ownerId) {
    query = query.eq("owner_id", ownerId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: (data ?? []) as GeneratedAppRecord[] });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { ownerId?: string; prompt?: string };
    const ownerId = body.ownerId?.trim();
    const prompt = body.prompt?.trim();

    if (!ownerId || !prompt || prompt.length < 12) {
      return NextResponse.json({ error: "Missing owner or prompt" }, { status: 400 });
    }

    const spec = await generateAppSpec(prompt);
    const id = crypto.randomUUID();
    const deploymentUrl = `/micro-apps/custom/${id}`;

    await ensureBucket();
    await writeSpec(id, spec);

    const { data: app, error: appError } = await supabaseAdmin
      .from("micro_apps")
      .insert({
        id,
        owner_id: ownerId,
        name: spec.name,
        summary: spec.summary,
        visibility: "private",
        audience: "personal",
        category: "custom",
        generation_mode: "instant",
        status: "ready",
        deployment_url: deploymentUrl
      })
      .select("*")
      .single();

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    const { error: jobError } = await supabaseAdmin.from("generation_jobs").insert({
      app_id: id,
      type: "create",
      status: "completed",
      prompt,
      system_prompt: "web-inline-generator"
    });

    if (jobError) {
      console.warn("generation_jobs insert failed", jobError.message);
    }

    return NextResponse.json({
      app,
      spec
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create app" },
      { status: 500 }
    );
  }
}

async function ensureBucket() {
  const { data, error } = await supabaseAdmin.storage.getBucket(bucketName);
  if (!error && data) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
    public: false,
    fileSizeLimit: 1024 * 1024
  });

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw createError;
  }
}

async function writeSpec(id: string, spec: GeneratedAppSpec) {
  const { error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(`${id}.json`, JSON.stringify(spec), { upsert: true, contentType: "application/json" });

  if (error) {
    throw error;
  }
}
