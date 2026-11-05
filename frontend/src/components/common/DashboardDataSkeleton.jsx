export function DashboardDataSkeleton({ metricCount = 4, showList = true }) {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: metricCount }, (_, index) => (
          <div
            className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5"
            key={index}
          >
            <div className="h-4 w-24 rounded bg-slate-800" />
            <div className="mt-3 h-9 w-16 rounded bg-slate-800" />
          </div>
        ))}
      </div>
      {showList ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <div className="h-5 w-40 rounded bg-slate-800" />
          <div className="mt-5 space-y-3">
            <div className="h-14 rounded-xl bg-slate-800/80" />
            <div className="h-14 rounded-xl bg-slate-800/80" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
