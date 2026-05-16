import { useState } from "react";
import { motion } from "framer-motion";
import { Send, X } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePost, getListFeedQueryKey, getListFollowingFeedQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PostComposerProps {
  onPosted?: () => void;
  placeholder?: string;
}

export function PostComposer({ onPosted, placeholder = "What's on your mind?" }: PostComposerProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [focused, setFocused] = useState(false);

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "you";
  const displayName = user?.user_metadata?.display_name || username;

  const headers = user ? { "x-user-id": user.id } : undefined;

  const createPost = useCreatePost({
    request: { headers },
    mutation: {
      onSuccess: () => {
        setContent("");
        setFocused(false);
        qc.invalidateQueries({ queryKey: getListFeedQueryKey() });
        qc.invalidateQueries({ queryKey: getListFollowingFeedQueryKey() });
        toast({ title: "Posted!", description: "Your post is now live." });
        onPosted?.();
      },
      onError: (err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        toast({ title: "Failed to post", description: message, variant: "destructive" });
      },
    },
  });

  const handleSubmit = () => {
    if (!content.trim() || !user) return;
    createPost.mutate({ data: { content: content.trim() } });
  };

  const charLimit = 2200;
  const remaining = charLimit - content.length;
  const overLimit = remaining < 0;
  const nearLimit = remaining < 100;

  return (
    <div className="border-b border-border px-4 py-4">
      <div className="flex gap-3">
        <UserAvatar username={username} displayName={displayName} size="md" className="shrink-0 mt-1" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={placeholder}
            rows={focused ? 3 : 2}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-base leading-relaxed"
          />
          <motion.div
            initial={false}
            animate={{ height: focused ? "auto" : 0, opacity: focused ? 1 : 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
              <span
                className={cn(
                  "text-xs",
                  nearLimit
                    ? overLimit
                      ? "text-destructive"
                      : "text-amber-400"
                    : "text-muted-foreground"
                )}
              >
                {remaining} remaining
              </span>
              <div className="flex items-center gap-2">
                {content.trim() && (
                  <button
                    onClick={() => {
                      setContent("");
                      setFocused(false);
                    }}
                    className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || overLimit || createPost.isPending}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {createPost.isPending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Post
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
