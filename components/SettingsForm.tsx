"use client";

import { useRouter } from "next/navigation";
import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { saveSettings } from "@/app/actions/settings";
import type { Role } from "@/lib/store";
import { Icon, type IconName } from "./Icon";

const MAX = 10;

function Section({ icon, title, hint, aside, children }: { icon: IconName; title: string; hint: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="glass spot rise p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
          <p className="mt-0.5 text-sm text-zinc-400">{hint}</p>
        </div>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function RolePicker({ icon, title, hint, roles, selected, onToggle }: {
  icon: IconName; title: string; hint: string; roles: Role[]; selected: string[]; onToggle: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const shown = roles.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <Section icon={icon} title={title} hint={hint} aside={
      <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300">{selected.length}/{MAX}</span>
    }>
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500" style={{ width: `${(selected.length / MAX) * 100}%` }} />
      </div>
      <label className="relative block">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search roles" aria-label={`Search ${title}`}
               className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:shadow-[0_0_0_4px_rgba(139,92,246,.15)]" />
      </label>
      <div className="mt-4 flex max-h-60 flex-wrap gap-2 overflow-y-auto pr-1">
        {shown.map((r) => {
          const on = selected.includes(r.id);
          const locked = !r.assignable && !on;
          const full = !on && selected.length >= MAX;
          return (
            <button key={r.id} type="button" aria-pressed={on} disabled={locked || full} onClick={() => onToggle(r.id)}
                    title={locked ? "Above my highest role. Move the Zenvyx role higher in Discord." : undefined}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition duration-200 ${
                      on ? "border-violet-400/60 bg-violet-600/25 text-white shadow-[0_0_22px_-6px_rgba(139,92,246,.9)]"
                         : "border-white/10 bg-white/[0.02] text-zinc-300 hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/[0.06]"
                    } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color || "#6b7280", boxShadow: r.color ? `0 0 8px ${r.color}` : undefined }} />
              {r.name}
              {on && <Icon name="check" className="pop h-3.5 w-3.5 text-violet-200" />}
              {locked && <Icon name="lock" className="h-3 w-3" />}
            </button>
          );
        })}
        {shown.length === 0 && <p className="text-sm text-zinc-500">No roles match.</p>}
      </div>
    </Section>
  );
}

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export function SettingsForm(props: {
  guildId: string; prefix: string; humans: string[]; bots: string[]; roles: Role[]; online: boolean;
}) {
  const router = useRouter();
  const [base, setBase] = useState({ prefix: props.prefix, humans: props.humans, bots: props.bots });
  const [prefix, setPrefix] = useState(props.prefix);
  const [humans, setHumans] = useState(props.humans);
  const [bots, setBots] = useState(props.bots);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, setPending] = useState(false);

  const toggle = (set: Dispatch<SetStateAction<string[]>>) => (id: string) =>
    set((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const dirty = prefix !== base.prefix || !same(humans, base.humans) || !same(bots, base.bots);
  const valid = prefix.length >= 1 && prefix.length <= 5 && !/\s/.test(prefix);

  const save = async () => {
    if (pending) return;
    setPending(true);
    setResult(null);
    try {
      const r = await saveSettings({ guildId: props.guildId, prefix, humans, bots });
      setResult(r);
      if (r.ok) {
        setBase({ prefix, humans, bots });
        router.refresh();
      }
    } catch {
      setResult({ ok: false, message: "Couldn't reach the website server. Try again." });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {!props.online && (
        <p role="alert" className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          The bot looks offline, so saving will fail until it&apos;s back.
        </p>
      )}

      <Section icon="terminal" title="Prefix" hint="What members type before a command in this server.">
        <div className="flex flex-wrap items-center gap-4">
          <input value={prefix} onChange={(e) => setPrefix(e.target.value)} maxLength={5} aria-label="Prefix"
                 className="w-28 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-center font-mono text-xl text-white outline-none transition focus:border-violet-400/60 focus:shadow-[0_0_0_4px_rgba(139,92,246,.15)]" />
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm">
            <span className="text-zinc-500">preview</span>
            <span className="text-violet-300">{prefix || "?"}help</span>
            <span className="h-4 w-1.5 animate-pulse rounded-sm bg-violet-400" />
          </div>
        </div>
        {!valid && <p className="mt-3 text-xs text-rose-300">1-5 characters, no spaces.</p>}
      </Section>

      <RolePicker icon="users" title="Member autoroles" hint="Given to every human who joins." roles={props.roles} selected={humans} onToggle={toggle(setHumans)} />
      <RolePicker icon="server" title="Bot autoroles" hint="Given to every bot that is added." roles={props.roles} selected={bots} onToggle={toggle(setBots)} />

      <div className={`glass sticky bottom-4 z-10 flex flex-wrap items-center gap-4 p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,.9)] ${dirty ? "glow-border" : ""}`}>
        <button type="button" onClick={save} disabled={!dirty || !valid || pending} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">
          {pending ? <><span className="spinner" /> Saving…</> : "Save changes"}
        </button>
        {dirty && !pending && (
          <button type="button" className="btn btn-ghost" onClick={() => { setPrefix(base.prefix); setHumans(base.humans); setBots(base.bots); setResult(null); }}>
            Reset
          </button>
        )}
        <p aria-live="polite" className={`flex items-center gap-2 text-sm ${result ? (result.ok ? "text-emerald-300" : "text-rose-300") : "text-zinc-500"}`}>
          {result && <Icon name={result.ok ? "check" : "x"} className="pop h-4 w-4" />}
          {pending ? "Waiting for the bot…" : result ? result.message : dirty ? "You have unsaved changes." : "Everything is saved."}
        </p>
      </div>
    </div>
  );
}
