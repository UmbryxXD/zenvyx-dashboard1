import { redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
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
  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-700 font-display text-xl text-violet-300 ring-1 ring-white/10">{name.slice(0, 1)}</span>
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
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex items-center justify-between">
        <Logo />
        <div className="glass flex items-center gap-3 !rounded-full py-1.5 pl-1.5 pr-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl(session.id, session.avatar)} alt="" className="h-8 w-8 rounded-full ring-1 ring-violet-400/30" />
          <span className="hidden text-sm text-zinc-200 sm:block">{session.name}</span>
          <form action="/api/auth/logout" method="post">
            <button title="Log out" aria-label="Log out" className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-rose-300">
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      <section className="rise mt-14">
        <h1 className="font-display text-4xl font-bold tracking-tight"><span className="text-gradient">Select a server</span></h1>
        <p className="mt-2 text-sm text-zinc-400">Only servers where you have Administrator or Manage Server are shown.</p>
      </section>

      {problem && (
        <p role="alert" className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{problem}</p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ready.map((g, i) => {
          const m = withBot.get(g.id)!.data.guild;
          const icon = guildIcon(m);
          return (
            <a key={g.id} href={`/dashboard/${g.id}`} style={{ animationDelay: `${i * 60}ms` }}
               className="glass spot rise group flex items-center gap-4 p-4 transition duration-300 hover:-translate-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {icon ? <img src={icon} alt="" className="h-14 w-14 rounded-2xl ring-1 ring-white/10 transition duration-300 group-hover:shadow-[0_0_28px_-4px_rgba(139,92,246,.9)]" /> : <Initial name={m.name} />}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-white">{m.name}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                  <Icon name="users" className="h-3.5 w-3.5" />{number(m.member_count)} members
                </span>
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10 text-violet-300 transition duration-300 group-hover:translate-x-1 group-hover:bg-violet-500/25">
                <Icon name="arrow" className="h-4 w-4" />
              </span>
            </a>
          );
        })}
        {missing.map((g, i) => {
          const icon = guildIcon(g);
          return (
            <div key={g.id} style={{ animationDelay: `${(ready.length + i) * 60}ms` }} className="glass rise flex items-center gap-4 p-4 opacity-75 transition hover:opacity-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {icon ? <img src={icon} alt="" className="h-14 w-14 rounded-2xl grayscale" /> : <Initial name={g.name} />}
              <span className="min-w-0 flex-1 truncate font-medium text-zinc-300">{g.name}</span>
              <a href={invite(g.id)} className="btn btn-ghost !px-3 !py-1.5 text-xs">Add bot</a>
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
