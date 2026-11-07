import { redirect } from "next/navigation";
import { CountUp } from "@/components/CountUp";
import { ErrorCard } from "@/components/ErrorCard";
import { Icon, type IconName } from "@/components/Icon";
import { manageableGuilds } from "@/lib/access";
import { ago, uptime } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getSnapshots, StoreError } from "@/lib/store";

export const dynamic = "force-dynamic";
const OFFLINE_AFTER_SECONDS = 180;

function Stat({ label, icon, value, text, hint, delay }: { label: string; icon: IconName; value?: number; text?: string; hint?: string; delay: number }) {
  return (
    <div className="glass spot rise group p-5 transition duration-300 hover:-translate-y-0.5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20 transition duration-300 group-hover:bg-violet-500/20 group-hover:shadow-[0_0_20px_-2px_rgba(139,92,246,.8)]">
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">
        {value !== undefined ? <CountUp value={value} /> : text}
      </p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function Ring({ ms }: { ms: number }) {
  const pct = Math.max(0.06, Math.min(1, 1 - ms / 400));
  const c = 2 * Math.PI * 15;
  return (
    <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90" aria-hidden="true">
      <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
      <circle cx="18" cy="18" r="15" fill="none" stroke="url(#lg)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c4b5fd" /><stop offset="1" stopColor="#7c3aed" /></linearGradient></defs>
    </svg>
  );
}

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
  const maxCommands = Math.max(1, ...modules.map((m) => m.commands));

  return (
    <div className="space-y-8">
      <header className="glass rise relative flex flex-wrap items-center gap-5 overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-violet-600/25 blur-3xl" />
        {guild.icon
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={guild.icon} alt="" className="relative h-20 w-20 rounded-3xl shadow-[0_0_40px_-6px_rgba(139,92,246,.8)] ring-1 ring-white/15" />
          : <span className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-ink-700 font-display text-3xl text-violet-300 ring-1 ring-white/10">{guild.name.slice(0, 1)}</span>}
        <div className="relative min-w-0 flex-1">
          <h1 className="truncate font-display text-3xl font-bold tracking-tight text-white">{guild.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${online ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300" : "border-rose-400/25 bg-rose-500/10 text-rose-300"}`}>
              <span className="relative flex h-2 w-2">
                {online && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-rose-400"}`} />
              </span>
              {online ? "Bot online" : "Bot offline"} · synced {ago(age)}
            </span>
            {prefix && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                prefix <code className="ml-1 rounded bg-violet-500/20 px-1.5 py-0.5 font-mono text-violet-200">{prefix}</code>
              </span>
            )}
          </div>
        </div>
        <a href={`/dashboard/${params.guildId}/settings`} className="btn btn-primary relative">
          <Icon name="sliders" className="h-4 w-4" /> Server settings
        </a>
      </header>

      <section aria-label="Server stats">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Server</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Members" icon="users" value={guild.member_count} delay={60} />
          <Stat label="Channels" icon="hash" value={guild.text_channels + guild.voice_channels} hint={`${guild.text_channels} text · ${guild.voice_channels} voice`} delay={120} />
          <Stat label="Roles" icon="tag" value={guild.roles} delay={180} />
          <Stat label="Boosts" icon="zap" value={guild.boosts} delay={240} />
        </div>
      </section>

      <section aria-label="Bot status">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Zenvyx</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Uptime" icon="clock" text={online ? uptime(Math.max(0, Math.floor(Date.now() / 1000) - b.started_at)) : "—"} delay={300} />
          <div className="glass spot rise group flex items-center justify-between p-5" style={{ animationDelay: "360ms" }}>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">Latency</p>
              <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">{online && b.latency_ms !== null ? `${b.latency_ms} ms` : "—"}</p>
            </div>
            {online && b.latency_ms !== null && <Ring ms={b.latency_ms} />}
          </div>
          <Stat label="Commands" icon="terminal" value={b.command_count} delay={420} />
          <Stat label="Servers" icon="server" value={b.guild_count} hint="where Zenvyx is added" delay={480} />
        </div>
      </section>

      <section aria-label="Modules">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
          Loaded modules <span className="ml-1 text-zinc-600">{b.module_count}</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => (
            <div key={m.name} className="glass spot rise p-4" style={{ animationDelay: `${Math.min(i, 14) * 35 + 500}ms` }}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2.5 text-sm text-zinc-200">
                  <Icon name="puzzle" className="h-4 w-4 shrink-0 text-violet-300" />
                  <span className="truncate">{m.name}</span>
                </span>
                <span className="shrink-0 text-xs text-zinc-500">{m.commands} cmd</span>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400" style={{ width: `${Math.max(6, (m.commands / maxCommands) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
