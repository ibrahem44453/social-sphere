import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Copy,
  Check,
  RotateCcw,
  X,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import {
  useGeneratePost,
  useContentIdeas,
  type GenerateStyle,
  type ContentIdea,
} from "@/hooks/useAI";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AIGeneratorPanelProps {
  open: boolean;
  onClose: () => void;
  onUseText?: (text: string) => void;
}

const STYLES: { id: GenerateStyle; label: string; emoji: string; desc: string }[] = [
  { id: "casual", label: "Casual", emoji: "💬", desc: "Friendly & conversational" },
  { id: "professional", label: "Professional", emoji: "💼", desc: "Polished & authoritative" },
  { id: "humorous", label: "Humorous", emoji: "😄", desc: "Funny & witty" },
  { id: "inspiring", label: "Inspiring", emoji: "✨", desc: "Motivational & uplifting" },
  { id: "educational", label: "Educational", emoji: "📚", desc: "Informative & insightful" },
];

type Mode = "generate" | "ideas";

export function AIGeneratorPanel({ open, onClose, onUseText }: AIGeneratorPanelProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("generate");
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState<GenerateStyle>("casual");
  const [generated, setGenerated] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [copied, setCopied] = useState(false);

  const generatePost = useGeneratePost();
  const contentIdeas = useContentIdeas();

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setGenerated(null);
    generatePost.mutate(
      { topic: topic.trim(), style },
      {
        onSuccess: (data) => setGenerated(data.result),
        onError: (err) => {
          toast({
            title: "Generation failed",
            description: err instanceof Error ? err.message : "Try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleGetIdeas = () => {
    if (!topic.trim()) return;
    setIdeas([]);
    contentIdeas.mutate(
      { niche: topic.trim(), count: 5 },
      {
        onSuccess: (data) => setIdeas(data.ideas),
        onError: (err) => {
          toast({
            title: "Failed to get ideas",
            description: err instanceof Error ? err.message : "Try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied to clipboard" });
    });
  };

  const handleUse = (text: string) => {
    onUseText?.(text);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      mode === "generate" ? handleGenerate() : handleGetIdeas();
    }
    if (e.key === "Escape") onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">AI Content Studio</h2>
              <p className="text-xs text-muted-foreground">Generate posts with AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex bg-muted rounded-xl p-1 gap-1">
            {([
              { id: "generate" as Mode, label: "Generate Post", icon: Wand2 },
              { id: "ideas" as Mode, label: "Content Ideas", icon: Lightbulb },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setMode(id);
                  setGenerated(null);
                  setIdeas([]);
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                  mode === id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {mode === "generate" ? "Topic or idea" : "Your niche or topic"}
            </label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "generate"
                  ? "e.g. morning coffee rituals, AI in education..."
                  : "e.g. fitness, web development, personal finance..."
              }
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
              autoFocus
            />
          </div>

          {mode === "generate" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Tone</label>
              <div className="grid grid-cols-5 gap-1.5">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    title={s.desc}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all",
                      style === s.id
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border hover:border-border/80 hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="text-base">{s.emoji}</span>
                    <span className="text-[10px] font-semibold leading-tight">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={mode === "generate" ? handleGenerate : handleGetIdeas}
            disabled={
              !topic.trim() ||
              generatePost.isPending ||
              contentIdeas.isPending
            }
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {generatePost.isPending || contentIdeas.isPending ? (
              <>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-white"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                    />
                  ))}
                </div>
                <span>Generating…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {mode === "generate" ? "Generate Post" : "Get Ideas"}
              </>
            )}
          </button>

          <AnimatePresence>
            {generated && mode === "generate" && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-xl border border-primary/30 bg-primary/5 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Generated post
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleCopy(generated)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Copy"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Regenerate"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {generated}
                </p>
                {onUseText && (
                  <button
                    onClick={() => handleUse(generated)}
                    className="mt-3 w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Use this post
                  </button>
                )}
              </motion.div>
            )}

            {ideas.length > 0 && mode === "ideas" && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <p className="text-xs font-semibold text-muted-foreground">
                  {ideas.length} content ideas
                </p>
                {ideas.map((idea, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                    onClick={() => {
                      setMode("generate");
                      setTopic(idea.title);
                      setGenerated(null);
                    }}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {idea.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {idea.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-5 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="font-mono bg-muted px-1 rounded">⌘ Enter</kbd> to generate
          </p>
        </div>
      </motion.div>
    </div>
  );
}
