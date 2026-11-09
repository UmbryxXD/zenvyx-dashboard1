"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Badge, ChannelPicker, ChannelSelect, RoleSelect, SaveBar, Section, Select, Stat, TextInput, Toggle, sameList, useJob } from "./ui";
import type { AiData, Channel, Role } from "@/lib/store";

const ACTIONS = [
  { value: "log", label: "Only log it (no action)" },
  { value: "delete", label: "Delete the message" },
  { value: "timeout", label: "Delete and time the member out" },
];
const SEVERITY = [
  { value: "1", label: "1 · Mild (act on almost everything)" },
  { value: "2", label: "2 · Clear violations (recommended)" },
  { value: "3", label: "3 · Severe only" },
];
const STRICT = [
  { value: "low", label: "Low · only clear, serious things" },
  { value: "normal", label: "Normal · direct insults and abuse" },
  { value: "high", label: "High · also rude and undirected swearing" },
];

export function AiView({ guildId, data, prefix, channels, roles }: { guildId: string; data: AiData; prefix: string; channels: Channel[]; roles: Role[] }) {
  const mod = data.mod!;
  const reports = data.reports!;
  const limits = data.limits ?? { channels: null, messages: null, per_channel: null };

  // ---------- AI moderation ----------
  const saved = { enabled: mod.enabled, action: mod.action, sev: String(mod.min_severity), strict: mod.strictness, minutes: String(mod.timeout_minutes), ignored: mod.ignored };
  const [base, setBase] = useState(saved);
  const [enabled, setEnabled] = useState(saved.enabled);
  const [action, setAction] = useState<string>(saved.action);
  const [sev, setSev] = useState(saved.sev);
  const [strict, setStrict] = useState<string>(saved.strict);
  const [minutes, setMinutes] = useState(saved.minutes);
  const [ignored, setIgnored] = useState<string[]>(saved.ignored);
  const modJob = useJob(guildId);
  const minutesOk = /^\d+$/.test(minutes) && +minutes >= 1 && +minutes <= 10080;
  const dirty = enabled !== base.enabled || action !== base.action || sev !== base.sev || strict !== base.strict || minutes !== base.minutes || !sameList(ignored, base.ignored);

  const saveMod = async () => {
    const r = await modJob.run("ai.mod.save", { enabled, action, min_severity: +sev, strictness: strict, timeout_minutes: +minutes, ignored });
    if (r.ok) setBase({ enabled, action: action as typeof base.action, sev, strict: strict as typeof base.strict, minutes, ignored });
  };
  const resetMod = () => { setEnabled(base.enabled); setAction(base.action); setSev(base.sev); setStrict(base.strict); setMinutes(base.minutes); setIgnored(base.ignored); modJob.setResult(null); };

  // ---------- try it ----------
  const tester = useJob(guildId);
  const [sample, setSample] = useState("");

  // ---------- reports ----------
  const repJob = useJob(guildId);
  const [repChannel, setRepChannel] = useState<string | null>(reports.channel_id);
  const [repRole, setRepRole] = useState<string | null>(reports.ping_role_id);
  const repDirty = repChannel !== reports.channel_id || repRole !== reports.ping_role_id;

  // ---------- learning ----------
  const learnJob = useJob(guildId);
  const learned = data.learned ?? [];
  const [toLearn, setToLearn] = useState<string[]>([]);
  const [amount, setAmount] = useState("500");
  const perChannel = limits.per_channel ?? 1000;
  const amounts = [200, 500, 1000, 2000, 5000].filter((n) => n <= perChannel);
  if (!amounts.includes(perChannel) && perChannel >= 50) amounts.push(perChannel);
  const used = data.learned_messages ?? 0;
  const pct = limits.messages ? Math.min(100, Math.round((used / limits.messages) * 100)) : 0;
  const learnable = channels.filter((c) => c.type === "text" && !learned.some((l) => l.id === c.id));

  const learn = async () => {
    const r = await learnJob.run("ai.learn.add", { channel_ids: toLearn, limit: +amount });
    if (r.ok) setToLearn([]);
  };
  const forget = (id: string) => learnJob.run("ai.learn.remove", { channel_id: id });
  const clearAll = async () => {
    if (!window.confirm("Make the AI forget everything it learned in this server?")) return;
    await learnJob.run("ai.learn.clear", {});
  };

  return (
    <div className="space-y-6">
      {!data.configured && (
        <p role="alert" className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          The AI has no API key yet, so it can&apos;t answer or moderate. The bot owner needs to add <code className="rounded bg-black/30 px-1.5 py-0.5">GOOGLE_API_KEY=</code> to the bot&apos;s <code className="rounded bg-black/30 px-1.5 py-0.5">.env</code> (free key from aistudio.google.com) and restart it.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="AI moderation" value={base.enabled ? "On" : "Off"} icon="shield" hint={base.enabled ? `acts from severity ${base.sev}` : "turned off"} />
        <Stat label="Learned channels" value={learned.length} icon="hash" hint={limits.channels ? `limit ${limits.channels}` : undefined} />
        <Stat label="Learned messages" value={used.toLocaleString("en-US")} icon="scroll" hint={limits.messages ? `of ${limits.messages.toLocaleString("en-US")}` : undefined} />
        <Stat label="AI reports" value={reports.channel_id ? "Set" : "Not set"} icon="flag" hint={reports.channel_id ? "logs and reports go there" : "pick a channel below"} />
      </div>

      <Section icon="shield" title="AI moderation" hint="The AI reads new messages in batches and flags abuse, scams, threats and more. Moderators are never checked."
               aside={<Badge tone={base.enabled ? "green" : "zinc"}>{base.enabled ? "On" : "Off"}</Badge>}>
        <div className="space-y-5">
          <Toggle checked={enabled} onChange={setEnabled} label="Turn on AI moderation" hint="Needs the AI key to be set up on the bot." />
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="When it flags a message" value={action} onChange={setAction} options={ACTIONS} />
            <Select label="Act from severity" value={sev} onChange={setSev} options={SEVERITY} hint="Lower severities are only logged." />
            <Select label="Strictness" value={strict} onChange={setStrict} options={STRICT} />
            {action === "timeout" && (
              <TextInput label="Timeout length (minutes)" value={minutes} onChange={setMinutes} hint={minutesOk ? "1 to 10080 (one week)." : "Enter a number from 1 to 10080."} max={5} />
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Channels the AI should ignore</p>
            <ChannelPicker channels={channels} selected={ignored} onChange={setIgnored} max={50} placeholder="Ignore a channel…" />
          </div>
          <SaveBar dirty={dirty} pending={modJob.pending} result={modJob.result} onSave={saveMod} onReset={resetMod} disabled={!minutesOk} />
        </div>
      </Section>

      <Section icon="sparkles" title="Try it" hint="See what AI moderation would do with a message. Nothing is deleted or logged.">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="min-w-0 flex-1">
            <TextInput label="Message" value={sample} onChange={setSample} placeholder="Type something to test…" max={500} />
          </div>
          <button type="button" disabled={!sample.trim() || tester.pending} onClick={() => tester.run("ai.mod.test", { text: sample }, false)}
                  className="btn btn-primary self-end disabled:cursor-not-allowed disabled:opacity-40">
            {tester.pending ? <><span className="spinner" /> Checking…</> : "Test"}
          </button>
        </div>
        {tester.result && (
          <p aria-live="polite" className={`mt-3 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${tester.result.ok ? "border-white/10 bg-black/20 text-zinc-200" : "border-rose-400/20 bg-rose-500/10 text-rose-300"}`}>
            <Icon name={tester.result.ok ? "check" : "x"} className="mt-0.5 h-4 w-4 shrink-0" /> {tester.result.message}
          </p>
        )}
      </Section>

      <Section icon="flag" title="AI reports" hint="Where member reports and AI-moderation logs are sent.">
        <div className="grid gap-4 md:grid-cols-2">
          <ChannelSelect label="Reports channel" kind="text" channels={channels} value={repChannel} onChange={setRepChannel} />
          <RoleSelect label="Role to ping (optional)" roles={roles} value={repRole} onChange={setRepRole} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" disabled={!repDirty || repJob.pending} onClick={() => repJob.run("ai.reports.save", { channel_id: repChannel, ping_role_id: repRole })}
                  className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40">{repJob.pending ? <><span className="spinner" /> Saving…</> : "Save"}</button>
          <button type="button" disabled={repJob.pending} onClick={() => repJob.run("ai.reports.create", {})} className="btn btn-ghost">
            <Icon name="plus" className="h-4 w-4" /> Create a private #ai-reports
          </button>
          {repJob.result && <p aria-live="polite" className={`text-sm ${repJob.result.ok ? "text-emerald-300" : "text-rose-300"}`}>{repJob.result.message}</p>}
        </div>
      </Section>

      <Section icon="scroll" title="What the AI knows" hint={`Teach it from channels like rules or FAQ. Members then use ${prefix}ask <question>. It only answers from channels the asker can see.`}>
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-400">
            <span>{used.toLocaleString("en-US")} messages learned</span>{limits.messages ? <span>{pct}% of {limits.messages.toLocaleString("en-US")}</span> : null}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400" style={{ width: `${pct}%` }} /></div>
        </div>

        {learned.length === 0 ? <p className="text-sm text-zinc-500">The AI hasn&apos;t learned any channel yet.</p> : (
          <ul className="space-y-2">
            {learned.map((l) => (
              <li key={l.id} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2">
                <Icon name="hash" className="h-4 w-4 shrink-0 text-violet-300" />
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{l.name ?? "deleted channel"}</span>
                <button type="button" disabled={learnJob.pending} onClick={() => forget(l.id)} aria-label={`Forget ${l.name ?? "channel"}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-rose-300 disabled:opacity-40"><Icon name="trash" className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 space-y-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
          <p className="text-sm font-medium text-white">Teach it new channels</p>
          <ChannelPicker channels={learnable} selected={toLearn} onChange={setToLearn} max={5} placeholder="Pick a channel to learn…" />
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-44"><Select label="Messages per channel" value={amount} onChange={setAmount} options={amounts.map((n) => ({ value: String(n), label: n.toLocaleString("en-US") }))} /></div>
            <button type="button" disabled={toLearn.length === 0 || learnJob.pending} onClick={learn} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40">
              {learnJob.pending ? <><span className="spinner" /> Reading…</> : "Learn"}
            </button>
            {learned.length > 0 && <button type="button" disabled={learnJob.pending} onClick={clearAll} className="btn btn-ghost ml-auto">Forget everything</button>}
          </div>
          <p className="text-xs text-zinc-500">Up to 5 channels at a time. Only pick channels members are fine with the bot reading.</p>
          {learnJob.result && <p aria-live="polite" className={`text-sm ${learnJob.result.ok ? "text-emerald-300" : "text-rose-300"}`}>{learnJob.result.message}</p>}
        </div>
      </Section>
    </div>
  );
}
