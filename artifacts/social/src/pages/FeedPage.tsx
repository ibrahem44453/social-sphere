import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { PostComposer } from "@/components/PostComposer";
import { PostCard } from "@/components/PostCard";
import { SkeletonPost } from "@/components/SkeletonPost";
import {
  useListFeed,
  useListFollowingFeed,
  getListFeedQueryKey,
  getListFollowingFeedQueryKey,
} from "@workspace/api-client-react";
import type { Post } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function FeedPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"global" | "following">("global");
  const [, setLocation] = useLocation();

  const headers = user ? { "x-user-id": user.id } : undefined;

  const { data: globalData, isLoading: globalLoading } = useListFeed({
    request: { headers },
    query: {
      queryKey: getListFeedQueryKey(),
      enabled: tab === "global",
    },
  });

  const { data: followingData, isLoading: followingLoading } = useListFollowingFeed({
    request: { headers },
    query: {
      queryKey: getListFollowingFeedQueryKey(),
      enabled: tab === "following",
    },
  });

  const isLoading = tab === "global" ? globalLoading : followingLoading;
  const posts: Post[] =
    (tab === "global" ? globalData?.posts : followingData?.posts) ?? [];

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="sticky top-0 z-10 glass border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold">Home</h1>
        </div>
        <div className="flex">
          {(["global", "following"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
              )}
            >
              {t === "global" ? "For You" : "Following"}
              {tab === t && (
                <motion.div
                  layoutId="feed-tab-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {user && <PostComposer />}

      <div>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonPost key={i} />)
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-2xl">
              ✦
            </div>
            <h3 className="text-base font-semibold mb-2">
              {tab === "following" ? "No posts from people you follow" : "No posts yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {tab === "following"
                ? "Follow some people to see their posts here."
                : "Be the first to share something."}
            </p>
            {tab === "following" && (
              <button
                onClick={() => setLocation("/explore")}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Explore people
              </button>
            )}
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onCommentClick={() => setLocation(`/post/${post.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
