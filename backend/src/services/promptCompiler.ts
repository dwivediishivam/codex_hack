import { AppVisibility } from "../types/domain.js";

export interface BuildRequest {
  prompt: string;
  visibility: AppVisibility;
  audience: string;
  category: string;
  generationMode: string;
}

const systemPrompt = `
You are Codex Hack, the generation worker for a hosted micro-app platform.

Requirements:
- Output polished, mobile-first web apps.
- Keep apps narrow, useful, and ready for instant hosted deployment.
- Respect account scope, app visibility, and organization boundaries.
- Prefer strong hierarchy, premium design, clear defaults, and practical workflows.
- Avoid generic SaaS output and avoid requiring arbitrary native code.
`.trim();

export function compilePrompt(input: BuildRequest) {
  return {
    systemPrompt,
    userPrompt: input.prompt.trim(),
    launchProfile: {
      visibility: input.visibility,
      audience: input.audience,
      category: input.category,
      generationMode: input.generationMode
    }
  };
}
