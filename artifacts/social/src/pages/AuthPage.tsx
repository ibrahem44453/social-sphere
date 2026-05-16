import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "At least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "At least 6 characters"),
  username: z.string().min(3, "At least 3 characters").max(20).regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, underscores"),
  displayName: z.string().min(1, "Required").max(50),
});

type LoginData = z.infer<typeof loginSchema>;
type SignupData = z.infer<typeof signupSchema>;

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { login, signup } = useAuth();
  const [, setLocation] = useLocation();

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupData>({ resolver: zodResolver(signupSchema) });

  const onLogin = async (data: LoginData) => {
    setError("");
    const { error } = await login(data.email, data.password);
    if (error) { setError(error); return; }
    setLocation("/feed");
  };

  const onSignup = async (data: SignupData) => {
    setError(""); setSuccess("");
    const { error } = await signup(data.email, data.password, data.username, data.displayName);
    if (error) { setError(error); return; }
    setSuccess("Check your email to confirm your account, then sign in.");
    setTab("login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 bg-gradient-to-br from-violet-950/50 via-background to-indigo-950/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_hsl(259_94%_61%_/_0.15),_transparent_60%)]" />
        <div className="relative z-10 max-w-md">
          <div className="text-5xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-6">
            Pulse
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4 leading-tight">
            Share moments.<br />Build connections.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A place where real conversations happen. Follow people you care about, share what matters, and discover new perspectives.
          </p>
          <div className="mt-10 flex flex-col gap-4">
            {[
              "Real-time notifications for likes, comments & follows",
              "Clean, distraction-free reading experience",
              "Follow your favorite people and topics",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 lg:max-w-md flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <span className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Pulse
            </span>
          </div>

          <div className="flex bg-muted rounded-xl p-1 mb-8">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                  tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`button-tab-${t}`}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                onSubmit={loginForm.handleSubmit(onLogin)}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Email</label>
                  <input
                    {...loginForm.register("email")}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                    data-testid="input-login-email"
                  />
                  {loginForm.formState.errors.email && <p className="text-destructive text-xs mt-1">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Password</label>
                  <input
                    {...loginForm.register("password")}
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                    data-testid="input-login-password"
                  />
                  {loginForm.formState.errors.password && <p className="text-destructive text-xs mt-1">{loginForm.formState.errors.password.message}</p>}
                </div>
                {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3">{error}</div>}
                {success && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl px-4 py-3">{success}</div>}
                <button
                  type="submit"
                  disabled={loginForm.formState.isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm"
                  data-testid="button-login-submit"
                >
                  {loginForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                onSubmit={signupForm.handleSubmit(onSignup)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Username</label>
                    <input
                      {...signupForm.register("username")}
                      placeholder="yourname"
                      className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                      data-testid="input-signup-username"
                    />
                    {signupForm.formState.errors.username && <p className="text-destructive text-xs mt-1">{signupForm.formState.errors.username.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Display Name</label>
                    <input
                      {...signupForm.register("displayName")}
                      placeholder="Your Name"
                      className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                      data-testid="input-signup-displayname"
                    />
                    {signupForm.formState.errors.displayName && <p className="text-destructive text-xs mt-1">{signupForm.formState.errors.displayName.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Email</label>
                  <input
                    {...signupForm.register("email")}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                    data-testid="input-signup-email"
                  />
                  {signupForm.formState.errors.email && <p className="text-destructive text-xs mt-1">{signupForm.formState.errors.email.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Password</label>
                  <input
                    {...signupForm.register("password")}
                    type="password"
                    placeholder="At least 6 characters"
                    className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                    data-testid="input-signup-password"
                  />
                  {signupForm.formState.errors.password && <p className="text-destructive text-xs mt-1">{signupForm.formState.errors.password.message}</p>}
                </div>
                {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3">{error}</div>}
                <button
                  type="submit"
                  disabled={signupForm.formState.isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm"
                  data-testid="button-signup-submit"
                >
                  {signupForm.formState.isSubmitting ? "Creating account..." : "Create Account"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
