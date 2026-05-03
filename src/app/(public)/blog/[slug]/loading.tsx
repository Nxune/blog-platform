export default function PostLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 h-64 w-full animate-pulse rounded-lg bg-muted sm:h-80" />
      <div className="mb-4 h-10 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mb-8 flex gap-4">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`h-4 animate-pulse rounded bg-muted ${
              i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-5/6" : "w-11/12"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
