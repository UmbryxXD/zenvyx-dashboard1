"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon, type IconName } from "./Icon";
import { Badge, Section, useJob } from "./ui";

type Card = { id: string; name: string; icon: IconName; blurb: string; href?: string; toggle?: "tickets" | "staffapps"; state?: boolean | null; soon?: boolean };

export function ModulesView({ guildId, tickets, staffapps, loaded }: {
  guildId: string; tickets: boolean | null; staffapps: boolean | null; loaded: { name: string; commands: number }[];
}) {
  const base = `/dashboard/${guildId}`;
  const { pending, result, run } = useJob(guildId);
  const [state, setState] = useState<Record<string, boolean | null>>({ tickets, staffapps });
  const [busy, setBusy] = useState<string | null>(null);

  const flip = async (id: "tickets" | "staffapps", next: boolean) => {
    setBusy(id);
    const r = await run("modules.toggle", { module: id, enabled: next });
    if (r.ok) setState((s) => ({ ...s, [id]: next }));
    setBusy(null);
  };

  const cards: Card[] = [
    { id: "settings", name: "Server settings", icon: "sliders", blurb: "Prefix, bot nickname and autoroles.", href: `${base}/settings` },
    { id: "tickets", name: "Tickets", icon: "ticket", blurb: "Support panels, staff roles, transcripts and analytics.", href: `${base}/tickets`, toggle: "tickets", state: state.tickets },
    { id: "staffapps", name: "Staff applications", icon: "clipboard", blurb: "Application questions, review settings and history.", href: `${base}/applications`, toggle: "staffapps", state: state.staffapps },
    { id: "appeals", name: "Appeals", icon: "scale", blurb: "Ban/mute appeal rules, panel and decisions.", href: `${base}/appeals` },
    { id: "mod", name: "Moderation", icon: "shield", blurb: "Command controls, AutoMod rules, punishment tools and moderation activity.", href: `${base}/moderation` },
    { id: "ai", name: "AI", icon: "sparkles", blurb: "AI moderation, member Q&A (ask), reports and what the AI has learned.", href: `${base}/ai` },
    { id: "music", name: "Music", icon: "music", blurb: "Player controls, 24/7 mode and join-to-create voice rooms.", href: `${base}/music` },
    { id: "blox", name: "Blox Fruits", icon: "gem", blurb: "Dealer stock alerts, trade calculator and a fruit values list.", href: `${base}/blox` },
  ];

  return (
    <div className="space-y-6">
      <p aria-live="polite" className={`min-h-[1.25rem] text-sm ${result ? (result.ok ? "text-emerald-300" : "text-rose-300") : "text-zinc-500"}`}>
        {pending ? "Waiting for the bot…" : result ? result.message : "Switches apply within a few seconds."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div key={c.id} className={`glass flex flex-col p-4 sm:p-5 ${c.soon ? "opacity-60" : ""}`}>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20"><Icon name={c.icon} className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-semibold text-white">{c.name}</h3>
                <p className="mt-0.5 text-sm text-zinc-400">{c.blurb}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              {c.soon ? <Badge>Coming soon</Badge> : c.toggle ? (
                c.state === null || c.state === undefined ? <Badge tone="amber">Not reported yet</Badge> : (
                  <button type="button" role="switch" aria-checked={c.state} aria-label={`${c.name} on or off`} disabled={pending}
                          onClick={() => flip(c.toggle!, !c.state)}
                          className={`relative h-8 w-14 shrink-0 rounded-full border transition-colors disabled:opacity-60 ${c.state ? "border-violet-400/50 bg-violet-600" : "border-white/10 bg-white/10"}`}>
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${c.state ? "left-8" : "left-1"}`} />
                    {busy === c.toggle && <span className="sr-only">Saving</span>}
                  </button>
                )
              ) : <Badge tone="green">Always on</Badge>}
              {c.toggle && c.state !== null && c.state !== undefined && <span className="text-xs text-zinc-500">{c.state ? "Enabled" : "Disabled"}</span>}
              {c.href && <Link href={c.href} className="btn btn-ghost ml-auto !px-3 !py-1.5 text-sm"><Icon name="sliders" className="h-4 w-4" /> Settings</Link>}
            </div>
          </div>
        ))}
      </div>

      {loaded.length > 0 && (
        <Section icon="terminal" title="Loaded in the bot" hint="Command groups Zenvyx currently has running.">
          <div className="flex flex-wrap gap-2">
            {loaded.map((m) => <Badge key={m.name}>{m.name} · {m.commands}</Badge>)}
          </div>
        </Section>
      )}
    </div>
  );
}
