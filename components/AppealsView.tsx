"use client";

import { useState } from "react";
import type { AppealsData, Channel } from "@/lib/store";
import { Icon } from "./Icon";
import { Badge, ChannelSelect, Empty, Field, SaveBar, Section, Stat, Toggle, useJob } from "./ui";

const day = (iso: string) => String(iso).slice(0, 10);

export function AppealsView({ guildId, data, channels, ticketReady }: { guildId: string; data: AppealsData; channels: Channel[]; ticketReady: { category: boolean; staff: boolean } }) {
  const { pending, result, run, setResult } = useJob(guildId);
  const post = useJob(guildId);
  const [base, setBase] = useState({ hours: data.config.cooldown_hours, strict: data.config.strict });
  const [hours, setHours] = useState(String(data.config.cooldown_hours));
  const [strict, setStrict] = useState(data.config.strict);
  const [target, setTarget] = useState<string | null>(data.config.channel_id);

  const n = Number(hours);
  const valid = hours !== "" && Number.isInteger(n) && n >= 0 && n <= 720;
  const dirty = n !== base.hours || strict !== base.strict;
  const save = async () => { const r = await run("appeals.config.save", { cooldown_hours: n, strict }); if (r.ok) setBase({ hours: n, strict }); };

  const checks = [
    { ok: ticketReady.category, label: "Ticket category set", hint: "Appeals open as tickets. Set it under Tickets → Settings." },
    { ok: ticketReady.staff, label: "Ticket staff roles set", hint: "Staff need access to appeal tickets." },
    { ok: data.config.posted, label: "Appeal panel posted", hint: "Members press its button to appeal." },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label="Appeals" value={data.total} icon="scale" hint="Recent, from tickets" /><Stat label="Open" value={data.open} icon="clock" />
        <Stat label="AI reviewed" value={Object.values(data.ai_status).reduce((a, b) => a + b, 0)} icon="sparkles" hint="Handled by the AI staff assistant" />
      </div>

      <Section icon="check" title="Setup checklist">
        <ul className="grid gap-3 sm:grid-cols-3">
          {checks.map((c) => (
            <li key={c.label} className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3">
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${c.ok ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-zinc-500"}`}><Icon name={c.ok ? "check" : "x"} className="h-4 w-4" /></span>
              <div><p className="text-sm font-medium text-zinc-200">{c.label}</p><p className="text-xs text-zinc-500">{c.hint}</p></div>
            </li>))}
        </ul>
        <p className="mt-4 text-xs text-zinc-500">Appeals are reviewed by the AI staff assistant. If it isn&apos;t answering, run <code className="rounded bg-white/10 px-1.5 py-0.5">aistaff on</code> in Discord.</p>
      </Section>

      <Section icon="scale" title="Appeal rules">
        <div className="space-y-5">
          <Toggle checked={strict} onChange={setStrict} label="Strict mode" hint="On: only members with an active punishment can appeal." />
          <div className="max-w-xs">
            <Field label="Cooldown after a denial (hours)" hint="0 means no cooldown. Maximum 720 (30 days).">
              <input type="number" min={0} max={720} value={hours} onChange={(e) => setHours(e.target.value)}
                     className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-400/60" />
            </Field>
            {!valid && <p className="mt-1 text-xs text-rose-300">Enter a whole number from 0 to 720.</p>}
          </div>
        </div>
      </Section>
      <SaveBar dirty={dirty} pending={pending} result={result} disabled={!valid} onSave={save} onReset={() => { setHours(String(base.hours)); setStrict(base.strict); setResult(null); }} />

      <Section icon="send" title="Appeal panel" hint="Post (or refresh) the message members use to appeal.">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px] flex-1"><ChannelSelect label="Channel" kind="text" channels={channels} value={target} onChange={setTarget} /></div>
          <button type="button" className="btn btn-primary" disabled={!target || post.pending} onClick={() => post.run("appeals.panel.publish", { channel_id: target })}>
            {post.pending ? <><span className="spinner" /> Posting…</> : data.config.posted ? "Update panel" : "Post panel"}
          </button>
        </div>
        {post.result && <p className={`mt-3 text-sm ${post.result.ok ? "text-emerald-300" : "text-rose-300"}`}>{post.result.message}</p>}
      </Section>

      <Section icon="history" title="Recent appeals" hint="Latest 50 appeal tickets.">
        {data.recent.length === 0 ? <Empty icon="scale" title="No appeals yet" /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-zinc-500"><tr><th className="pb-3">#</th><th className="pb-3">Member</th><th className="pb-3">Status</th><th className="pb-3">Opened</th></tr></thead>
            <tbody className="divide-y divide-white/[0.05]">
              {data.recent.map((a) => (<tr key={a.id} className="text-zinc-300"><td className="py-2.5 text-zinc-500">{a.id}</td><td>{a.user}</td>
                <td><Badge tone={a.status === "open" ? "green" : "zinc"}>{a.status}</Badge></td><td className="text-zinc-500">{day(a.created_at)}</td></tr>))}
            </tbody></table></div>)}
      </Section>
    </div>
  );
}
