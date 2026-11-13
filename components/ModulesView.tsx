"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, type IconName } from "./Icon";
import { Tabs, useJob } from "./ui";
import type { ModuleInfo } from "@/lib/store";

type Filter = "all" | "on" | "off";
const CATEGORIES = ["Security", "Community", "Entertainment", "Utility"];
const CATEGORY_HINT: Record<string, string> = {
  Security: "Protect your server and keep order.",
  Community: "Welcome, organise and grow your members.",
  Entertainment: "Music, games and AI for your community.",
  Utility: "Everyday tools.",
};
// modules that have a full dashboard page
const PAGE: Record<string, string> = { tickets: "tickets", staffapps: "applications", appeals: "appeals", moderation: "moderation", ai: "ai", music: "music", blox: "blox", welcome: "welcome", embed: "embeds" };
const RISKY = new Set(["moderation", "automod", "antinuke"]);

export function ModulesView({ guildId, prefix, catalog }: { guildId: string; prefix: string; catalog: ModuleInfo[] }) {
  const base = `/dashboard/${guildId}`;
  const { pending, result, run } = useJob(guildId);
  const [state, setState] = useState<Record<string, boolean>>(() => Object.fromEntries(catalog.map((m) => [m.id, m.enabled])));
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const on = catalog.filter((m) => state[m.id]).length;
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => catalog.filter((m) => (filter === "all" || (filter === "on") === !!state[m.id]) && (!q || `${m.name} ${m.description} ${m.example}`.toLowerCase().includes(q))),
    [catalog, filter, q, state],
  );

  const flip = async (m: ModuleInfo) => {
    const next = !state[m.id];
    if (!next && RISKY.has(m.id) && !window.confirm(`Turn off ${m.name}? Its commands and automatic features stop working in this server until you turn it back on.`)) return;
    setBusy(m.id);
    setState((s) => ({ ...s, [m.id]: next })); // show it immediately, undo if the bot refuses
    const r = await run("modules.toggle", { module: m.id, enabled: next });
    if (!r.ok) setState((s) => ({ ...s, [m.id]: !next }));
    setBusy(null);
  };

  if (catalog.length === 0) {
    return <div className="glass p-6 text-sm text-zinc-300">The bot hasn&apos;t published its module list yet. Restart it with the latest <code>zenvyx_sync</code> folder, then refresh in a minute.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="glass p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-semibold text-white">{on} <span className="text-base font-normal text-zinc-400">of {catalog.length} modules on</span></p>
            <p className="mt-0.5 text-sm text-zinc-400">Turn off anything you don&apos;t use. A module that&apos;s off stops answering commands and running automatically in this server.</p>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500" style={{ width: `${(on / catalog.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search modules or commands" aria-label="Search modules"
                 className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition focus:border-violet-400/60" />
        </label>
        <Tabs<Filter> value={filter} onChange={setFilter} tabs={[{ id: "all", label: `All ${catalog.length}` }, { id: "on", label: `On ${on}` }, { id: "off", label: `Off ${catalog.length - on}` }]} />
      </div>

      <p aria-live="polite" className={`min-h-[1.25rem] text-sm ${result ? (result.ok ? "text-emerald-300" : "text-rose-300") : "text-zinc-500"}`}>
        {pending ? "Waiting for the bot…" : result ? result.message : "Changes apply within a few seconds."}
      </p>

      {visible.length === 0 && <p className="py-10 text-center text-sm text-zinc-500">No modules match.</p>}
      {CATEGORIES.map((cat) => {
        const items = visible.filter((m) => m.category === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat} aria-label={cat}>
            <div className="mb-3">
              <h2 className="font-display text-lg font-semibold text-white">{cat}</h2>
              <p className="text-sm text-zinc-500">{CATEGORY_HINT[cat]}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((m) => {
                const enabled = !!state[m.id];
                const page = PAGE[m.id];
                return (
                  <div key={m.id} className={`glass flex flex-col p-4 transition-colors sm:p-5 ${enabled ? "" : "opacity-70"}`}>
                    <div className="flex items-start gap-3">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${enabled ? "bg-violet-500/15 text-violet-300 ring-violet-400/25" : "bg-white/[0.04] text-zinc-500 ring-white/10"}`}>
                        <Icon name={ICON_OK.has(m.icon) ? (m.icon as IconName) : "puzzle"} className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-base font-semibold text-white">{m.name}</h3>
                        <p className="mt-0.5 text-sm leading-snug text-zinc-400">{m.description}</p>
                      </div>
                      <button type="button" role="switch" aria-checked={enabled} aria-label={`${m.name} on or off`} disabled={pending} onClick={() => flip(m)}
                              className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-60 ${enabled ? "border-violet-400/50 bg-violet-600" : "border-white/10 bg-white/10"}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? "left-6" : "left-0.5"}`} />
                        {busy === m.id && <span className="sr-only">Saving</span>}
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/[0.06] pt-3 text-xs text-zinc-500">
                      <span>{m.commands} command{m.commands === 1 ? "" : "s"}</span>
                      <span className="rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-zinc-400">{prefix}{m.example}</span>
                      {m.owner_only && <span className="inline-flex items-center gap-1 text-amber-300/80"><Icon name="lock" className="h-3 w-3" /> owner only</span>}
                      {page && <Link href={`${base}/${page}`} className="btn btn-ghost ml-auto !px-3 !py-1.5 text-sm"><Icon name="sliders" className="h-4 w-4" /> Configure</Link>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const ICON_OK = new Set<string>(["grid", "sliders", "shield", "sparkles", "music", "gem", "flag", "scroll", "users", "hash", "tag", "zap", "clock", "activity", "terminal", "server", "lock", "send", "edit", "ticket", "clipboard", "scale", "puzzle"]);
