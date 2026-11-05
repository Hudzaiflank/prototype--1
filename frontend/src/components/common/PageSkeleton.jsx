export function PageSkeleton() {
  return (
    <main
      className="min-h-screen bg-slate-900 px-4 py-8 md:px-8"
      aria-busy="true"
      aria-label="Memuat halaman"
    >
      <p className="sr-only" role="status">
        Memuat halaman...
      </p>
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-4 w-32 rounded bg-slate-800" />
        <div className="h-10 w-72 rounded bg-slate-800" />
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <div className="mb-5 h-4 w-48 rounded bg-slate-800" />
          <div className="space-y-3">
            <div className="h-12 rounded-lg bg-slate-800/80" />
            <div className="h-12 rounded-lg bg-slate-800/80" />
            <div className="h-12 rounded-lg bg-slate-800/80" />
          </div>
        </div>
      </div>
    </main>
  );
}
