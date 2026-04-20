const shimmer = "bg-gradient-to-r from-[var(--color-border)] via-[var(--color-canvas)] to-[var(--color-border)] bg-[length:200%_100%] animate-shimmer";

export function Skeleton({ className = "", variant = "text", ...props }) {
  const baseClasses = "rounded-md bg-[var(--color-border)] opacity-30";
  
  const variants = {
    text: "h-4 w-full",
    title: "h-6 w-3/4",
    avatar: "h-10 w-10 rounded-full",
    card: "h-32 w-full",
    button: "h-10 w-24 rounded-lg",
    badge: "h-6 w-16 rounded-full",
    image: "h-40 w-full rounded-lg",
    tableRow: "h-12 w-full",
    chip: "h-8 w-20 rounded-full",
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${shimmer} ${className}`} {...props} />
  );
}

export function SkeletonCard() {
  return (
      <div className="bg-[var(--color-canvas)] rounded-xl p-4 shadow-sm border border-[var(--color-border)]">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton variant="avatar" />
        <div className="flex-1">
          <Skeleton variant="title" className="mb-2" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <Skeleton variant="text" className="mb-2" />
      <Skeleton variant="text" className="w-3/4 mb-4" />
      <div className="flex gap-2">
        <Skeleton variant="chip" />
        <Skeleton variant="chip" />
      </div>
    </div>
  );
}

export function SkeletonJobCard() {
  return (
      <div className="bg-[var(--color-canvas)] rounded-xl p-5 shadow-sm border border-[var(--color-border)]">
      <div className="flex items-start gap-4">
        <Skeleton variant="avatar" className="h-12 w-12" />
        <div className="flex-1">
          <Skeleton variant="title" />
          <Skeleton variant="text" className="w-1/3 mt-2" />
          <div className="flex gap-2 mt-3">
            <Skeleton variant="badge" />
            <Skeleton variant="badge" />
            <Skeleton variant="badge" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
        <Skeleton variant="button" />
        <Skeleton variant="button" className="w-20" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 p-3 bg-[var(--color-canvas)] rounded-t-lg">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="text" className="flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 border-b border-[var(--color-border)]">
          {[1, 2, 3, 4].map((j) => (
            <Skeleton key={j} variant="text" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonConversation() {
  return (
    <div className="flex items-center gap-3 p-3 border-b border-[var(--color-border)]">
      <Skeleton variant="avatar" />
      <div className="flex-1">
        <Skeleton variant="text" className="w-1/3 mb-2" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonMessage() {
  return (
    <div className="flex gap-3 mb-4">
      <Skeleton variant="avatar" className="h-8 w-8" />
      <div className="flex-1">
        <Skeleton variant="text" className="w-1/2 mb-2" />
        <Skeleton variant="card" className="h-auto py-3" />
      </div>
    </div>
  );
}

export function SkeletonAnalytics() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[var(--color-canvas)] rounded-xl p-4 shadow-sm border border-[var(--color-border)]">
            <Skeleton variant="text" className="w-1/2 mb-2" />
            <Skeleton variant="title" />
          </div>
        ))}
      </div>
      <Skeleton variant="card" className="h-64" />
    </div>
  );
}