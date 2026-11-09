"use client";

import { useRouter } from "next/navigation";
import { useState, type Dispatch, type SetStateAction } from "react";
import { saveSettings } from "@/app/actions/settings";
import type { Role } from "@/lib/store";
import { Icon } from "./Icon";
import { RoleChips, Section } from "./ui";

const MAX = 10;

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export function SettingsForm(props: {
  guildId: string; prefix: string; nickname: string; humans: string[]; bots: string[]; roles: Role[]; online: boolean;
}) {
  const router = useRouter();
  const [base, setBase] = useState({ prefix: props.prefix, nickname: props.nickname, humans: props.humans, bots: props.bots });
  const [prefix, setPrefix] = useState(props.prefix);
  const [nickname, setNickname] = useState(props.nickname);
  const [humans, setHumans] = useState(props.humans);
  const [bots, setBots] = useState(props.bots);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, setPending] = useState(false);

  const toggle = (set: Dispatch<SetStateAction<string[]>>) => (id: string) =>
    set((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const dirty = prefix !== base.prefix || nickname !== base.nickname || !same(humans, base.humans) || !same(bots, base.bots);
  const valid = prefix.length >= 1 && prefix.length <= 5 && !/\s/.test(prefix);

  const save = async () => {
    if (pending) return;
    setPending(true);
    setResult(null);
    try {
      const r = await saveSettings({ guildId: props.guildId, prefix, nickname, humans, bots });
      setResult(r);
      if (r.ok) {
        setBase({ prefix, nickname, humans, bots });
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

      <Section icon="sparkles" title="Bot nickname" hint="How Zenvyx is named in this server. Leave empty for the default name.">
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={32} aria-label="Bot nickname" placeholder="Zenvyx"
               className="w-full max-w-sm rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-violet-400/60 focus:shadow-[0_0_0_4px_rgba(139,92,246,.15)]" />
      </Section>

      <Section icon="users" title="Member autoroles" hint="Given to every human who joins." aside={<span className="shrink-0 text-xs text-zinc-500">{humans.length}/{MAX}</span>}>
        <RoleChips title="Member autoroles" roles={props.roles} selected={humans} onToggle={toggle(setHumans)} max={MAX} needAssignable />
      </Section>
      <Section icon="server" title="Bot autoroles" hint="Given to every bot that is added." aside={<span className="shrink-0 text-xs text-zinc-500">{bots.length}/{MAX}</span>}>
        <RoleChips title="Bot autoroles" roles={props.roles} selected={bots} onToggle={toggle(setBots)} max={MAX} needAssignable />
      </Section>

      <div className={`glass safe-b sticky bottom-2 z-10 flex flex-wrap items-center gap-3 p-3 sm:bottom-4 sm:gap-4 sm:p-4 ${dirty ? "glow-border" : ""}`}>
        <button type="button" onClick={save} disabled={!dirty || !valid || pending} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">
          {pending ? <><span className="spinner" /> Saving…</> : "Save changes"}
        </button>
        {dirty && !pending && (
          <button type="button" className="btn btn-ghost" onClick={() => { setPrefix(base.prefix); setNickname(base.nickname); setHumans(base.humans); setBots(base.bots); setResult(null); }}>
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
