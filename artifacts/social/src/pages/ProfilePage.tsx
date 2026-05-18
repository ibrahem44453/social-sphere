import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Globe, Calendar, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { UserAvatar } from "@/components/UserAvatar";
import { PostCard } from "@/components/PostCard";
import { SkeletonPost, SkeletonProfile } from "@/components/SkeletonPost";
import {
  useGetUserProfile,
  useListUserPosts,
  useListUserFollowers,
  useListUserFollowing,
  useFollowUser,
  useUnfollowUser,
  getGetUserProfileQueryKey,
  getListUserPostsQueryKey,
  getListUserFollowersQueryKey,
  getListUserFollowingQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type TabType = "posts" | "followers" | "following";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabType>("posts");

  const currentUsername =
    user?.user_metadata?.username || user?.email?.split("@")[0] || "";
  const resolvedUsername = username === "me" ? currentUsername : username;

  const headers = user ? { "x-user-id": user.id } : undefined;

  const { data: profile, isLoading: profileLoading } = useGetUserProfile(
    resolvedUsername!,
    {
      request: { headers },
      query: {
        enabled: !!resolvedUsername,
        queryKey: getGetUserProfileQueryKey(resolvedUsername!),
      },
    }
  );

  const { data: postsData, isLoading: postsLoading } = useListUserPosts(
    profile?.id ?? "",
    {
      request: { headers },
      query: {
        enabled: !!profile?.id && tab === "posts",
        queryKey: getListUserPostsQueryKey(profile?.id ?? ""),
      },
    }
  );

  const { data: followers } = useListUserFollowers(profile?.id ?? "", {
    request: { headers },
    query: {
      enabled: !!profile?.id && tab === "followers",
      queryKey: getListUserFollowersQueryKey(profile?.id ?? ""),
    },
  });

  const { data: following } = useListUserFollowing(profile?.id ?? "", {
    request: { headers },
    query: {
      enabled: !!profile?.id && tab === "following",
      queryKey: getListUserFollowingQueryKey(profile?.id ?? ""),
    },
  });

  const [localFollowing, setLocalFollowing] = useState<boolean | null>(null);
  const [localFollowCount, setLocalFollowCount] = useState<number | null>(null);
  const isFollowing =
    localFollowing !== null
      ? localFollowing
      : (profile?.is_following ?? false);
  const followCount =
    localFollowCount !== null
      ? localFollowCount
      : (profile?.followers_count ?? 0);

  const followUser = useFollowUser({
    request: { headers },
    mutation: {
      onSuccess: (data) => {
        setLocalFollowing(true);
        setLocalFollowCount(data.followers_count);
        qc.invalidateQueries({
          queryKey: getGetUserProfileQueryKey(resolvedUsername!),
        });
      },
    },
  });

  const unfollowUser = useUnfollowUser({
    request: { headers },
    mutation: {
      onSuccess: (data) => {
        setLocalFollowing(false);
        setLocalFollowCount(data.followers_count);
        qc.invalidateQueries({
          queryKey: getGetUserProfileQueryKey(resolvedUsername!),
        });
      },
    },
  });

  const isOwnProfile = user?.id === profile?.id;

  if (profileLoading) {
    return (
      <div className="max-w-[600px] mx-auto">
        <div className="sticky top-0 z-10 glass border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation("/feed")}
            className="p-1.5 rounded-xl hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold">Profile</span>
        </div>
        <SkeletonProfile />
      </div>
    );
  }

  if (!profile)
    return (
      <div className="text-center py-20 text-muted-foreground">
        User not found
      </div>
    );

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: "posts", label: "Posts", count: postsData?.posts?.length },
    { id: "followers", label: "Followers" },
    { id: "following", label: "Following" },
  ];

  const joinedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="sticky top-0 z-10 glass border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setLocation("/feed")}
          className="p-1.5 rounded-xl hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="font-bold block leading-tight">
            {profile.display_name}
          </span>
          <span className="text-xs text-muted-foreground">
            {postsData?.posts?.length ?? 0} posts
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-violet-900/50 via-purple-900/30 to-indigo-900/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(259_94%_61%_/_0.3),_transparent_70%)]" />
        </div>
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <UserAvatar
              username={profile.username}
              displayName={profile.display_name}
              avatarUrl={profile.avatar_url}
              size="xl"
              className="border-4 border-background ring-2 ring-primary/20"
            />
            <div className="flex gap-2 mb-1">
              {!isOwnProfile && user && (
                <button
                  onClick={() =>
                    isFollowing
                      ? unfollowUser.mutate({ targetUserId: profile.id })
                      : followUser.mutate({ targetUserId: profile.id })
                  }
                  disabled={followUser.isPending || unfollowUser.isPending}
                  className={cn(
                    "px-5 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50",
                    isFollowing
                      ? "border border-border text-foreground hover:border-destructive hover:text-destructive bg-background"
                      : "bg-foreground text-background hover:bg-foreground/90"
                  )}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
              {isOwnProfile && (
                <button
                  onClick={() => setLocation("/settings")}
                  className="px-5 py-2 rounded-full text-sm font-semibold border border-border hover:bg-accent transition-colors bg-background"
                >
                  Edit profile
                </button>
              )}
            </div>
          </div>

          <h1 className="text-xl font-bold leading-tight">{profile.display_name}</h1>
          <p className="text-muted-foreground text-sm">@{profile.username}</p>

          {profile.bio && (
            <p className="mt-3 text-sm text-foreground/90 leading-relaxed">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-3">
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary text-sm hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {joinedDate && (
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Calendar className="w-3.5 h-3.5" />
                Joined {joinedDate}
              </div>
            )}
          </div>

          <div className="flex items-center gap-5 mt-4 text-sm">
            <button
              onClick={() => setTab("following")}
              className="hover:underline group"
            >
              <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                {profile.following_count}
              </span>
              <span className="text-muted-foreground ml-1">Following</span>
            </button>
            <button
              onClick={() => setTab("followers")}
              className="hover:underline group"
            >
              <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                {followCount}
              </span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-border sticky top-[57px] z-10 glass">
        <div className="flex">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                tab === id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
              )}
            >
              {label}
              {tab === id && (
                <motion.div
                  layoutId="profile-tab-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === "posts" && (
        <div>
          {postsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonPost key={i} />)
          ) : !postsData?.posts?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-14 h-14 rounded-full bg-muted/40 flex items-center justify-center mb-4 text-2xl">
                📝
              </div>
              <h3 className="font-semibold mb-2">No posts yet</h3>
              <p className="text-sm text-muted-foreground">
                {isOwnProfile
                  ? "Share something with your followers."
                  : `${profile.display_name} hasn't posted yet.`}
              </p>
            </div>
          ) : (
            postsData.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onCommentClick={() => setLocation(`/post/${post.id}`)}
              />
            ))
          )}
        </div>
      )}

      {tab === "followers" && (
        <div>
          {!followers ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Loading…
            </div>
          ) : followers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No followers yet
            </div>
          ) : (
            followers.map((u) => (
              <button
                key={u.id}
                onClick={() => setLocation(`/profile/${u.username}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors border-b border-border"
              >
                <UserAvatar
                  username={u.username}
                  displayName={u.display_name}
                  avatarUrl={u.avatar_url}
                  size="md"
                />
                <div className="text-left">
                  <p className="font-semibold text-sm">{u.display_name}</p>
                  <p className="text-muted-foreground text-xs">
                    @{u.username}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {tab === "following" && (
        <div>
          {!following ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Loading…
            </div>
          ) : following.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Not following anyone yet
            </div>
          ) : (
            following.map((u) => (
              <button
                key={u.id}
                onClick={() => setLocation(`/profile/${u.username}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors border-b border-border"
              >
                <UserAvatar
                  username={u.username}
                  displayName={u.display_name}
                  avatarUrl={u.avatar_url}
                  size="md"
                />
                <div className="text-left">
                  <p className="font-semibold text-sm">{u.display_name}</p>
                  <p className="text-muted-foreground text-xs">
                    @{u.username}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
