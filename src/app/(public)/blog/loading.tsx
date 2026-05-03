export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 h-9 w-32 animate-pulse rounded bg-muted" />
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6">
            <div className="mb-4 h-48 w-full animate-pulse rounded-lg bg-muted" />
            <div className="space-y-3">
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
