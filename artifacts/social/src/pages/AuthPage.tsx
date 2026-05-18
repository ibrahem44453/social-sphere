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
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(20)
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, underscores"),
  displayName: z.string().min(1, "Required").max(50),
});

type LoginData = z.infer<typeof loginSchema>;
type SignupData = z.infer<typeof signupSchema>;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const FEATURES = [
  "AI-powered post generation & enhancement",
  "Real-time notifications for likes, comments & follows",
  "Clean, distraction-free reading experience",
  "Follow your favorite people and topics",
];

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, signup, loginWithGoogle } = useAuth();
  const [, setLocation] = useLocation();

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
  });

  const onLogin = async (data: LoginData) => {
    setError("");
    const { error } = await login(data.email, data.password);
    if (error) {
      setError(error);
      return;
    }
    setLocation("/feed");
  };

  const onSignup = async (data: SignupData) => {
    setError("");
    setSuccess("");
    const { error } = await signup(
      data.email,
      data.password,
      data.username,
      data.displayName
    );
    if (error) {
      setError(error);
      return;
    }
    setSuccess("Check your email to confirm your account, then sign in.");
    setTab("login");
  };

  const onGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    const { error } = await loginWithGoogle();
    setGoogleLoading(false);
    if (error) setError(error);
  };

  const inputCls =
    "w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all";

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 bg-gradient-to-br from-violet-950/60 via-background to-indigo-950/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_hsl(259_94%_61%_/_0.18),_transparent_60%)]" />
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-md w-full">
          <div className="text-6xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            Pulse
          </div>
          <p className="text-muted-foreground/60 text-sm mb-8 font-medium">
            AI-powered social platform
          </p>
          <h2 className="text-3xl font-bold text-foreground mb-3 leading-tight">
            Share moments.
            <br />
            Build connections.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-10">
            A place where real conversations happen. Follow people you care
            about, share what matters, and let AI supercharge your content.
          </p>
          <div className="flex flex-col gap-3.5">
            {FEATURES.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 lg:max-w-[440px] flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <span className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Pulse
            </span>
          </div>

          <div className="flex bg-muted rounded-xl p-1 mb-6">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setError("");
                  setSuccess("");
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                  tab === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`button-tab-${t}`}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <button
            onClick={onGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-accent text-foreground text-sm font-semibold transition-all disabled:opacity-50 mb-5"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-border border-t-foreground rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">
              or
            </span>
            <div className="flex-1 h-px bg-border" />
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
                  <label className="text-sm font-medium text-foreground/80 mb-1.5 block">
                    Email
                  </label>
                  <input
                    {...loginForm.register("email")}
                    type="email"
                    placeholder="you@example.com"
                    className={inputCls}
                    data-testid="input-login-email"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-destructive text-xs mt-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-1.5 block">
                    Password
                  </label>
                  <input
                    {...loginForm.register("password")}
                    type="password"
                    placeholder="••••••••"
                    className={inputCls}
                    data-testid="input-login-password"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-destructive text-xs mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                {error && (
                  <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl px-4 py-3">
                    {success}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loginForm.formState.isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm"
                  data-testid="button-login-submit"
                >
                  {loginForm.formState.isSubmitting ? "Signing in…" : "Sign In"}
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
                    <label className="text-sm font-medium text-foreground/80 mb-1.5 block">
                      Username
                    </label>
                    <input
                      {...signupForm.register("username")}
                      placeholder="yourname"
                      className={inputCls}
                      data-testid="input-signup-username"
                    />
                    {signupForm.formState.errors.username && (
                      <p className="text-destructive text-xs mt-1">
                        {signupForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground/80 mb-1.5 block">
                      Display Name
                    </label>
                    <input
                      {...signupForm.register("displayName")}
                      placeholder="Your Name"
                      className={inputCls}
                      data-testid="input-signup-displayname"
                    />
                    {signupForm.formState.errors.displayName && (
                      <p className="text-destructive text-xs mt-1">
                        {signupForm.formState.errors.displayName.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-1.5 block">
                    Email
                  </label>
                  <input
                    {...signupForm.register("email")}
                    type="email"
                    placeholder="you@example.com"
                    className={inputCls}
                    data-testid="input-signup-email"
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-destructive text-xs mt-1">
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-1.5 block">
                    Password
                  </label>
                  <input
                    {...signupForm.register("password")}
                    type="password"
                    placeholder="At least 6 characters"
                    className={inputCls}
                    data-testid="input-signup-password"
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-destructive text-xs mt-1">
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                {error && (
                  <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={signupForm.formState.isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm"
                  data-testid="button-signup-submit"
                >
                  {signupForm.formState.isSubmitting
                    ? "Creating account…"
                    : "Create Account"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-[11px] text-muted-foreground/60 text-center mt-6 leading-relaxed">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
