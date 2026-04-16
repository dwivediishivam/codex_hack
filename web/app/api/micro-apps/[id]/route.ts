import { NextRequest, NextResponse } from "next/server";
import type { GeneratedAppRecord, GeneratedAppSpec } from "../../../../lib/generated-apps";
import { supabaseAdmin } from "../../../../lib/server/supabase-admin";

const bucketName = "generated-apps";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const { data: app, error: appError } = await supabaseAdmin.from("micro_apps").select("*").eq("id", id).single();
  if (appError) {
    return NextResponse.json({ error: appError.message }, { status: 404 });
  }

  const { data: specFile, error: specError } = await supabaseAdmin.storage.from(bucketName).download(`${id}.json`);
  if (specError) {
    return NextResponse.json({ error: specError.message }, { status: 404 });
  }

  const spec = (JSON.parse(await specFile.text()) ?? null) as GeneratedAppSpec | null;

  return NextResponse.json({
    app: app as GeneratedAppRecord,
    spec
  });
}
