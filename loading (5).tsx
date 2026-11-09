export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-28" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-28" style={{ animationDelay: `${i * 80}ms` }} />)}
      </div>
      <div className="skeleton h-24" />
    </div>
  );
}
