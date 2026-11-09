import Link from "next/link";
import { Icon } from "./Icon";

export function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="glass rise mx-auto mt-16 max-w-lg p-9 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/25">
        <Icon name="lock" />
      </span>
      <h1 className="font-display text-xl font-semibold text-white">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{message}</p>
      <Link href="/servers" className="btn btn-ghost mt-6">Back to servers</Link>
    </div>
  );
}
