export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3 animate-pulse" aria-busy="true">
      {Array.from({ length: rows }, (_, index) => (
        <div
          className="h-16 rounded-xl border border-slate-800 bg-slate-950/50"
          key={index}
        />
      ))}
    </div>
  );
}
