import { Router } from "express";
import { z } from "zod";
import { compilePrompt } from "../services/promptCompiler.js";
import { runCodexPlan } from "../services/codexRunner.js";

export const codexRouter = Router();

const planSchema = z.object({
  prompt: z.string().min(12),
  visibility: z.enum(["private", "public", "organization"]),
  audience: z.string().min(2),
  category: z.string().min(2),
  generationMode: z.string().min(2)
});

codexRouter.post("/plan", (req, res) => {
  void (async () => {
    const parsed = planSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten()
      });
    }

    try {
      const promptPackage = compilePrompt(parsed.data);
      const plan = await runCodexPlan({
        systemPrompt: promptPackage.systemPrompt,
        userPrompt: promptPackage.userPrompt,
        visibility: parsed.data.visibility,
        audience: parsed.data.audience,
        category: parsed.data.category,
        generationMode: parsed.data.generationMode
      });

      return res.json({
        promptPackage,
        plan
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Codex planning failed"
      });
    }
  })();
});
