export function SkeletonPost() {
  return (
    <div className="border-b border-border px-4 py-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2 items-center">
            <div className="h-3.5 w-24 bg-muted rounded-full" />
            <div className="h-3 w-16 bg-muted/60 rounded-full" />
          </div>
          <div className="h-3.5 w-full bg-muted rounded-full" />
          <div className="h-3.5 w-4/5 bg-muted rounded-full" />
          <div className="h-3.5 w-3/5 bg-muted/60 rounded-full" />
          <div className="flex gap-5 pt-1">
            <div className="h-3 w-10 bg-muted/60 rounded-full" />
            <div className="h-3 w-10 bg-muted/60 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="animate-pulse">
      <div className="h-24 bg-muted/30" />
      <div className="px-4 pb-4">
        <div className="flex justify-between items-end -mt-10 mb-4">
          <div className="w-16 h-16 rounded-full bg-muted border-4 border-background" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-36 bg-muted rounded-full" />
          <div className="h-3.5 w-24 bg-muted/60 rounded-full" />
          <div className="h-3.5 w-full bg-muted/60 rounded-full mt-2" />
          <div className="h-3.5 w-3/5 bg-muted/60 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonUser() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-32 bg-muted rounded-full" />
        <div className="h-3 w-20 bg-muted/60 rounded-full" />
      </div>
    </div>
  );
}
