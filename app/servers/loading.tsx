export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-10 w-48" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-24" style={{ animationDelay: `${i * 80}ms` }} />)}
      </div>
    </main>
  );
}
