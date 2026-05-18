import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Camera } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import {
  useUpdateMyProfile,
  getGetUserProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  display_name: z.string().min(1, "Required").max(50),
  bio: z.string().max(160, "Max 160 characters").optional(),
  avatar_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

type SettingsData = z.infer<typeof settingsSchema>;

const inputCls =
  "w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const username =
    user?.user_metadata?.username || user?.email?.split("@")[0] || "me";
  const headers = user ? { "x-user-id": user.id } : undefined;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      display_name: user?.user_metadata?.display_name || username,
      bio: "",
      avatar_url: "",
      website: "",
    },
  });

  const watchedAvatarUrl = watch("avatar_url");
  const displayPreviewUrl = watchedAvatarUrl || avatarPreview || undefined;

  const updateProfile = useUpdateMyProfile({
    request: { headers },
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: getGetUserProfileQueryKey(username),
        });
        toast({
          title: "Profile updated",
          description: "Your changes have been saved.",
        });
      },
    },
  });

  const onSubmit = (data: SettingsData) => {
    const payload: Record<string, string> = {
      display_name: data.display_name,
    };
    if (data.bio) payload.bio = data.bio;
    if (data.avatar_url) payload.avatar_url = data.avatar_url;
    if (data.website) payload.website = data.website;
    updateProfile.mutate({ data: payload });
  };

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="sticky top-0 z-10 glass border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setLocation(`/profile/${username}`)}
          className="p-1.5 rounded-xl hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold">Edit Profile</span>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <UserAvatar
              username={username}
              displayName={user?.user_metadata?.display_name || username}
              avatarUrl={displayPreviewUrl}
              size="xl"
            />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <Camera className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          </div>
          <div>
            <p className="font-bold text-lg">
              {user?.user_metadata?.display_name || username}
            </p>
            <p className="text-sm text-muted-foreground">@{username}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user?.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground/80 mb-1.5 block">
              Display Name
            </label>
            <input
              {...register("display_name")}
              className={inputCls}
              placeholder="Your display name"
            />
            {errors.display_name && (
              <p className="text-destructive text-xs mt-1">
                {errors.display_name.message}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground/80">Bio</label>
              <span className="text-xs text-muted-foreground">
                max 160 chars
              </span>
            </div>
            <textarea
              {...register("bio")}
              rows={3}
              placeholder="Tell people about yourself…"
              className={`${inputCls} resize-none`}
            />
            {errors.bio && (
              <p className="text-destructive text-xs mt-1">
                {errors.bio.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground/80 mb-1.5 block">
              Avatar URL
            </label>
            <input
              {...register("avatar_url")}
              placeholder="https://example.com/avatar.jpg"
              className={inputCls}
            />
            {errors.avatar_url && (
              <p className="text-destructive text-xs mt-1">
                {errors.avatar_url.message}
              </p>
            )}
            {displayPreviewUrl && !errors.avatar_url && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={displayPreviewUrl}
                  alt="Avatar preview"
                  className="w-10 h-10 rounded-full object-cover border border-border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="text-xs text-muted-foreground">Preview</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground/80 mb-1.5 block">
              Website
            </label>
            <input
              {...register("website")}
              placeholder="https://yoursite.com"
              className={inputCls}
            />
            {errors.website && (
              <p className="text-destructive text-xs mt-1">
                {errors.website.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isDirty || isSubmitting || updateProfile.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {updateProfile.isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save changes
          </button>
        </form>

        <div className="pt-4 border-t border-border space-y-1">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide text-xs">
            Account
          </h3>
          <button
            onClick={logout}
            className="w-full text-left px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
          >
            Sign out of your account
          </button>
        </div>
      </div>
    </div>
  );
}
