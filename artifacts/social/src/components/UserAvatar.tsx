import { getInitials, getAvatarColor, cn } from "@/lib/utils";

interface UserAvatarProps {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};

export function UserAvatar({ username, displayName, avatarUrl, size = "md", className }: UserAvatarProps) {
  const colorClass = getAvatarColor(username);
  const sizeClass = sizes[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className={cn("rounded-full object-cover", sizeClass, className)}
        data-testid="img-avatar"
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-br shrink-0",
        colorClass,
        sizeClass,
        className
      )}
      data-testid="div-avatar-initials"
    >
      {getInitials(displayName || username)}
    </div>
  );
}
