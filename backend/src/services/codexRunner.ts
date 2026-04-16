import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { env } from "../config/env.js";

interface CodexPromptInput {
  systemPrompt: string;
  userPrompt: string;
  visibility: string;
  audience: string;
  category: string;
  generationMode: string;
}

export interface CodexPlanResult {
  appName: string;
  positioning: string;
  releaseMode: "private" | "public" | "organization";
  designDirection: string;
  screens: string[];
  dataModel: string[];
  launchChecklist: string[];
}

const outputSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "appName",
    "positioning",
    "releaseMode",
    "designDirection",
    "screens",
    "dataModel",
    "launchChecklist"
  ],
  properties: {
    appName: { type: "string" },
    positioning: { type: "string" },
    releaseMode: { type: "string", enum: ["private", "public", "organization"] },
    designDirection: { type: "string" },
    screens: { type: "array", items: { type: "string" } },
    dataModel: { type: "array", items: { type: "string" } },
    launchChecklist: { type: "array", items: { type: "string" } }
  }
} as const;

export async function runCodexPlan(input: CodexPromptInput): Promise<CodexPlanResult> {
  const schemaPath = path.join(os.tmpdir(), `foundry-schema-${randomUUID()}.json`);
  const outputPath = path.join(os.tmpdir(), `foundry-output-${randomUUID()}.json`);
  const workspaceRoot = env.CODEX_WORKSPACE_ROOT ?? path.resolve(process.cwd(), "..");
  const prompt = buildPrompt(input);

  await fs.writeFile(schemaPath, JSON.stringify(outputSchema, null, 2), "utf8");

  const args = [
    "exec",
    "--skip-git-repo-check",
    "--dangerously-bypass-approvals-and-sandbox",
    "-C",
    workspaceRoot,
    "--output-schema",
    schemaPath,
    "-o",
    outputPath
  ];

  if (env.CODEX_MODEL) {
    args.push("--model", env.CODEX_MODEL);
  }

  args.push(prompt);

  try {
    await runCodexProcess(args);

    const raw = await fs.readFile(outputPath, "utf8");
    return JSON.parse(raw) as CodexPlanResult;
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown Codex CLI error";
    throw new Error(`Codex CLI plan failed: ${details}`);
  } finally {
    await Promise.allSettled([fs.unlink(schemaPath), fs.unlink(outputPath)]);
  }
}

function buildPrompt(input: CodexPromptInput) {
  return `
You are planning a micro app for Foundry.

Return structured JSON only.

System prompt:
${input.systemPrompt}

User prompt:
${input.userPrompt}

Launch context:
- visibility: ${input.visibility}
- audience: ${input.audience}
- category: ${input.category}
- generation mode: ${input.generationMode}

Instructions:
- invent a concise product-quality app name
- keep the app small, specific, and immediately useful
- use copy that is calm, clear, and non-generic
- make the design direction minimalist and mobile-first
- output 3 to 5 core screens, 3 to 6 data model items, and 3 to 6 launch checklist items
`.trim();
}

function runCodexProcess(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(env.CODEX_BIN, args, {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stderr = "";
    let stdout = "";
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Timed out after ${env.CODEX_TIMEOUT_MS}ms. ${stderr || stdout}`.trim()));
    }, env.CODEX_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);

      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error((stderr || stdout || `Exited with code ${code}`).trim()));
    });

    child.stdin.end();
  });
}
