import { useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { UserAvatar } from "@/components/UserAvatar";
import { SkeletonUser } from "@/components/SkeletonPost";
import {
  useGetSuggestedUsers,
  useFindUsers,
  useFollowUser,
  useUnfollowUser,
  getGetSuggestedUsersQueryKey,
  getFindUsersQueryKey,
  getGetUserProfileQueryKey,
} from "@workspace/api-client-react";
import type { UserSummary } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

function UserCard({
  u,
  onNavigate,
}: {
  u: UserSummary;
  onNavigate: (username: string) => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const headers = user ? { "x-user-id": user.id } : undefined;
  const [following, setFollowing] = useState(u.is_following ?? false);

  const followUser = useFollowUser({
    request: { headers },
    mutation: {
      onSuccess: () => {
        setFollowing(true);
        qc.invalidateQueries({ queryKey: getGetUserProfileQueryKey(u.username) });
      },
    },
  });

  const unfollowUser = useUnfollowUser({
    request: { headers },
    mutation: {
      onSuccess: () => {
        setFollowing(false);
        qc.invalidateQueries({ queryKey: getGetUserProfileQueryKey(u.username) });
      },
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors border-b border-border"
    >
      <button onClick={() => onNavigate(u.username)} className="shrink-0">
        <UserAvatar
          username={u.username}
          displayName={u.display_name}
          avatarUrl={u.avatar_url}
          size="md"
        />
      </button>
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onNavigate(u.username)}
      >
        <p className="font-semibold text-sm truncate hover:underline">
          {u.display_name}
        </p>
        <p className="text-muted-foreground text-xs">@{u.username}</p>
        {u.bio && (
          <p className="text-muted-foreground text-xs mt-0.5 truncate">{u.bio}</p>
        )}
        <p className="text-muted-foreground text-xs mt-0.5">
          {u.followers_count ?? 0} followers
        </p>
      </div>
      {user?.id !== u.id && (
        <button
          onClick={() =>
            following
              ? unfollowUser.mutate({ targetUserId: u.id })
              : followUser.mutate({ targetUserId: u.id })
          }
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0",
            following
              ? "border border-border text-foreground hover:border-destructive hover:text-destructive"
              : "bg-foreground text-background hover:bg-foreground/90"
          )}
        >
          {following ? "Following" : "Follow"}
        </button>
      )}
    </motion.div>
  );
}

export default function ExplorePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const headers = user ? { "x-user-id": user.id } : undefined;

  const { data: suggested, isLoading: suggestedLoading } = useGetSuggestedUsers({
    request: { headers },
    query: { queryKey: getGetSuggestedUsersQueryKey() },
  });

  const { data: searchResults, isLoading: searchLoading } = useFindUsers(
    { q: query },
    {
      request: { headers },
      query: {
        enabled: query.length >= 2,
        queryKey: getFindUsersQueryKey({ q: query }),
      },
    }
  );

  const isSearching = query.length >= 2;
  const users = isSearching ? (searchResults ?? []) : (suggested ?? []);
  const isLoading = isSearching ? searchLoading : suggestedLoading;

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="sticky top-0 z-10 glass border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold mb-3">Explore</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people..."
            className="w-full bg-input border border-border rounded-full pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
          />
        </div>
      </div>

      <div>
        {!isSearching && (
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Suggested for you
            </h2>
          </div>
        )}
        {isSearching && !searchLoading && (
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {searchResults?.length
                ? `${searchResults.length} result${searchResults.length === 1 ? "" : "s"} for "${query}"`
                : `No results for "${query}"`}
            </h2>
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonUser key={i} />)
        ) : users.length === 0 && isSearching ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No users found
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No suggestions yet
          </div>
        ) : (
          users.map((u) => (
            <UserCard
              key={u.id}
              u={u}
              onNavigate={(username) => setLocation(`/profile/${username}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
