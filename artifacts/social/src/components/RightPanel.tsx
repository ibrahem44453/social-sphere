import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Wand2, Sparkles, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { UserAvatar } from "./UserAvatar";
import { AIGeneratorPanel } from "./AIGeneratorPanel";
import { useAuth } from "@/contexts/AuthContext";
import {
  useListSuggestedUsers,
  useFollowUser,
  getListSuggestedUsersQueryKey,
  getGetUserProfileQueryKey,
} from "@workspace/api-client-react";
import type { UserSummary } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

function SuggestedUserItem({
  u,
  headers,
}: {
  u: UserSummary;
  headers: Record<string, string> | undefined;
}) {
  const qc = useQueryClient();
  const [followed, setFollowed] = useState(u.is_following ?? false);

  const followUser = useFollowUser({
    request: { headers },
    mutation: {
      onSuccess: () => {
        setFollowed(true);
        qc.invalidateQueries({ queryKey: getGetUserProfileQueryKey(u.username) });
      },
    },
  });

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 transition-colors">
      <Link href={`/profile/${u.username}`}>
        <UserAvatar
          username={u.username}
          displayName={u.display_name}
          avatarUrl={u.avatar_url}
          size="sm"
          className="cursor-pointer"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${u.username}`}>
          <p className="text-xs font-semibold truncate hover:underline cursor-pointer">
            {u.display_name}
          </p>
        </Link>
        <p className="text-[11px] text-muted-foreground truncate">
          @{u.username}
        </p>
      </div>
      {!followed ? (
        <button
          onClick={() => followUser.mutate({ targetUserId: u.id })}
          disabled={followUser.isPending}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50 shrink-0"
        >
          <UserPlus className="w-3 h-3" />
          Follow
        </button>
      ) : (
        <span className="text-[11px] text-muted-foreground shrink-0">
          Following
        </span>
      )}
    </div>
  );
}

const TRENDING = [
  { tag: "#AI", posts: "12.4K posts" },
  { tag: "#TechTalks", posts: "8.2K posts" },
  { tag: "#BuildInPublic", posts: "5.6K posts" },
  { tag: "#OpenSource", posts: "4.1K posts" },
  { tag: "#WebDev", posts: "3.8K posts" },
];

export function RightPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showGenerator, setShowGenerator] = useState(false);
  const headers = user ? { "x-user-id": user.id } : undefined;

  const { data: suggested } = useListSuggestedUsers({
    request: { headers },
    query: { queryKey: getListSuggestedUsersQueryKey() },
  });

  const topSuggested = suggested?.slice(0, 4) ?? [];

  return (
    <>
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-gradient-to-br from-violet-950/40 via-indigo-950/20 to-card overflow-hidden"
        >
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">AI Content Studio</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Generate posts, get ideas, and supercharge your content with AI.
            </p>
            <button
              onClick={() => setShowGenerator(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              <Wand2 className="w-4 h-4" />
              Generate a post
            </button>
          </div>
        </motion.div>

        {topSuggested.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-bold">Who to follow</h3>
            </div>
            <div className="py-1">
              {topSuggested.map((u) => (
                <SuggestedUserItem key={u.id} u={u} headers={headers} />
              ))}
            </div>
            <button
              onClick={() => setLocation("/explore")}
              className="w-full px-4 py-3 text-xs font-medium text-primary hover:text-primary/80 hover:bg-accent/20 transition-colors text-left border-t border-border"
            >
              Show more →
            </button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold">Trending</h3>
          </div>
          <div className="py-1">
            {TRENDING.map((t, i) => (
              <div
                key={t.tag}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/30 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-xs text-muted-foreground">
                    #{i + 1} · Technology
                  </p>
                  <p className="text-sm font-bold mt-0.5">{t.tag}</p>
                  <p className="text-xs text-muted-foreground">{t.posts}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="text-[11px] text-muted-foreground/60 px-1 leading-relaxed">
          Pulse · Privacy · Terms · Help ·{" "}
          <span className="font-medium">© 2026</span>
        </p>
      </div>

      <AIGeneratorPanel
        open={showGenerator}
        onClose={() => setShowGenerator(false)}
      />
    </>
  );
}
