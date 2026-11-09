"use client";

import { useState } from "react";
import type { Channel, Role, StaffAppsData } from "@/lib/store";
import { Icon } from "./Icon";
import { Badge, ChannelSelect, Empty, RoleSelect, SaveBar, Section, Stat, Tabs, Toggle, useJob } from "./ui";

type Tab = "settings" | "questions" | "history";
const MAX_Q = 25, MAX_LEN = 250;
const day = (iso: string) => String(iso).slice(0, 10);

export function ApplicationsView({ guildId, data, channels, roles }: { guildId: string; data: StaffAppsData; channels: Channel[]; roles: Role[] }) {
  const [tab, setTab] = useState<Tab>("settings");
  const { pending, result, run, setResult } = useJob(guildId);
  const [base, setBase] = useState({ cfg: data.config, questions: data.questions });
  const [cfg, setCfg] = useState(data.config);
  const [questions, setQuestions] = useState(data.questions);
  const dirty = JSON.stringify({ cfg, questions }) !== JSON.stringify(base);
  const invalid = questions.length === 0 || questions.some((q) => !q.trim() || q.length > MAX_LEN);

  const setQ = (i: number, v: string) => setQuestions((qs) => qs.map((q, j) => (j === i ? v : q)));
  const move = (i: number, d: number) => setQuestions((qs) => { const n = [...qs]; const j = i + d; if (j < 0 || j >= n.length) return qs; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const save = async () => {
    const r = await run("staffapps.config.save", { enabled: cfg.enabled, result_channel_id: cfg.result_channel_id, log_channel_id: cfg.log_channel_id, ping_role_id: cfg.ping_role_id, accept_role_id: cfg.accept_role_id, questions });
    if (r.ok) setBase({ cfg, questions });
  };
  const decided = data.stats.accepted + data.stats.denied;
  const rate = decided ? Math.round((data.stats.accepted / decided) * 100) : 0;

  return (
    <div className="space-y-6">
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[
        { id: "settings", label: "Settings", icon: "sliders" }, { id: "questions", label: `Questions (${questions.length})`, icon: "clipboard" }, { id: "history", label: "History", icon: "history" }]} />

      {tab === "settings" && (
        <Section icon="clipboard" title="Staff applications" hint="Members apply from a ticket panel button (add one with the Staff application template).">
          <div className="space-y-5">
            <Toggle checked={cfg.enabled} onChange={(v) => setCfg({ ...cfg, enabled: v })} label="Applications open" hint="Turn off to stop accepting new applications." />
            <div className="grid gap-4 sm:grid-cols-2">
              <ChannelSelect label="Results channel" kind="text" channels={channels} value={cfg.result_channel_id} onChange={(v) => setCfg({ ...cfg, result_channel_id: v })} hint="Where finished applications are posted for review." />
              <ChannelSelect label="Log channel" kind="text" channels={channels} value={cfg.log_channel_id} onChange={(v) => setCfg({ ...cfg, log_channel_id: v })} hint="Accept / deny decisions are logged here." />
              <RoleSelect label="Ping role" roles={roles} value={cfg.ping_role_id} onChange={(v) => setCfg({ ...cfg, ping_role_id: v })} hint="Pinged when a new application arrives." />
              <RoleSelect label="Role given when accepted" needAssignable roles={roles} value={cfg.accept_role_id} onChange={(v) => setCfg({ ...cfg, accept_role_id: v })} hint="Optional. Must be below my highest role." />
            </div>
          </div>
        </Section>
      )}

      {tab === "questions" && (
        <Section icon="clipboard" title="Application questions" hint={`Applicants answer these in order (up to ${MAX_Q}, ${MAX_LEN} characters each).`}
                 aside={questions.length < MAX_Q ? <button type="button" className="btn btn-ghost !px-3 !py-1.5" onClick={() => setQuestions([...questions, ""])}><Icon name="plus" className="h-4 w-4" /> Add</button> : undefined}>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3">
                <span className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs text-violet-200">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <textarea rows={2} value={q} maxLength={MAX_LEN} onChange={(e) => setQ(i, e.target.value)} aria-label={`Question ${i + 1}`}
                            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none focus:border-violet-400/60" />
                  <p className={`mt-1 text-right text-[11px] ${q.length > MAX_LEN - 20 ? "text-amber-300" : "text-zinc-600"}`}>{q.length}/{MAX_LEN}</p>
                </div>
                <div className="flex flex-col">
                  <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"><Icon name="up" className="h-4 w-4" /></button>
                  <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"><Icon name="down" className="h-4 w-4" /></button>
                  <button type="button" aria-label="Remove question" onClick={() => setQuestions(questions.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300"><Icon name="trash" className="h-4 w-4" /></button>
                </div>
              </div>))}
            {questions.length === 0 && <Empty icon="clipboard" title="No questions">Add at least one question.</Empty>}
          </div>
        </Section>
      )}

      {tab === "history" && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Accepted" value={data.stats.accepted} icon="check" /><Stat label="Denied" value={data.stats.denied} icon="x" /><Stat label="Acceptance rate" value={`${rate}%`} icon="activity" />
          </div>
          <Section icon="history" title="Decisions" hint="Latest 50 reviewed applications.">
            {data.history.length === 0 ? <Empty icon="clipboard" title="No decisions yet" /> : (
              <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-zinc-500"><tr><th className="pb-3">Applicant</th><th className="pb-3">Result</th><th className="pb-3">Reviewer</th><th className="pb-3">Note</th><th className="pb-3">Date</th></tr></thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {data.history.map((h) => (
                    <tr key={h.id} className="align-top text-zinc-300"><td className="py-2.5">{h.applicant}</td>
                      <td><Badge tone={h.accepted ? "green" : "red"}>{h.accepted ? "accepted" : "denied"}</Badge></td><td>{h.reviewer || "—"}</td>
                      <td className="max-w-xs break-words text-zinc-400">{h.note || "—"}</td><td className="text-zinc-500">{day(h.decided_at)}</td></tr>))}
                </tbody></table></div>)}
          </Section>
        </div>
      )}

      {tab !== "history" && (
        <SaveBar dirty={dirty} pending={pending} disabled={invalid} result={invalid && dirty ? { ok: false, message: "Every question needs text (max 250 characters)." } : result}
                 onSave={save} onReset={() => { setCfg(base.cfg); setQuestions(base.questions); setResult(null); }} />
      )}
    </div>
  );
}
