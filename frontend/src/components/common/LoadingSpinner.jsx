const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
};

export function LoadingSpinner({
  label = "Memuat...",
  size = "md",
  className = "",
}) {
  return (
    <span
      className={`inline-flex items-center gap-3 ${className}`}
      role="status"
      aria-label={label}
    >
      <span
        className={`animate-spin rounded-full border-slate-600 border-t-amber-300 ${sizes[size] ?? sizes.md}`}
        aria-hidden="true"
      />
      {label ? <span>{label}</span> : null}
    </span>
  );
}
