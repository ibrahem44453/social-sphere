import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { EnhancePostBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

const ACTION_PROMPTS: Record<string, string> = {
  improve:
    "Improve the writing quality of the following social media post. Make it cleaner, more impactful, and engaging. Return only the improved post text, no explanation.",
  rewrite:
    "Rewrite the following social media post with fresh wording and better flow while preserving the core message. Return only the rewritten post text, no explanation.",
  fix_grammar:
    "Fix any grammar, spelling, and punctuation errors in the following social media post. Return only the corrected post text, no explanation.",
  shorten:
    "Shorten the following social media post to be more concise and punchy while keeping the key message. Return only the shortened post text, no explanation.",
  expand:
    "Expand the following social media post to be more detailed and expressive. Add context, emotion, or supporting thoughts. Return only the expanded post text, no explanation.",
  hashtags:
    "Generate 3-7 relevant, trending hashtags for the following social media post. Return only the hashtags separated by spaces, no explanation.",
  tone_professional:
    "Rewrite the following social media post in a professional, polished tone. Return only the rewritten post text, no explanation.",
  tone_casual:
    "Rewrite the following social media post in a casual, friendly, conversational tone. Return only the rewritten post text, no explanation.",
  engaging:
    "Rewrite the following social media post to be more engaging and likely to get likes, comments, and shares. Use hooks, questions, or compelling language. Return only the rewritten post text, no explanation.",
};

router.post("/enhance", async (req, res) => {
  const parsed = EnhancePostBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { content, action } = parsed.data;
  const systemPrompt = ACTION_PROMPTS[action];
  if (!systemPrompt) {
    return res.status(400).json({ error: "Unknown action" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
    });

    const result = completion.choices[0]?.message?.content?.trim() ?? "";
    return res.json({ result, action });
  } catch (err) {
    logger.error({ err }, "AI enhance failed");
    return res.status(500).json({ error: "AI enhancement failed" });
  }
});

export default router;
