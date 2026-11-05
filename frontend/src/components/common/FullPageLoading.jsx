import { LoadingSpinner } from "./LoadingSpinner";

export function FullPageLoading({ label = "Memuat data..." }) {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100"
      aria-busy="true"
      aria-label={label}
    >
      <div className="text-center">
        <img
          className="mx-auto h-20 w-20 animate-pulse rounded-full object-cover"
          src="/logo-round.svg"
          alt=""
          aria-hidden="true"
        />
        <LoadingSpinner
          className="mt-6 text-sm text-slate-300"
          label={label}
          size="sm"
        />
      </div>
    </main>
  );
}
