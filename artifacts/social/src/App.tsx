import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import AuthPage from "@/pages/AuthPage";
import FeedPage from "@/pages/FeedPage";
import PostDetailPage from "@/pages/PostDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import ExplorePage from "@/pages/ExplorePage";
import NotificationsPage from "@/pages/NotificationsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/not-found";
import { setBaseUrl } from "@workspace/api-client-react";

const BASE = (import.meta.env.BASE_URL as string)?.replace(/\/$/, "") || "";
setBaseUrl(`${BASE}/api`);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Redirect to="/" />;
  return <>{children}</>;
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <main className="flex-1 min-w-0 pb-16 md:pb-0 border-x border-border">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Redirect to="/feed" />;
  return <AuthPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/feed">
        <ProtectedRoute>
          <AppShell><FeedPage /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/post/:postId">
        <ProtectedRoute>
          <AppShell><PostDetailPage /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/profile/:username">
        <ProtectedRoute>
          <AppShell><ProfilePage /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/explore">
        <ProtectedRoute>
          <AppShell><ExplorePage /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute>
          <AppShell><NotificationsPage /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <AppShell><SettingsPage /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
