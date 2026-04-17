import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { GenerationJobRecord, MicroAppRecord } from "../types/api.js";

interface LocalStoreState {
  microApps: MicroAppRecord[];
  generationJobs: GenerationJobRecord[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const storePath = join(__dirname, "../../data/store.json");
const publicDeploymentUrl = "https://pocket-founder.vercel.app";
let cache: LocalStoreState | null = null;

export async function listLocalApps(ownerId?: string) {
  const state = await loadState();
  const items = state.microApps.filter((app) => {
    if (!ownerId) return true;
    return app.owner_id === ownerId;
  });

  return sortByUpdated(items);
}

export async function listLocalPublicApps() {
  const state = await loadState();
  return sortByUpdated(state.microApps.filter((app) => app.visibility === "public"));
}

export async function getLocalApp(id: string) {
  const state = await loadState();
  return state.microApps.find((app) => app.id === id) ?? null;
}

export async function createLocalApp(input: {
  id?: string;
  ownerId: string;
  name: string;
  summary: string;
  visibility: MicroAppRecord["visibility"];
  audience: string;
  category: string;
  generationMode: string;
  status?: MicroAppRecord["status"];
  deploymentUrl?: string | null;
}) {
  const state = await loadState();
  const now = new Date().toISOString();

  const app: MicroAppRecord = {
    id: input.id ?? randomUUID(),
    owner_id: input.ownerId,
    name: input.name,
    summary: input.summary,
    visibility: input.visibility,
    audience: input.audience,
    category: input.category,
    generation_mode: input.generationMode,
    status: input.status ?? (input.visibility === "public" ? "reviewing" : "building"),
    deployment_url: input.deploymentUrl ?? null,
    created_at: now,
    updated_at: now
  };

  state.microApps.unshift(app);
  await persist(state);
  return app;
}

export async function createLocalJob(input: {
  id?: string;
  appId: string;
  type: GenerationJobRecord["type"];
  prompt: string;
  systemPrompt: string;
  status?: GenerationJobRecord["status"];
  createdAt?: string;
}) {
  const state = await loadState();
  const job: GenerationJobRecord = {
    id: input.id ?? randomUUID(),
    app_id: input.appId,
    type: input.type,
    status: input.status ?? "queued",
    prompt: input.prompt,
    system_prompt: input.systemPrompt,
    created_at: input.createdAt ?? new Date().toISOString()
  };

  state.generationJobs.unshift(job);
  await persist(state);
  return job;
}

export async function listLocalJobs(appId?: string) {
  const state = await loadState();
  const items = state.generationJobs.filter((job) => !appId || job.app_id === appId);
  return items.sort((left, right) => right.created_at.localeCompare(left.created_at));
}

async function loadState() {
  if (cache) return cache;

  try {
    const raw = await readFile(storePath, "utf8");
    cache = JSON.parse(raw) as LocalStoreState;
    return cache;
  } catch {
    const seeded = buildSeedState();
    await persist(seeded);
    cache = seeded;
    return seeded;
  }
}

async function persist(state: LocalStoreState) {
  cache = state;
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(state, null, 2), "utf8");
}

function buildSeedState(): LocalStoreState {
  const now = Date.now();
  const seedApps: MicroAppRecord[] = [
    {
      id: randomUUID(),
      owner_id: "foundry-demo",
      name: "Spend Hours",
      summary: "Turn any purchase into required work hours before you spend.",
      visibility: "public",
      audience: "consumer",
      category: "finance",
      generation_mode: "instant",
      status: "ready",
      deployment_url: `${publicDeploymentUrl}/micro-apps/spend-hours`,
      created_at: new Date(now - 86_400_000).toISOString(),
      updated_at: new Date(now - 4_200_000).toISOString()
    },
    {
      id: randomUUID(),
      owner_id: "foundry-demo",
      name: "Polaroid Print",
      summary: "Take or upload a photo, wrap it in instant-film layouts, and prepare A4 or A3 print sheets with clear size specs.",
      visibility: "public",
      audience: "consumer",
      category: "custom",
      generation_mode: "instant",
      status: "ready",
      deployment_url: `${publicDeploymentUrl}/micro-apps/polaroid-print`,
      created_at: new Date(now - 28_000_000).toISOString(),
      updated_at: new Date(now - 2_100_000).toISOString()
    }
  ];

  const generationJobs: GenerationJobRecord[] = seedApps.map((app, index) => ({
    id: randomUUID(),
    app_id: app.id,
    type: "create",
    status: app.status === "ready" ? "completed" : "running",
    prompt: app.summary,
    system_prompt: "Foundry seed job",
    created_at: new Date(now - (index + 1) * 3_600_000).toISOString()
  }));

  return {
    microApps: seedApps,
    generationJobs
  };
}

function sortByUpdated(items: MicroAppRecord[]) {
  return [...items].sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}
