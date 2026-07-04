export default function DashboardLoading() {
  return (
    <div className="space-y-8 max-w-6xl animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-9 w-72 bg-zinc-800 rounded-lg" />
        <div className="h-5 w-56 bg-zinc-800/60 rounded-lg" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-zinc-800 rounded-xl p-5 border border-zinc-700 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-zinc-700 rounded" />
              <div className="h-8 w-12 bg-zinc-700 rounded" />
            </div>
            <div className="w-12 h-12 bg-zinc-700 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Activity skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-36 bg-zinc-800 rounded-lg" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 bg-zinc-800 rounded-xl p-4 border border-zinc-700">
            <div className="w-8 h-8 bg-zinc-700 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-700 rounded w-3/4" />
              <div className="h-3 bg-zinc-700/60 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
