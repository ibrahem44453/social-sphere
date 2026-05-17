import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Send, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { PostCard } from "@/components/PostCard";
import { UserAvatar } from "@/components/UserAvatar";
import { SkeletonPost } from "@/components/SkeletonPost";
import {
  useGetPost,
  useGetComments,
  useCreateComment,
  useRecordPostView,
  getGetCommentsQueryKey,
  getGetPostQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { timeAgo } from "@/lib/utils";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [viewCount, setViewCount] = useState<number | null>(null);

  const headers = user ? { "x-user-id": user.id } : undefined;

  const { data: post, isLoading: postLoading } = useGetPost(postId!, {
    request: { headers },
    query: {
      enabled: !!postId,
      queryKey: getGetPostQueryKey(postId!),
    },
  });

  const { data: comments, isLoading: commentsLoading } = useGetComments(postId!, {
    request: { headers },
    query: {
      enabled: !!postId,
      queryKey: getGetCommentsQueryKey(postId!),
    },
  });

  const recordView = useRecordPostView({
    request: { headers },
    mutation: {
      onSuccess: (data) => {
        setViewCount(data.views_count);
      },
    },
  });

  // Record view when post loads (once per mount)
  useEffect(() => {
    if (post && user && postId) {
      recordView.mutate({ postId });
    }
  }, [post?.id, user?.id]);

  const createComment = useCreateComment({
    request: { headers },
    mutation: {
      onSuccess: () => {
        setComment("");
        qc.invalidateQueries({ queryKey: getGetCommentsQueryKey(postId!) });
        qc.invalidateQueries({ queryKey: getGetPostQueryKey(postId!) });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;
    createComment.mutate({ postId: postId!, data: { content: comment.trim() } });
  };

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "me";
  const displayName = user?.user_metadata?.display_name || username;

  const displayViewCount = viewCount ?? post?.views_count ?? 0;

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="sticky top-0 z-10 glass border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setLocation("/feed")}
          className="p-1.5 rounded-xl hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold">Post</span>

        {/* View count in header */}
        <div className="ml-auto flex items-center gap-1.5 text-muted-foreground text-sm">
          <Eye className="w-4 h-4" />
          <span>{formatCount(displayViewCount)} views</span>
        </div>
      </div>

      {postLoading ? (
        <SkeletonPost />
      ) : post ? (
        <PostCard post={{ ...post, views_count: displayViewCount }} showActions onCommentClick={() => {}} />
      ) : (
        <div className="text-center py-20 text-muted-foreground">Post not found</div>
      )}

      {user && (
        <form
          onSubmit={handleSubmit}
          className="border-b border-border px-4 py-4 flex gap-3"
        >
          <UserAvatar
            username={username}
            displayName={displayName}
            size="md"
            className="shrink-0"
          />
          <div className="flex-1 flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 bg-input border border-border rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
            />
            <button
              type="submit"
              disabled={!comment.trim() || createComment.isPending}
              className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              {createComment.isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      )}

      <div>
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {commentsLoading
              ? "Loading replies..."
              : `${comments?.length ?? 0} ${(comments?.length ?? 0) === 1 ? "Reply" : "Replies"}`}
          </h2>
        </div>

        {commentsLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonPost key={i} />)
        ) : !comments?.length ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No replies yet. Be the first!
          </div>
        ) : (
          comments.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-b border-border px-4 py-4 flex gap-3"
            >
              <UserAvatar
                username={c.author?.username ?? ""}
                displayName={c.author?.display_name ?? ""}
                avatarUrl={c.author?.avatar_url}
                size="md"
                className="shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm">{c.author?.display_name}</span>
                  <span className="text-muted-foreground text-sm">@{c.author?.username}</span>
                  <span className="text-muted-foreground text-xs">· {timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm mt-1 text-foreground/90 leading-relaxed">
                  {c.content}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
