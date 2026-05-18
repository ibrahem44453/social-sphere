import { Router } from "express";
import { z } from "zod";
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

const GeneratePostBody = z.object({
  topic: z.string().min(1).max(500),
  style: z
    .enum(["casual", "professional", "humorous", "inspiring", "educational"])
    .default("casual"),
});

router.post("/generate", async (req, res) => {
  const parsed = GeneratePostBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { topic, style } = parsed.data;

  const styleDescriptions: Record<string, string> = {
    casual: "casual, friendly, and conversational — like texting a friend",
    professional: "professional, polished, and authoritative",
    humorous: "funny, witty, and entertaining with clever wordplay",
    inspiring: "motivational, uplifting, and deeply inspirational",
    educational: "informative, clear, and educational — sharing key insights",
  };

  const systemPrompt = `You are a social media expert. Generate a compelling social media post about the given topic. The tone should be ${styleDescriptions[style]}. Include 2-4 relevant hashtags at the end. Keep it engaging and shareable (under 280 characters of content before hashtags if possible). Return only the post text with hashtags, no quotes or explanation.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 512,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Topic: ${topic}` },
      ],
    });

    const result = completion.choices[0]?.message?.content?.trim() ?? "";
    return res.json({ result });
  } catch (err) {
    logger.error({ err }, "AI generate failed");
    return res.status(500).json({ error: "AI generation failed" });
  }
});

const ContentIdeasBody = z.object({
  niche: z.string().min(1).max(200),
  count: z.number().int().min(1).max(10).default(5),
});

router.post("/ideas", async (req, res) => {
  const parsed = ContentIdeasBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { niche, count } = parsed.data;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are a social media strategist. Generate ${count} unique, engaging post ideas for the given niche/topic. Return a JSON object with an "ideas" array. Each element must have: "title" (short hook phrase, max 8 words) and "description" (one sentence explaining the post angle, max 20 words). Return only valid JSON, no markdown fences.`,
        },
        { role: "user", content: `Niche: ${niche}` },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    let ideas: unknown[] = [];
    try {
      const obj = JSON.parse(raw) as Record<string, unknown>;
      ideas = Array.isArray(obj.ideas) ? obj.ideas : [];
    } catch {
      ideas = [];
    }
    return res.json({ ideas });
  } catch (err) {
    logger.error({ err }, "AI ideas failed");
    return res.status(500).json({ error: "AI ideas generation failed" });
  }
});

const CommentSuggestionsBody = z.object({
  post_content: z.string().min(1).max(2200),
});

router.post("/comment", async (req, res) => {
  const parsed = CommentSuggestionsBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { post_content } = parsed.data;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 512,
      messages: [
        {
          role: "system",
          content: `Generate 3 varied, authentic comment suggestions for the given social media post. Make them feel human and genuine — not generic. Include: one supportive/affirming comment, one thoughtful/insightful comment, and one engaging comment (asks a question or adds fun). Return a JSON object with a "suggestions" array of strings. Return only valid JSON, no markdown.`,
        },
        { role: "user", content: `Post: ${post_content}` },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    let suggestions: string[] = [];
    try {
      const obj = JSON.parse(raw) as Record<string, unknown>;
      suggestions = Array.isArray(obj.suggestions)
        ? (obj.suggestions as string[])
        : [];
    } catch {
      suggestions = [];
    }
    return res.json({ suggestions });
  } catch (err) {
    logger.error({ err }, "AI comment failed");
    return res.status(500).json({ error: "AI comment generation failed" });
  }
});

export default router;
