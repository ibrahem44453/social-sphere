import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Sparkles, Check, RotateCcw, ChevronDown } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCreatePost,
  useEnhancePost,
  getListFeedQueryKey,
  getListFollowingFeedQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PostComposerProps {
  onPosted?: () => void;
  placeholder?: string;
}

type AiAction = {
  id: string;
  label: string;
  description: string;
  emoji: string;
};

const AI_ACTIONS: AiAction[] = [
  { id: "improve",          label: "Improve",       description: "Enhance writing quality",      emoji: "✨" },
  { id: "rewrite",          label: "Rewrite",        description: "Fresh wording, same idea",     emoji: "🔄" },
  { id: "fix_grammar",      label: "Fix grammar",    description: "Correct errors",               emoji: "📝" },
  { id: "shorten",          label: "Shorten",        description: "Make it more concise",         emoji: "✂️" },
  { id: "expand",           label: "Expand",         description: "Add more detail",              emoji: "📖" },
  { id: "hashtags",         label: "Hashtags",       description: "Generate relevant hashtags",   emoji: "#️⃣" },
  { id: "tone_professional",label: "Professional",   description: "Polished & formal tone",       emoji: "💼" },
  { id: "tone_casual",      label: "Casual",         description: "Friendly & relaxed tone",      emoji: "😊" },
  { id: "engaging",         label: "Make engaging",  description: "Boost likes & comments",       emoji: "🔥" },
];

export function PostComposer({ onPosted, placeholder = "What's on your mind?" }: PostComposerProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [content, setContent] = useState("");
  const [focused, setFocused] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "you";
  const displayName = user?.user_metadata?.display_name || username;
  const headers = user ? { "x-user-id": user.id } : undefined;

  const createPost = useCreatePost({
    request: { headers },
    mutation: {
      onSuccess: () => {
        setContent("");
        setFocused(false);
        setShowAiPanel(false);
        setAiPreview(null);
        setActiveAction(null);
        qc.invalidateQueries({ queryKey: getListFeedQueryKey() });
        qc.invalidateQueries({ queryKey: getListFollowingFeedQueryKey() });
        toast({ title: "Posted!", description: "Your post is now live." });
        onPosted?.();
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        toast({ title: "Failed to post", description: message, variant: "destructive" });
      },
    },
  });

  const enhancePost = useEnhancePost({
    request: { headers },
    mutation: {
      onSuccess: (data) => {
        setAiPreview(data.result);
      },
      onError: () => {
        toast({ title: "AI unavailable", description: "Couldn't reach the AI. Try again.", variant: "destructive" });
        setActiveAction(null);
      },
    },
  });

  const handleSubmit = () => {
    if (!content.trim() || !user) return;
    createPost.mutate({ data: { content: content.trim() } });
  };

  const handleAiAction = (action: AiAction) => {
    if (!content.trim()) {
      toast({ title: "Write something first", description: "The AI needs text to work with.", variant: "destructive" });
      return;
    }
    setActiveAction(action.id);
    setAiPreview(null);
    enhancePost.mutate({ data: { content: content.trim(), action: action.id as any } });
  };

  const applyAiResult = () => {
    if (aiPreview) {
      setContent(aiPreview);
      setAiPreview(null);
      setActiveAction(null);
      setShowAiPanel(false);
      textareaRef.current?.focus();
    }
  };

  const dismissAiResult = () => {
    setAiPreview(null);
    setActiveAction(null);
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
            ref={textareaRef}
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
            {/* AI Preview Panel */}
            <AnimatePresence>
              {aiPreview && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-3 rounded-xl border border-primary/30 bg-primary/5 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-semibold text-primary">AI suggestion</span>
                    </div>
                    <button
                      onClick={dismissAiResult}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{aiPreview}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={applyAiResult}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Apply
                    </button>
                    <button
                      onClick={() => activeAction && handleAiAction(AI_ACTIONS.find(a => a.id === activeAction)!)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-foreground text-xs font-semibold hover:bg-accent/80 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Loading State */}
            <AnimatePresence>
              {enhancePost.isPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-3 rounded-xl border border-border bg-accent/30 p-3 flex items-center gap-3"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    AI is {AI_ACTIONS.find(a => a.id === activeAction)?.description.toLowerCase() ?? "thinking"}…
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Toggle Button */}
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setShowAiPanel((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  showAiPanel
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Enhance
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform duration-200",
                    showAiPanel && "rotate-180"
                  )}
                />
              </button>
            </div>

            {/* AI Actions Grid */}
            <AnimatePresence>
              {showAiPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-3"
                >
                  <div className="grid grid-cols-3 gap-1.5 p-3 rounded-xl bg-accent/20 border border-border">
                    {AI_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleAiAction(action)}
                        disabled={enhancePost.isPending}
                        className={cn(
                          "flex flex-col items-start gap-0.5 p-2 rounded-lg text-left transition-all",
                          activeAction === action.id
                            ? "bg-primary/20 border border-primary/40"
                            : "hover:bg-accent border border-transparent hover:border-border",
                          enhancePost.isPending && activeAction !== action.id && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        <span className="text-base leading-none">{action.emoji}</span>
                        <span className="text-xs font-semibold text-foreground mt-1">{action.label}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">{action.description}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer: char count + post button */}
            <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
              <span
                className={cn(
                  "text-xs",
                  nearLimit ? overLimit ? "text-destructive" : "text-amber-400" : "text-muted-foreground"
                )}
              >
                {remaining} remaining
              </span>
              <div className="flex items-center gap-2">
                {content.trim() && (
                  <button
                    onClick={() => { setContent(""); setFocused(false); setAiPreview(null); setActiveAction(null); }}
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
