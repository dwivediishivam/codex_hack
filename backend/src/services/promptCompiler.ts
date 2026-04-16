import { AppVisibility } from "../types/domain.js";

export interface BuildRequest {
  prompt: string;
  visibility: AppVisibility;
  audience: string;
  category: string;
  generationMode: string;
}

const systemPrompt = `
You are Foundry, the generation worker for a hosted micro-app platform.

Requirements:
- Output polished, mobile-first web apps that feel specific to the prompt.
- Keep apps narrow, useful, and ready for instant hosted deployment.
- Respect account scope, app visibility, and organization boundaries.
- Prefer strong hierarchy, thoughtful copy, calm spacing, and practical workflows.
- Avoid random fields, filler dashboards, generic SaaS output, and arbitrary native code.
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
