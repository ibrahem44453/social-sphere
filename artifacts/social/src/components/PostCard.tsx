import { useState } from "react";
import { Link } from "wouter";
import { Heart, MessageCircle, MoreHorizontal, Trash2, Eye, Share2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatCount(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

interface PostCardProps {
  post: Post;
  onCommentClick?: () => void;
  showActions?: boolean;
}

export function PostCard({
  post,
  onCommentClick,
  showActions = true,
}: PostCardProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [imgError, setImgError] = useState(false);

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
          qc.invalidateQueries({
            queryKey: getListUserPostsQueryKey(post.author.id),
          });
        }
        toast({ title: "Post deleted" });
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        text: post.content,
        url: window.location.origin + `/post/${post.id}`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        window.location.origin + `/post/${post.id}`
      );
      toast({ title: "Link copied!" });
    }
  };

  const isOwner = user?.id === post.author?.id;
  const showImage = post.image_url && !imgError;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border py-4 px-4 hover:bg-white/[0.015] transition-colors cursor-pointer group"
      onClick={onCommentClick}
    >
      <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
        <Link href={`/profile/${post.author?.username}`}>
          <UserAvatar
            username={post.author?.username ?? ""}
            displayName={post.author?.display_name ?? ""}
            avatarUrl={post.author?.avatar_url}
            size="md"
            className="cursor-pointer hover:opacity-90 transition-opacity shrink-0 mt-0.5"
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
              <span className="text-muted-foreground text-sm">
                @{post.author?.username}
              </span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-muted-foreground text-xs">
                {timeAgo(post.created_at)}
              </span>
            </div>
            {isOwner && showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
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

          {showImage && (
            <div
              className="mt-3 rounded-2xl overflow-hidden border border-border/60 cursor-pointer"
              onClick={onCommentClick}
            >
              <img
                src={post.image_url!}
                alt="Post image"
                className="w-full object-cover max-h-[400px] hover:opacity-95 transition-opacity"
                onError={() => setImgError(true)}
                loading="lazy"
              />
            </div>
          )}

          {showActions && (
            <div className="flex items-center gap-1 mt-3 -ml-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike();
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 rounded-full text-sm transition-all hover:bg-rose-500/10 group/like",
                  liked
                    ? "text-rose-500"
                    : "text-muted-foreground hover:text-rose-500"
                )}
              >
                <motion.div
                  animate={likeAnimating ? { scale: [1, 1.5, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart
                    className={cn(
                      "w-4 h-4 transition-all",
                      liked && "fill-current"
                    )}
                  />
                </motion.div>
                <span className="text-xs font-medium">{formatCount(likeCount)}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentClick?.();
                }}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {formatCount(post.comments_count)}
                </span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-sm text-muted-foreground hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 ml-auto px-2 py-1.5 text-sm text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span className="text-xs">{formatCount(post.views_count ?? 0)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
