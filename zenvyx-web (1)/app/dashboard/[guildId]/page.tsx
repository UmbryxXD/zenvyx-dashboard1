import { redirect } from "next/navigation";
import { ErrorCard } from "@/components/ErrorCard";
import { manageableGuilds } from "@/lib/access";
import { ago, number, uptime } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getSnapshots, StoreError } from "@/lib/store";

export const dynamic = "force-dynamic";
const OFFLINE_AFTER_SECONDS = 180;

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="glass p-5">
    <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
    <p className="mt-2 font-display text-2xl font-semibold text-white">{value}</p>
    {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
  </div>
);

export default async function Page({ params }: { params: { guildId: string } }) {
  const session = await getSession();
  if (!session) redirect("/");
  if (!/^\d{5,25}$/.test(params.guildId)) redirect("/servers");

  // Permission check, on the server, against Discord's own data.
  const { guilds, error } = await manageableGuilds(session);
  if (error) return <ErrorCard title="Couldn't verify access" message={error} />;
  if (!guilds.some((g) => g.id === params.guildId)) {
    return <ErrorCard title="No access" message="You need Administrator or Manage Server in that server." />;
  }

  let snap;
  try {
    [snap] = await getSnapshots([params.guildId]);
  } catch (e) {
    return <ErrorCard title="Couldn't load server" message={e instanceof StoreError ? e.message : "Could not load this server."} />;
  }
  if (!snap) {
    return <ErrorCard title="Waiting for Zenvyx" message="The bot hasn't reported this server yet. Make sure it's added and online, then refresh in a minute." />;
  }

  const { guild, bot: b, prefix, modules } = snap.data;
  const age = Math.max(0, (Date.now() - Date.parse(snap.updated_at)) / 1000);
  const online = age < OFFLINE_AFTER_SECONDS;

  return (
    <div className="rise space-y-8">
      <header className="flex flex-wrap items-center gap-4">
        {guild.icon && /* eslint-disable-next-line @next/next/no-img-element */ <img src={guild.icon} alt="" className="h-14 w-14 rounded-2xl" />}
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold text-white">{guild.name}</h1>
          <p className="text-sm text-zinc-400">Server overview{prefix ? <> · prefix <code className="rounded bg-white/10 px-1.5 py-0.5 text-zen-300">{prefix}</code></> : null}</p>
        </div>
        <span className={`ml-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${online ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300" : "border-rose-400/20 bg-rose-500/10 text-rose-300"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${online ? "animate-pulse bg-emerald-400" : "bg-rose-400"}`} />
          {online ? "Bot online" : "Bot offline"} · synced {ago(age)}
        </span>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Server stats">
        <Stat label="Members" value={number(guild.member_count)} />
        <Stat label="Channels" value={number(guild.text_channels + guild.voice_channels)} hint={`${guild.text_channels} text · ${guild.voice_channels} voice`} />
        <Stat label="Roles" value={number(guild.roles)} />
        <Stat label="Boosts" value={number(guild.boosts)} />
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Bot status">
        <Stat label="Uptime" value={online ? uptime(Math.max(0, Math.floor(Date.now() / 1000) - b.started_at)) : "—"} />
        <Stat label="Latency" value={online && b.latency_ms !== null ? `${b.latency_ms} ms` : "—"} />
        <Stat label="Commands" value={number(b.command_count)} />
        <Stat label="Servers" value={number(b.guild_count)} hint="where Zenvyx is added" />
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-white">Loaded modules <span className="text-sm font-normal text-zinc-500">({b.module_count})</span></h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {modules.map((m) => (
            <span key={m.name} className="glass px-3 py-1.5 text-sm text-zinc-300">
              {m.name} <span className="text-zinc-500">· {m.commands}</span>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
