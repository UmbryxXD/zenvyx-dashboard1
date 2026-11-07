import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { manageableGuilds } from "@/lib/access";
import { env } from "@/lib/env";
import { avatarUrl, number } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getSnapshots, StoreError, type Snapshot } from "@/lib/store";

export const dynamic = "force-dynamic";

const guildIcon = (g: { id: string; icon: string | null }) =>
  g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128` : null;

const Initial = ({ name }: { name: string }) => (
  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-700 font-display text-lg text-zen-300">{name.slice(0, 1)}</span>
);

export default async function Servers() {
  const session = await getSession();
  if (!session) redirect("/");

  const { guilds: candidates, error: discordError } = await manageableGuilds(session);
  let problem: string | null = discordError;
  let withBot = new Map<string, Snapshot>();
  try {
    withBot = new Map((await getSnapshots(candidates.map((g) => g.id))).map((s) => [s.guild_id, s]));
  } catch (e) {
    problem = e instanceof StoreError ? e.message : "Could not load servers.";
  }

  const clientId = env("DISCORD_CLIENT_ID");
  const invite = (id: string) =>
    `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands&guild_id=${id}&disable_guild_select=true`;
  const ready = candidates.filter((g) => withBot.has(g.id));
  const missing = candidates.filter((g) => !withBot.has(g.id));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl(session.id, session.avatar)} alt="" className="h-8 w-8 rounded-full" />
          <span className="hidden text-sm text-zinc-300 sm:block">{session.name}</span>
          <form action="/api/auth/logout" method="post"><button className="btn-ghost !py-1.5">Log out</button></form>
        </div>
      </header>

      <h1 className="rise mt-10 font-display text-2xl font-semibold text-white">Select a server</h1>
      <p className="mt-1 text-sm text-zinc-400">Only servers where you have Administrator or Manage Server are shown.</p>

      {problem && (
        <p role="alert" className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{problem}</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ready.map((g, i) => {
          const m = withBot.get(g.id)!.data.guild;
          const icon = guildIcon(m);
          return (
            <a key={g.id} href={`/dashboard/${g.id}`} style={{ animationDelay: `${i * 40}ms` }}
               className="glass rise group flex items-center gap-4 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-zen-400/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {icon ? <img src={icon} alt="" className="h-12 w-12 rounded-2xl" /> : <Initial name={m.name} />}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-white">{m.name}</span>
                <span className="text-xs text-zinc-500">{number(m.member_count)} members</span>
              </span>
              <span className="text-sm text-zen-400 transition group-hover:translate-x-0.5">Open →</span>
            </a>
          );
        })}
        {missing.map((g) => {
          const icon = guildIcon(g);
          return (
            <div key={g.id} className="glass flex items-center gap-4 p-4 opacity-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {icon ? <img src={icon} alt="" className="h-12 w-12 rounded-2xl grayscale" /> : <Initial name={g.name} />}
              <span className="min-w-0 flex-1 truncate font-medium text-zinc-300">{g.name}</span>
              <a href={invite(g.id)} className="btn-ghost !px-3 !py-1.5 text-xs">Add bot</a>
            </div>
          );
        })}
      </div>

      {!problem && candidates.length === 0 && (
        <p className="mt-10 text-center text-sm text-zinc-500">You don&apos;t manage any servers yet.</p>
      )}
    </main>
  );
}
