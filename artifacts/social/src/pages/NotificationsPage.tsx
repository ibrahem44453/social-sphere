import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Heart, MessageCircle, UserPlus, Bell } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { SkeletonUser } from "@/components/SkeletonPost";
import {
  useListNotifications,
  useMarkNotificationsRead,
  getListNotificationsQueryKey,
  getGetUnreadNotificationCountQueryKey,
} from "@workspace/api-client-react";
import type { Notification } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { timeAgo, cn } from "@/lib/utils";

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Heart; color: string; label: string }
> = {
  like: { icon: Heart, color: "text-rose-400", label: "liked your post" },
  comment: {
    icon: MessageCircle,
    color: "text-blue-400",
    label: "commented on your post",
  },
  follow: {
    icon: UserPlus,
    color: "text-emerald-400",
    label: "started following you",
  },
  mention: { icon: Bell, color: "text-amber-400", label: "mentioned you" },
};

function NotificationItem({ n }: { n: Notification }) {
  const [, setLocation] = useLocation();
  const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.mention;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => n.post_id && setLocation(`/post/${n.post_id}`)}
      className={cn(
        "flex items-start gap-3 px-4 py-4 border-b border-border hover:bg-accent/20 transition-colors",
        n.post_id ? "cursor-pointer" : "",
        !n.is_read ? "bg-primary/5" : ""
      )}
    >
      <div className="relative shrink-0">
        <UserAvatar
          username={n.actor?.username ?? ""}
          displayName={n.actor?.display_name ?? ""}
          avatarUrl={n.actor?.avatar_url}
          size="md"
        />
        <div
          className={cn(
            "absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border-2 border-background flex items-center justify-center",
            config.color
          )}
        >
          <Icon className="w-2.5 h-2.5" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/profile/${n.actor?.username}`);
            }}
            className="font-semibold hover:underline"
          >
            {n.actor?.display_name}
          </button>{" "}
          <span className="text-muted-foreground">{config.label}</span>
        </p>
        {n.post_content && (
          <p className="text-muted-foreground text-xs mt-1 truncate border-l-2 border-border pl-2">
            {n.post_content}
          </p>
        )}
        {n.comment_content && (
          <p className="text-muted-foreground text-xs mt-1 italic">
            "{n.comment_content}"
          </p>
        )}
        <p className="text-muted-foreground text-xs mt-1">{timeAgo(n.created_at)}</p>
      </div>
      {!n.is_read && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </motion.div>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const headers = user ? { "x-user-id": user.id } : undefined;

  const { data, isLoading } = useListNotifications({
    request: { headers },
    query: { queryKey: getListNotificationsQueryKey() },
  });

  const markRead = useMarkNotificationsRead({
    request: { headers },
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        qc.invalidateQueries({
          queryKey: getGetUnreadNotificationCountQueryKey(),
        });
      },
    },
  });

  const notifications = data?.notifications ?? [];
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="sticky top-0 z-10 glass border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">Notifications</h1>
        {unread > 0 && (
          <button
            onClick={() => markRead.mutate()}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => <SkeletonUser key={i} />)
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">All caught up</h3>
          <p className="text-sm text-muted-foreground">
            Notifications for likes, comments, and new followers will appear here.
          </p>
        </div>
      ) : (
        notifications.map((n) => <NotificationItem key={n.id} n={n} />)
      )}
    </div>
  );
}
