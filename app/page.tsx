import { redirect } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { getSession } from "@/lib/session";

const ERRORS: Record<string, string> = {
  cancelled: "Login was cancelled.",
  state: "Your login session expired. Please try again.",
  discord: "Discord refused the login. Check the client ID/secret and redirect URL.",
  server: "Something went wrong while signing you in.",
};

const FEATURES: { icon: IconName; label: string }[] = [
  { icon: "activity", label: "Live stats" },
  { icon: "sliders", label: "Server settings" },
  { icon: "shield", label: "Moderation" },
  { icon: "sparkles", label: "AI & more" },
];

export default async function Home({ searchParams }: { searchParams: { error?: string } }) {
  if (await getSession()) redirect("/servers");
  const error = searchParams.error ? ERRORS[searchParams.error] || ERRORS.server : null;

  return (
    <>
    <div className="hero-bg fx" aria-hidden="true" />
    <main className="relative mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="relative mb-8 flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52">
        <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,.45),transparent_65%)]" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Zenvyx" width={208} height={208} className="float relative h-full w-full object-contain" />
      </div>

      <h1 className="rise font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
        <span className="text-gradient">Command your server.</span>
        <br /><span className="text-white">No commands needed.</span>
      </h1>
      <p className="rise mx-auto mt-5 max-w-md text-base leading-relaxed text-zinc-400" style={{ animationDelay: "80ms" }}>
        Sign in with Discord to manage Zenvyx visually: settings, roles and live stats in one beautiful place.
      </p>

      <div className="glass glow-border rise mt-9 w-full max-w-sm p-6" style={{ animationDelay: "160ms" }}>
        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
        )}
        <a href="/api/auth/login" className="btn btn-primary w-full !py-3.5 text-base">
          Continue with Discord <Icon name="arrow" className="h-4 w-4" />
        </a>
        <p className="mt-3 text-xs text-zinc-500">We only read your name, avatar and server list.</p>
      </div>

      <ul className="rise mt-8 flex flex-wrap justify-center gap-2" style={{ animationDelay: "240ms" }}>
        {FEATURES.map((f) => (
          <li key={f.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm text-zinc-300">
            <Icon name={f.icon} className="h-4 w-4 text-violet-300" /> {f.label}
          </li>
        ))}
      </ul>
    </main>
    </>
  );
}
