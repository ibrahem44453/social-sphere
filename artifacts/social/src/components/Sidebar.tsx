import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Compass, Bell, User, Settings, LogOut, Wand2, PenSquare } from "lucide-react";
import { motion } from "framer-motion";
import { UserAvatar } from "./UserAvatar";
import { AIGeneratorPanel } from "./AIGeneratorPanel";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetUnreadNotificationCount,
  getGetUnreadNotificationCountQueryKey,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const NAV = [
  { icon: Home, label: "Feed", href: "/feed" },
  { icon: Compass, label: "Explore", href: "/explore" },
  { icon: Bell, label: "Notifications", href: "/notifications", badge: true },
  { icon: User, label: "Profile", href: "/profile/me", dynamic: true },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [showGenerator, setShowGenerator] = useState(false);

  const username =
    user?.user_metadata?.username || user?.email?.split("@")[0] || "me";
  const displayName = user?.user_metadata?.display_name || username;
  const headers = user ? { "x-user-id": user.id } : undefined;

  const { data: unreadData } = useGetUnreadNotificationCount({
    request: { headers },
    query: {
      queryKey: getGetUnreadNotificationCountQueryKey(),
      refetchInterval: 30000,
    },
  });
  const unreadCount = unreadData?.count ?? 0;

  return (
    <>
      <aside className="sticky top-0 h-screen w-64 flex flex-col border-r border-sidebar-border bg-sidebar px-3 py-4">
        <Link href="/feed">
          <div className="px-3 mb-5 cursor-pointer">
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Pulse
            </span>
          </div>
        </Link>

        <nav className="flex-1 flex flex-col gap-0.5">
          {NAV.map(({ icon: Icon, label, href, badge, dynamic }) => {
            const resolvedHref =
              dynamic && href === "/profile/me"
                ? `/profile/${username}`
                : href;
            const isActive =
              location === resolvedHref ||
              (href === "/profile/me" && location.startsWith("/profile/"));

            return (
              <Link key={label} href={resolvedHref}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      isActive && "stroke-[2.2px]"
                    )}
                  />
                  {label}
                  {badge && unreadCount > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}

          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-primary/10 hover:text-primary transition-colors mt-1"
          >
            <Wand2 className="w-5 h-5 shrink-0" />
            AI Studio
          </button>
        </nav>

        <div className="mt-4">
          <button
            onClick={() => setLocation("/feed")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all mb-3"
          >
            <PenSquare className="w-4 h-4" />
            New Post
          </button>
        </div>

        <div className="border-t border-sidebar-border pt-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sidebar-accent transition-colors">
            <UserAvatar
              username={username}
              displayName={displayName}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">
                @{username}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <AIGeneratorPanel
        open={showGenerator}
        onClose={() => setShowGenerator(false)}
      />
    </>
  );
}
