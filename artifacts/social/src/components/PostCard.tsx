import { useState } from "react";
import { Link } from "wouter";
import { Heart, MessageCircle, MoreHorizontal, Trash2, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { UserAvatar } from "./UserAvatar";
import { timeAgo, cn } from "@/lib/utils";
import {
  useLikePost,
  useUnlikePost,
  useDeletePost,
  getListFeedQueryKey,
  getListFollowingFeedQueryKey,
  getListUserPostsQueryKey,
} from "@workspace/api-client-react";
import type { Post } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

interface PostCardProps {
  post: Post;
  onCommentClick?: () => void;
  showActions?: boolean;
}

export function PostCard({ post, onCommentClick, showActions = true }: PostCardProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const headers = user ? { "x-user-id": user.id } : undefined;

  const likePost = useLikePost({
    request: { headers },
    mutation: {
      onSuccess: (data) => {
        setLikeCount(data.likes_count);
        setLiked(true);
      },
    },
  });

  const unlikePost = useUnlikePost({
    request: { headers },
    mutation: {
      onSuccess: (data) => {
        setLikeCount(data.likes_count);
        setLiked(false);
      },
    },
  });

  const deletePost = useDeletePost({
    request: { headers },
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListFeedQueryKey() });
        qc.invalidateQueries({ queryKey: getListFollowingFeedQueryKey() });
        if (post.author?.id) {
          qc.invalidateQueries({ queryKey: getListUserPostsQueryKey(post.author.id) });
        }
      },
    },
  });

  const handleLike = () => {
    if (!user) return;
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);
    if (liked) {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      unlikePost.mutate({ postId: post.id });
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      likePost.mutate({ postId: post.id });
    }
  };

  const isOwner = user?.id === post.author?.id;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border py-4 px-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
      onClick={onCommentClick}
    >
      <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
        <Link href={`/profile/${post.author?.username}`}>
          <UserAvatar
            username={post.author?.username ?? ""}
            displayName={post.author?.display_name ?? ""}
            avatarUrl={post.author?.avatar_url}
            size="md"
            className="cursor-pointer hover:opacity-90 transition-opacity shrink-0"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/profile/${post.author?.username}`}>
                <span className="font-semibold text-sm hover:underline cursor-pointer">
                  {post.author?.display_name}
                </span>
              </Link>
              <span className="text-muted-foreground text-sm">@{post.author?.username}</span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-muted-foreground text-xs">{timeAgo(post.created_at)}</span>
            </div>
            {isOwner && showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => deletePost.mutate({ postId: post.id })}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <p
            className="text-sm mt-1.5 text-foreground/90 leading-relaxed whitespace-pre-wrap break-words"
            onClick={onCommentClick}
          >
            {post.content}
          </p>

          {post.image_url && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border">
              <img
                src={post.image_url}
                alt="Post image"
                className="w-full object-cover max-h-96"
              />
            </div>
          )}

          {showActions && (
            <div className="flex items-center gap-5 mt-3">
              <button
                onClick={(e) => { e.stopPropagation(); handleLike(); }}
                className={cn(
                  "flex items-center gap-1.5 text-sm transition-all",
                  liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
                )}
              >
                <motion.div
                  animate={likeAnimating ? { scale: [1, 1.4, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart className={cn("w-4 h-4 transition-all", liked && "fill-current")} />
                </motion.div>
                <span>{formatCount(likeCount)}</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onCommentClick?.(); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{formatCount(post.comments_count)}</span>
              </button>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground ml-auto">
                <Eye className="w-4 h-4" />
                <span>{formatCount(post.views_count ?? 0)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
