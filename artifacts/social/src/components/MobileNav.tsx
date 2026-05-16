import { Link, useLocation } from "wouter";
import { Home, Compass, Bell, User, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetUnreadNotificationCount,
  getGetUnreadNotificationCountQueryKey,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const NAV = [
  { icon: Home, href: "/feed" },
  { icon: Compass, href: "/explore" },
  { icon: Bell, href: "/notifications", badge: true },
  { icon: User, href: "/profile/me", dynamic: true },
  { icon: Settings, href: "/settings" },
];

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "me";
  const headers = user ? { "x-user-id": user.id } : undefined;

  const { data: unreadData } = useGetUnreadNotificationCount({
    request: { headers },
    query: { queryKey: getGetUnreadNotificationCountQueryKey() },
  });
  const unreadCount = unreadData?.count ?? 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur border-t border-border flex items-center justify-around px-2 py-2 md:hidden">
      {NAV.map(({ icon: Icon, href, badge, dynamic }) => {
        const resolvedHref =
          dynamic && href === "/profile/me" ? `/profile/${username}` : href;
        const isActive =
          location === resolvedHref ||
          (href === "/profile/me" && location.startsWith("/profile/"));

        return (
          <Link key={href} href={resolvedHref}>
            <div
              className={cn(
                "flex flex-col items-center p-2 rounded-xl transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {badge && unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
