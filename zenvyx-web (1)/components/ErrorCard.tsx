export function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="glass mx-auto mt-10 max-w-lg p-8 text-center">
      <h1 className="font-display text-xl font-semibold text-white">{title}</h1>
      <p className="mt-2 text-sm text-zinc-400">{message}</p>
      <a href="/servers" className="btn-ghost mt-6">Back to servers</a>
    </div>
  );
}
