"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { Badge, Section, Stat, Tabs, useJob } from "./ui";
import { RolePermsPanel } from "./RolePermsPanel";
import type { Channel, ModerationCommand, ModerationData, ModerationRule, Role } from "@/lib/store";

type Tab = "commands" | "roles" | "automod" | "activity";
const CATEGORIES = ["All", "Moderation", "AutoMod"] as const;
const ACTIONS = ["delete", "warn", "timeout", "kick", "ban", "jail"];

export function ModerationView({ guildId, data, prefix, channels, roles }: { guildId: string; data: ModerationData; prefix: string; channels: Channel[]; roles: Role[] }) {
  const router = useRouter();
  const { pending, result, run } = useJob(guildId);
  const [tab, setTab] = useState<Tab>("commands");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [query, setQuery] = useState("");
  const [help, setHelp] = useState<ModerationCommand | null>(null);
  const [savingRule, setSavingRule] = useState<string | null>(null);

  const commands = useMemo(() => data.commands.filter((c) =>
    (category === "All" || c.category === category) &&
    `${c.name} ${c.description} ${c.aliases.join(" ")}`.toLowerCase().includes(query.toLowerCase())
  ), [data.commands, category, query]);
  const enabledCount = data.commands.filter((c) => c.enabled).length;
  const automod = data.automod;

  const toggleCommand = async (command: string, enabled: boolean) => {
    const r = await run("moderation.command.toggle", { command, enabled }, false);
    if (r.ok) router.refresh();
  };
  const bulk = async (enabled: boolean) => {
    if (!window.confirm(`${enabled ? "Enable" : "Disable"} all ${category === "All" ? "moderation" : category} commands for this server?`)) return;
    const r = await run("moderation.commands.bulk", { enabled, category }, false);
    if (r.ok) router.refresh();
  };
  const saveRule = async (rule: string, changes: Record<string, unknown>) => {
    setSavingRule(rule);
    const r = await run("moderation.automod.rule.save", { rule, ...changes }, false);
    setSavingRule(null);
    if (r.ok) router.refresh();
  };
  const setAutoMod = async (enabled: boolean) => {
    const r = await run("moderation.automod.master", { enabled }, false);
    if (r.ok) router.refresh();
  };
  const setAutoOption = async (option: "bypass_staff" | "scan_edits", value: boolean) => {
    const r = await run("moderation.automod.option.save", { option, value }, false);
    if (r.ok) router.refresh();
  };
  const setLogChannel = async (channel_id: string) => {
    const r = await run("moderation.automod.logging.save", { channel_id: channel_id || null }, false);
    if (r.ok) router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Commands" value={data.commands.length} icon="terminal" hint="Loaded moderation commands" />
        <Stat label="Enabled" value={enabledCount} icon="check" hint={`${data.commands.length - enabledCount} disabled`} />
        <Stat label="AutoMod rules" value={automod.rules.length} icon="shield" hint={`${automod.rules.filter((r) => r.enabled).length} active rules`} />
        <Stat label="Recent incidents" value={automod.incidents.length} icon="activity" hint="Latest stored AutoMod events" />
      </div>

      <Tabs tabs={[{ id: "commands", label: "Command manager", icon: "terminal" }, { id: "roles", label: "Role permissions", icon: "users" }, { id: "automod", label: "Auto Moderation", icon: "shield" }, { id: "activity", label: "Activity & logs", icon: "history" }]} value={tab} onChange={setTab} />

      {result && <p role="status" className={`text-sm ${result.ok ? "text-emerald-300" : "text-rose-300"}`}>{result.message}</p>}

      {tab === "commands" && <div className="space-y-5">
        <Section icon="terminal" title="Command manager" hint="Search commands, control availability per server, and open Help for usage examples.">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1">
              <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search commands, aliases or descriptions…" className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-violet-400/60" />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => bulk(true)} disabled={pending || commands.length === 0} className="btn btn-ghost">Enable {category === "All" ? "all" : category}</button>
              <button type="button" onClick={() => bulk(false)} disabled={pending || commands.length === 0} className="btn btn-ghost">Disable {category === "All" ? "all" : category}</button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-xl border px-3 py-2 text-sm transition ${category === item ? "border-violet-400/40 bg-violet-500/15 text-violet-100" : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"}`}>{item}</button>)}
            <span className="ml-auto self-center text-xs text-zinc-500">{commands.length} shown</span>
          </div>
        </Section>

        {commands.length ? <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {commands.map((command) => <CommandCard key={command.name} command={command} prefix={prefix} pending={pending} onToggle={toggleCommand} onHelp={setHelp} />)}
        </div> : <div className="glass p-8 text-center text-sm text-zinc-500">No commands match your search.</div>}
      </div>}

      {tab === "roles" && <RolePermsPanel guildId={guildId} access={data.role_access} roles={roles} prefix={prefix} />}

      {tab === "automod" && <div className="space-y-5">
        <Section icon="shield" title="AutoMod protection" hint="These settings use the bot's existing AutoMod database and detection engine." aside={<Badge tone={automod.enabled ? "green" : "amber"}>{automod.enabled ? "System active" : "Paused"}</Badge>}>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
            <div><p className="font-medium text-white">Master protection</p><p className="mt-1 text-xs text-zinc-500">Pause or resume all AutoMod rules without deleting their configuration.</p></div>
            <button type="button" role="switch" aria-checked={automod.enabled} aria-label="AutoMod master switch" disabled={pending} onClick={() => setAutoMod(!automod.enabled)} className={`relative h-8 w-14 rounded-full border transition disabled:opacity-50 ${automod.enabled ? "border-violet-400/50 bg-violet-600" : "border-white/10 bg-white/10"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${automod.enabled ? "left-8" : "left-1"}`} /></button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">AutoMod log channel</span><select value={automod.log_channel_id || ""} disabled={pending} onChange={(e) => setLogChannel(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"><option value="">Not configured</option>{channels.filter((c) => c.type === "text").map((c) => <option key={c.id} value={c.id}># {c.name}</option>)}</select><span className="mt-1 block text-xs text-zinc-500">The existing AutoMod incident log destination.</span></label>
            <div className="space-y-3 rounded-xl border border-white/[0.07] bg-black/20 p-3"><p className="text-sm font-medium text-white">Rule behaviour</p><div className="flex items-center justify-between gap-3"><div><p className="text-xs text-zinc-300">Staff bypass</p><p className="text-[11px] text-zinc-500">Skip trusted staff members.</p></div><MiniSwitch checked={automod.bypass_staff} disabled={pending} onChange={(v) => setAutoOption("bypass_staff", v)} /></div><div className="flex items-center justify-between gap-3"><div><p className="text-xs text-zinc-300">Scan edited messages</p><p className="text-[11px] text-zinc-500">Re-check content after edits.</p></div><MiniSwitch checked={automod.scan_edits} disabled={pending} onChange={(v) => setAutoOption("scan_edits", v)} /></div></div>
          </div>
        </Section>
        <div className="grid gap-3 lg:grid-cols-2">
          {automod.rules.map((rule) => <RuleCard key={rule.key} rule={rule} pending={pending || savingRule === rule.key} onSave={saveRule} />)}
        </div>
      </div>}

      {tab === "activity" && <div className="space-y-5">
        <Section icon="scroll" title="Moderation log destination" hint="Choose where command-based moderation cases and staff proof logs should be sent.">
          <label className="block max-w-xl"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">Moderation log channel</span><select value={data.modlog_channel_id || ""} disabled={pending} onChange={async (e) => { const r = await run("moderation.logs.save", { channel_id: e.target.value || null }, false); if (r.ok) router.refresh(); }} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white"><option value="">Disabled</option>{channels.filter((c) => c.type === "text").map((c) => <option key={c.id} value={c.id}># {c.name}</option>)}</select></label>
        </Section>
        <Section icon="scroll" title="Moderation cases" hint="Latest cases from the bot's existing case database, including moderator, reason and active status.">
          {(data.cases || []).length ? <div className="divide-y divide-white/[0.06]">{data.cases.map((item) => <div key={item.case_id} className="flex flex-wrap items-start gap-3 py-3"><span className="mt-0.5 flex h-9 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-xs font-semibold text-violet-200">#{item.case_id}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-white">{item.action}</span><Badge tone={item.active ? "green" : "zinc"}>{item.active ? "Active" : "Inactive"}</Badge></div><p className="mt-1 text-xs text-zinc-300">{item.user_name} · {item.reason}</p><p className="mt-1 text-[11px] text-zinc-600">By {item.moderator_name} · {item.created_at}{item.duration ? ` · ${item.duration}` : ""}</p></div></div>)}</div> : <div className="py-6 text-center text-sm text-zinc-500">No moderation cases have been recorded yet.</div>}
        </Section>
        <Section icon="history" title="Recent AutoMod incidents" hint="Latest incidents recorded by the existing AutoMod engine.">
        {automod.incidents.length ? <div className="divide-y divide-white/[0.06]">{automod.incidents.map((item) => <div key={item.id} className="flex flex-wrap items-start gap-3 py-3"><span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><Icon name="shield" className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-white">{item.rule}</span><Badge>{item.action}</Badge></div><p className="mt-1 text-xs text-zinc-400">{item.outcome}</p><p className="mt-1 text-[11px] text-zinc-600">User {item.user_id} · {item.created_at}</p></div></div>)}</div> : <div className="py-8 text-center text-sm text-zinc-500">No AutoMod incidents have been recorded yet.</div>}
        </Section>
      </div>}

      {help && <HelpDialog command={help} prefix={prefix} onClose={() => setHelp(null)} />}
    </div>
  );
}

function CommandCard({ command, prefix, pending, onToggle, onHelp }: { command: ModerationCommand; prefix: string; pending: boolean; onToggle: (name: string, enabled: boolean) => void; onHelp: (c: ModerationCommand) => void }) {
  return <article className="glass spot flex min-w-0 flex-col p-4">
    <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20"><Icon name="terminal" className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{prefix}{command.name}</h3><Badge tone={command.category === "AutoMod" ? "violet" : "zinc"}>{command.category}</Badge></div><p className="mt-1 line-clamp-2 min-h-10 text-sm text-zinc-400">{command.description || "No help description is registered for this command yet."}</p></div></div>
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3"><div className="flex items-center gap-2"><button type="button" role="switch" aria-checked={command.enabled} aria-label={`${command.name} enabled`} disabled={pending} onClick={() => onToggle(command.name, !command.enabled)} className={`relative h-7 w-12 rounded-full border transition disabled:opacity-50 ${command.enabled ? "border-violet-400/50 bg-violet-600" : "border-white/10 bg-white/10"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${command.enabled ? "left-6" : "left-0.5"}`} /></button><span className={`text-xs ${command.enabled ? "text-emerald-300" : "text-zinc-500"}`}>{command.enabled ? "Enabled" : "Disabled"}</span></div><button type="button" onClick={() => onHelp(command)} className="btn btn-ghost !px-3 !py-2 text-xs"><Icon name="activity" className="h-3.5 w-3.5" /> Help & usage</button></div>
  </article>;
}

function RuleCard({ rule, pending, onSave }: { rule: ModerationRule; pending: boolean; onSave: (rule: string, changes: Record<string, unknown>) => void }) {
  return <article className="glass spot p-4 sm:p-5">
    <div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><Icon name="shield" className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{rule.label}</h3><Badge tone={rule.enabled ? "green" : "zinc"}>{rule.enabled ? "On" : "Off"}</Badge></div><p className="mt-1 text-xs text-zinc-500">{rule.summary}</p></div><button type="button" role="switch" aria-checked={rule.enabled} aria-label={`${rule.label} enabled`} disabled={pending} onClick={() => onSave(rule.key, { enabled: !rule.enabled })} className={`relative h-7 w-12 shrink-0 rounded-full border transition disabled:opacity-50 ${rule.enabled ? "border-violet-400/50 bg-violet-600" : "border-white/10 bg-white/10"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${rule.enabled ? "left-6" : "left-0.5"}`} /></button></div>
    <div className="mt-4"><label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">When triggered, bot should</span><select value={rule.action} disabled={pending} onChange={(e) => onSave(rule.key, { action: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white">{ACTIONS.map((a) => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}</select></label></div>
    <div className="mt-3 flex flex-wrap gap-2">{Object.entries(rule.config).filter(([k, v]) => typeof v === "number" && ["limit", "window", "duplicate_limit", "duplicate_window", "min_letters", "ratio", "timeout_seconds", "max_mb"].includes(k)).map(([key, value]) => <NumericRuleField key={key} rule={rule.key} field={key} value={Number(value)} disabled={pending} onSave={onSave} />)}</div>
    <div className="mt-3 space-y-2">{Object.entries(rule.config).filter(([k, v]) => Array.isArray(v) && ["allowed_domains", "blocked_words", "blocked_extensions", "domains"].includes(k)).map(([key, value]) => <StringListField key={key} rule={rule.key} field={key} value={value as string[]} disabled={pending} onSave={onSave} />)}</div>
    <div className="mt-3 flex flex-wrap gap-3">{Object.entries(rule.config).filter(([k, v]) => typeof v === "boolean" && ["everyone", "allow_same_guild", "allow_gifs"].includes(k)).map(([key, value]) => <label key={key} className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={Boolean(value)} disabled={pending} onChange={(e) => onSave(rule.key, { [key]: e.target.checked })} className="accent-violet-500" />{key.replaceAll("_", " ")}</label>)}</div>
  </article>;
}

function NumericRuleField({ rule, field, value, disabled, onSave }: { rule: string; field: string; value: number; disabled: boolean; onSave: (rule: string, changes: Record<string, unknown>) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return <label className="min-w-[7rem] flex-1"><span className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">{field.replaceAll("_", " ")}</span><input type="number" value={draft} disabled={disabled} onChange={(e) => setDraft(e.target.value)} onBlur={() => { const n = Number(draft); if (Number.isInteger(n) && n > 0 && n !== value) onSave(rule, { [field]: n }); else if (!draft || !Number.isInteger(n) || n < 1) setDraft(String(value)); }} className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-sm text-white outline-none focus:border-violet-400/60" /></label>;
}

function MiniSwitch({ checked, disabled, onChange }: { checked: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full border transition disabled:opacity-50 ${checked ? "border-violet-400/50 bg-violet-600" : "border-white/10 bg-white/10"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? "left-6" : "left-0.5"}`} /></button>;
}

function StringListField({ rule, field, value, disabled, onSave }: { rule: string; field: string; value: string[]; disabled: boolean; onSave: (rule: string, changes: Record<string, unknown>) => void }) {
  const [draft, setDraft] = useState(value.join(", "));
  useEffect(() => setDraft(value.join(", ")), [value]);
  return <label className="block"><span className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">{field.replaceAll("_", " ")} · comma separated</span><input value={draft} disabled={disabled} onChange={(e) => setDraft(e.target.value)} onBlur={() => { const next = draft.split(",").map((v) => v.trim()).filter(Boolean); if (JSON.stringify(next) !== JSON.stringify(value)) onSave(rule, { [field]: next }); }} className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-sm text-white outline-none focus:border-violet-400/60" /></label>;
}

function HelpDialog({ command, prefix, onClose }: { command: ModerationCommand; prefix: string; onClose: () => void }) {
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4" onClick={onClose}><div role="dialog" aria-modal="true" aria-label={`${command.name} help`} onClick={(e) => e.stopPropagation()} className="max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0d0818] p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-6">
    <div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><Icon name="terminal" /></span><div className="min-w-0 flex-1"><h2 className="font-display text-xl font-bold text-white">{prefix}{command.name}</h2><p className="mt-1 text-sm text-zinc-400">Command help and usage</p></div><button type="button" onClick={onClose} aria-label="Close help" className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-white/5"><Icon name="x" /></button></div>
    <div className="mt-5 space-y-4"><div><h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">What it does</h3><p className="mt-2 text-sm leading-6 text-zinc-200">{command.description || "This command does not have a help description registered in the bot source."}</p></div><div><h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Example / usage</h3><pre className="mt-2 overflow-x-auto rounded-xl border border-white/[0.07] bg-black/40 p-3 text-sm text-violet-200"><code>{`${prefix}${command.name}${command.usage ? ` ${command.usage}` : ""}`}</code></pre></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><p className="text-[10px] uppercase tracking-wider text-zinc-500">Aliases</p><p className="mt-1 text-sm text-zinc-200">{command.aliases.length ? command.aliases.join(", ") : "None"}</p></div><div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><p className="text-[10px] uppercase tracking-wider text-zinc-500">Permission checks</p><p className="mt-1 text-sm text-zinc-200">{command.permission || "Command-specific checks"}</p></div></div></div>
    <button type="button" onClick={onClose} className="btn btn-primary mt-6 w-full">Close</button>
  </div></div>;
}
