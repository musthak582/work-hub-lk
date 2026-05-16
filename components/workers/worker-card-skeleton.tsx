export function WorkerCardSkeleton() {
  return (
    <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full skeleton" />
          <div className="space-y-2">
            <div className="h-3.5 w-28 rounded skeleton" />
            <div className="h-3   w-36 rounded skeleton" />
          </div>
        </div>
        <div className="h-5 w-16 rounded-full skeleton" />
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-20 rounded-full skeleton" />
        <div className="h-5 w-24 rounded-full skeleton" />
      </div>

      {/* Description */}
      <div className="space-y-1.5 mb-3">
        <div className="h-3 w-full rounded skeleton" />
        <div className="h-3 w-3/4  rounded skeleton" />
      </div>

      {/* Portfolio */}
      <div className="flex gap-1.5 mb-3">
        {[1,2,3].map((i) => (
          <div key={i} className="w-16 h-12 rounded-md skeleton" />
        ))}
      </div>

      {/* Bottom */}
      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <div className="h-3.5 w-24 rounded skeleton" />
        <div className="h-4   w-28 rounded skeleton" />
      </div>
    </div>
  );
}

export function WorkerGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <WorkerCardSkeleton key={i} />
      ))}
    </div>
  );
}