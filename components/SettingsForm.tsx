"use client";

import { useRouter } from "next/navigation";
import { useState, type Dispatch, type SetStateAction } from "react";
import { saveSettings } from "@/app/actions/settings";
import type { Role } from "@/lib/store";

const MAX = 10;

function RolePicker({ title, hint, roles, selected, onToggle }: {
  title: string; hint: string; roles: Role[]; selected: string[]; onToggle: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const shown = roles.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="glass p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-white">{title}</h3>
        <span className="text-xs text-zinc-500">{selected.length}/{MAX} selected</span>
      </div>
      <p className="mt-1 text-sm text-zinc-400">{hint}</p>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search roles"
             aria-label={`Search ${title}`}
             className="mt-4 w-full rounded-xl border border-white/10 bg-ink-900/60 px-3 py-2 text-sm text-white outline-none transition focus:border-zen-400/60" />
      <div className="mt-3 flex max-h-56 flex-wrap gap-2 overflow-y-auto pr-1">
        {shown.map((r) => {
          const on = selected.includes(r.id);
          const locked = !r.assignable && !on;
          const full = !on && selected.length >= MAX;
          return (
            <button key={r.id} type="button" aria-pressed={on} disabled={locked || full} onClick={() => onToggle(r.id)}
                    title={locked ? "Above my highest role. Move the Zenvyx role higher in Discord." : undefined}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition duration-150 ${
                      on ? "border-zen-400/60 bg-zen-600/25 text-white"
                         : "border-white/10 text-zinc-300 hover:border-zen-400/40 hover:bg-white/5"
                    } disabled:cursor-not-allowed disabled:opacity-40`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color || "#6b7280" }} />
              {r.name}
              {locked && <span aria-hidden="true">🔒</span>}
            </button>
          );
        })}
        {shown.length === 0 && <p className="text-sm text-zinc-500">No roles match.</p>}
      </div>
    </div>
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

      <div className="glass p-5">
        <h3 className="font-display text-base font-semibold text-white">Prefix</h3>
        <p className="mt-1 text-sm text-zinc-400">The character(s) members type before a command in this server.</p>
        <input value={prefix} onChange={(e) => setPrefix(e.target.value)} maxLength={5} aria-label="Prefix"
               className="mt-4 w-32 rounded-xl border border-white/10 bg-ink-900/60 px-3 py-2 font-mono text-white outline-none transition focus:border-zen-400/60" />
        {!valid && <p className="mt-2 text-xs text-rose-300">1-5 characters, no spaces.</p>}
      </div>

      <RolePicker title="Member autoroles" hint="Given to every human who joins." roles={props.roles} selected={humans} onToggle={toggle(setHumans)} />
      <RolePicker title="Bot autoroles" hint="Given to every bot that is added." roles={props.roles} selected={bots} onToggle={toggle(setBots)} />

      <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-ink-800/90 p-4 backdrop-blur-xl">
        <button type="button" onClick={save} disabled={!dirty || !valid || pending} className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
          {pending ? "Saving…" : "Save changes"}
        </button>
        {dirty && !pending && (
          <button type="button" className="btn-ghost" onClick={() => { setPrefix(base.prefix); setHumans(base.humans); setBots(base.bots); setResult(null); }}>
            Reset
          </button>
        )}
        <p aria-live="polite" className={`text-sm ${result ? (result.ok ? "text-emerald-300" : "text-rose-300") : "text-zinc-500"}`}>
          {pending ? "Waiting for the bot…" : result ? result.message : dirty ? "You have unsaved changes." : "Everything is saved."}
        </p>
      </div>
    </div>
  );
}
