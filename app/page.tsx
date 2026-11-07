import { redirect } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { Logo } from "@/components/Logo";
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
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="relative mb-10 flex h-40 w-40 items-center justify-center">
        <span className="orbit inset-0" />
        <span className="orbit inset-5" style={{ animationDuration: "11s", animationDirection: "reverse" }} />
        <span className="orbit inset-10" style={{ animationDuration: "7s" }} />
        <div className="float relative"><Logo size={56} /></div>
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
  );
}
