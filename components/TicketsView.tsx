"use client";

import { useState } from "react";
import { TEMPLATES } from "@/lib/templates";
import type { Channel, Role, TicketsData } from "@/lib/store";
import { Icon } from "./Icon";
import { Badge, ChannelSelect, Empty, RoleChips, SaveBar, Section, Stat, Tabs, Toggle, sameList, useJob } from "./ui";

type Tab = "analytics" | "panels" | "settings" | "tickets";
const day = (iso: string) => String(iso).slice(0, 10);

function Chart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      <div className="flex h-44 items-end gap-1.5" role="img" aria-label="Tickets opened per day, last 14 days">
        {data.map((d, i) => (
          <div key={d.date} className="group relative flex h-full flex-1 items-end" title={`${d.date}: ${d.count}`}>
            <div className="grow w-full rounded-t-md bg-gradient-to-t from-violet-700 to-fuchsia-400 transition group-hover:brightness-125"
                 style={{ height: `${Math.max(d.count ? 6 : 2, (d.count / max) * 100)}%`, opacity: d.count ? 1 : 0.25, animationDelay: `${i * 40}ms` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 text-[10px] text-zinc-500">
        {data.map((d, i) => <span key={d.date} className="flex-1 text-center">{i % 2 === 0 ? d.date.slice(5) : ""}</span>)}
      </div>
    </div>
  );
}

export function TicketsView({ guildId, data, channels, roles }: { guildId: string; data: TicketsData; channels: Channel[]; roles: Role[] }) {
  const [tab, setTab] = useState<Tab>("analytics");
  const { pending, result, run, setResult } = useJob(guildId);
  const del = useJob(guildId);
  const [confirm, setConfirm] = useState<string | null>(null);

  const [base, setBase] = useState(data.config), [baseStaff, setBaseStaff] = useState(data.staff_roles);
  const [cfg, setCfg] = useState(data.config), [staff, setStaff] = useState(data.staff_roles);
  const dirty = JSON.stringify(cfg) !== JSON.stringify(base) || !sameList(staff, baseStaff);
  const toggleStaff = (id: string) => setStaff((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const save = async () => {
    const r = await run("tickets.config.save", { enabled: cfg.enabled, category_id: cfg.category_id, log_channel_id: cfg.log_channel_id, transcript_channel_id: cfg.transcript_channel_id, staff_roles: staff });
    if (r.ok) { setBase(cfg); setBaseStaff(staff); }
  };

  const checks = [
    { ok: !!cfg.category_id, label: "Ticket category", hint: "New tickets are created inside it." },
    { ok: staff.length > 0, label: "Staff roles", hint: "Who can see and handle tickets." },
    { ok: !!cfg.log_channel_id, label: "Log channel", hint: "Optional, but recommended." },
    { ok: data.panels.some((p) => p.status === "published"), label: "A published panel", hint: "So members can open tickets." },
  ];

  return (
    <div className="space-y-6">
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[
        { id: "analytics", label: "Analytics", icon: "activity" }, { id: "panels", label: `Panels (${data.panels.length})`, icon: "ticket" },
        { id: "settings", label: "Settings", icon: "sliders" }, { id: "tickets", label: "Recent tickets", icon: "scroll" }]} />

      {tab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Total tickets" value={data.stats.total} icon="ticket" />
            <Stat label="Open now" value={data.stats.open} icon="clock" />
            <Stat label="Closed" value={Math.max(0, data.stats.total - data.stats.open)} icon="check" />
            <Stat label="Panels" value={data.panels.length} icon="clipboard" hint={`${data.panels.filter((p) => p.status === "published").length} published`} />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Section icon="activity" title="Tickets opened" hint="Last 14 days">
              {data.stats.total === 0 ? <Empty icon="ticket" title="No tickets yet">Once members open tickets, the chart fills in.</Empty> : <Chart data={data.stats.per_day} />}
            </Section>
            <Section icon="users" title="Busiest staff" hint="Tickets claimed (recent)">
              {data.stats.top_claimers.length === 0 ? <p className="text-sm text-zinc-500">Nobody has claimed a ticket yet.</p> : (
                <ol className="space-y-3">
                  {data.stats.top_claimers.map((c, i) => (
                    <li key={c.name + i} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/15 text-xs text-violet-200">{i + 1}</span>
                      <span className="flex-1 truncate text-sm text-zinc-200">{c.name}</span><Badge tone="violet">{c.count}</Badge>
                    </li>))}
                </ol>)}
            </Section>
          </div>
        </div>
      )}

      {tab === "panels" && (
        <div className="space-y-6">
          <Section icon="plus" title="Create a panel" hint="Start from a template and tweak it. You can change everything.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((t) => (
                <a key={t.id} href={`/dashboard/${guildId}/tickets/panels/new?template=${t.id}`}
                   className="group rounded-xl border border-white/10 bg-white/[0.02] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-violet-400/50 hover:bg-violet-500/10">
                  <p className="text-2xl">{t.emoji}</p><p className="mt-2 font-medium text-white">{t.name}</p><p className="text-xs text-zinc-500">{t.blurb}</p>
                </a>))}
            </div>
          </Section>
          {data.panels.length === 0 ? <div className="glass p-6"><Empty icon="ticket" title="No panels yet">Pick a template above to create your first one.</Empty></div> : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.panels.map((p) => (
                <div key={p.name} className="glass spot rise p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate font-display text-lg font-semibold text-white">{p.name}</p>
                      <p className="mt-0.5 truncate text-sm text-zinc-400">{p.config.title || "No title"}</p></div>
                    <Badge tone={p.status === "published" ? "green" : "amber"}>{p.status}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <Badge>{p.config.type}</Badge><span>{p.config.options.length} button{p.config.options.length === 1 ? "" : "s"}</span><span>· updated {day(p.updated_at)}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <a href={`/dashboard/${guildId}/tickets/panels/${encodeURIComponent(p.name)}`} className="btn btn-primary !px-4 !py-2"><Icon name="edit" className="h-4 w-4" /> Edit</a>
                    <button type="button" onBlur={() => setConfirm(null)} disabled={del.pending}
                            onClick={async () => { if (confirm !== p.name) { setConfirm(p.name); return; } await del.run("tickets.panel.delete", { name: p.name }); setConfirm(null); }}
                            className={`btn !px-3 !py-2 ${confirm === p.name ? "bg-rose-600 text-white" : "btn-ghost !text-rose-300"}`}>
                      <Icon name="trash" className="h-4 w-4" />{confirm === p.name ? "Confirm" : ""}
                    </button>
                  </div>
                </div>))}
            </div>)}
          {del.result && <p className={`text-sm ${del.result.ok ? "text-emerald-300" : "text-rose-300"}`}>{del.result.message}</p>}
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-6">
          <Section icon="check" title="Setup checklist" hint="Tickets work best with all of these in place.">
            <ul className="grid gap-3 sm:grid-cols-2">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full ${c.ok ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-zinc-500"}`}><Icon name={c.ok ? "check" : "x"} className="h-4 w-4" /></span>
                  <div><p className="text-sm font-medium text-zinc-200">{c.label}</p><p className="text-xs text-zinc-500">{c.hint}</p></div>
                </li>))}
            </ul>
          </Section>
          <Section icon="ticket" title="Ticket system">
            <div className="space-y-5">
              <Toggle checked={cfg.enabled} onChange={(v) => setCfg({ ...cfg, enabled: v })} label="Tickets enabled" hint="Turn off to stop members opening new tickets." />
              <div className="grid gap-4 sm:grid-cols-3">
                <ChannelSelect label="Ticket category" kind="category" channels={channels} value={cfg.category_id} onChange={(v) => setCfg({ ...cfg, category_id: v })} />
                <ChannelSelect label="Log channel" kind="text" channels={channels} value={cfg.log_channel_id} onChange={(v) => setCfg({ ...cfg, log_channel_id: v })} />
                <ChannelSelect label="Transcript channel" kind="text" channels={channels} value={cfg.transcript_channel_id} onChange={(v) => setCfg({ ...cfg, transcript_channel_id: v })} />
              </div>
            </div>
          </Section>
          <Section icon="users" title="Staff roles" hint="These roles can see and manage every ticket.">
            <RoleChips roles={roles} selected={staff} onToggle={toggleStaff} />
          </Section>
          <SaveBar dirty={dirty} pending={pending} result={result} onSave={save} onReset={() => { setCfg(base); setStaff(baseStaff); setResult(null); }} />
        </div>
      )}

      {tab === "tickets" && (
        <Section icon="scroll" title="Recent tickets" hint="The latest 50, newest first.">
          {data.recent.length === 0 ? <Empty icon="ticket" title="No tickets yet" /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-zinc-500"><tr><th className="pb-3">#</th><th className="pb-3">Member</th><th className="pb-3">Category</th><th className="pb-3">Status</th><th className="pb-3">Claimed by</th><th className="pb-3">Opened</th></tr></thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {data.recent.map((t) => (
                    <tr key={t.id} className="text-zinc-300">
                      <td className="py-2.5 text-zinc-500">{t.id}</td><td>{t.user}</td><td>{t.category}</td>
                      <td><Badge tone={t.status === "open" ? "green" : "zinc"}>{t.status}</Badge></td><td>{t.claimed_by || "—"}</td><td className="text-zinc-500">{day(t.created_at)}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>)}
        </Section>
      )}
    </div>
  );
}
