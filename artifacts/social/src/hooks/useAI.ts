import { useMutation } from "@tanstack/react-query";
import { apiUrl } from "@/lib/utils";

export type GenerateStyle =
  | "casual"
  | "professional"
  | "humorous"
  | "inspiring"
  | "educational";

export interface ContentIdea {
  title: string;
  description: string;
}

export function useGeneratePost() {
  return useMutation({
    mutationFn: async ({
      topic,
      style,
    }: {
      topic: string;
      style: GenerateStyle;
    }) => {
      const res = await fetch(apiUrl("/ai/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, style }),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Failed to generate" }));
        throw new Error(
          (err as { error?: string }).error || "Failed to generate post"
        );
      }
      return res.json() as Promise<{ result: string }>;
    },
  });
}

export function useContentIdeas() {
  return useMutation({
    mutationFn: async ({
      niche,
      count = 5,
    }: {
      niche: string;
      count?: number;
    }) => {
      const res = await fetch(apiUrl("/ai/ideas"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, count }),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Failed to get ideas" }));
        throw new Error(
          (err as { error?: string }).error || "Failed to get content ideas"
        );
      }
      return res.json() as Promise<{ ideas: ContentIdea[] }>;
    },
  });
}

export function useCommentSuggestions() {
  return useMutation({
    mutationFn: async ({ postContent }: { postContent: string }) => {
      const res = await fetch(apiUrl("/ai/comment"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_content: postContent }),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Failed to get suggestions" }));
        throw new Error(
          (err as { error?: string }).error || "Failed to get comment suggestions"
        );
      }
      return res.json() as Promise<{ suggestions: string[] }>;
    },
  });
}
