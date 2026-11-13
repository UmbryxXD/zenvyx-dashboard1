"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { TEMPLATES } from "@/lib/templates";
import { Icon, type IconName } from "./Icon";

type Item = { label: string; hint: string; href: string; icon: IconName };

export function CommandPalette({ guildId }: { guildId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const base = `/dashboard/${guildId}`;

  const items: Item[] = useMemo(() => [
    { label: "Overview", hint: "Server stats and bot status", href: base, icon: "grid" },
    { label: "Modules", hint: "Turn features on or off", href: `${base}/modules`, icon: "puzzle" },
    { label: "Server settings", hint: "Prefix and autoroles", href: `${base}/settings`, icon: "sliders" },
    { label: "Tickets", hint: "Panels, settings, analytics", href: `${base}/tickets`, icon: "ticket" },
    ...TEMPLATES.map((t) => ({ label: `New panel: ${t.name}`, hint: t.blurb, href: `${base}/tickets/panels/new?template=${t.id}`, icon: "plus" as IconName })),
    { label: "Staff applications", hint: "Questions, settings, history", href: `${base}/applications`, icon: "clipboard" },
    { label: "Moderation", hint: "Commands, AutoMod, role access, cases", href: `${base}/moderation`, icon: "shield" },
    { label: "AI", hint: "AI moderation, reports, learned channels", href: `${base}/ai`, icon: "sparkles" },
    { label: "Music", hint: "Player, 24/7, join-to-create", href: `${base}/music`, icon: "music" },
    { label: "Welcomer", hint: "Greet new members", href: `${base}/welcome`, icon: "users" },
    { label: "Embed builder", hint: "Send a custom embed", href: `${base}/embeds`, icon: "send" },
    { label: "Blox Fruits", hint: "Stock, trade calculator, values", href: `${base}/blox`, icon: "gem" },
    { label: "Appeals", hint: "Rules, panel, history", href: `${base}/appeals`, icon: "scale" },
    { label: "Change history", hint: "Who changed what", href: `${base}/activity`, icon: "history" },
    { label: "Switch server", hint: "Pick another server", href: "/servers", icon: "swap" },
  ], [base]);

  const shown = items.filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("zx:palette", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("zx:palette", onOpen); };
  }, []);

  useEffect(() => { if (open) { setQuery(""); setIndex(0); setTimeout(() => input.current?.focus(), 30); } }, [open]);
  useEffect(() => setIndex(0), [query]);

  const go = (item?: Item) => { if (!item) return; setOpen(false); router.push(item.href); };
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[15vh] backdrop-blur-sm" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Search">
      <div className="pop glass w-full max-w-lg overflow-hidden !bg-ink-900/95" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4">
          <Icon name="search" className="h-5 w-5 text-zinc-500" />
          <input ref={input} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Jump to a page or action…" aria-label="Search"
                 onKeyDown={(e) => {
                   if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => Math.min(i + 1, shown.length - 1)); }
                   else if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
                   else if (e.key === "Enter") go(shown[index]);
                 }}
                 className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-zinc-600" />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-500">ESC</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {shown.map((item, i) => (
            <li key={item.label}>
              <button type="button" onMouseEnter={() => setIndex(i)} onClick={() => go(item)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${i === index ? "bg-violet-600/20 text-white" : "text-zinc-300"}`}>
                <Icon name={item.icon} className={`h-4 w-4 ${i === index ? "text-violet-300" : "text-zinc-500"}`} />
                <span className="flex-1 text-sm">{item.label}</span>
                <span className="hidden text-xs text-zinc-500 sm:block">{item.hint}</span>
              </button>
            </li>))}
          {shown.length === 0 && <li className="p-6 text-center text-sm text-zinc-500">Nothing matches “{query}”.</li>}
        </ul>
      </div>
    </div>
  );
}
