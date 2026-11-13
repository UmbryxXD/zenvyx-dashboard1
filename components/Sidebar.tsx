"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "./Icon";
import { Logo } from "./Logo";
import { avatarUrl } from "@/lib/format";

type Item = { label: string; icon: IconName; href?: string; live: boolean; module?: string };
const ITEMS: Item[] = [
  { label: "Overview", icon: "grid", href: "", live: true },
  { label: "Modules", icon: "puzzle", href: "/modules", live: true },
  { label: "Server settings", icon: "sliders", href: "/settings", live: true },
  { label: "Tickets", module: "tickets", icon: "ticket", href: "/tickets", live: true },
  { label: "Staff applications", module: "staffapps", icon: "clipboard", href: "/applications", live: true },
  { label: "Appeals", module: "appeals", icon: "scale", href: "/appeals", live: true },
  { label: "Change history", icon: "history", href: "/activity", live: true },
  { label: "Moderation", module: "moderation", icon: "shield", href: "/moderation", live: true },
  { label: "AI", module: "ai", icon: "sparkles", href: "/ai", live: true },

  { label: "Music", module: "music", icon: "music", href: "/music", live: true },
  { label: "Welcomer", module: "welcome", icon: "users", href: "/welcome", live: true },
  { label: "Embed builder", module: "embed", icon: "send", href: "/embeds", live: true },
  { label: "Blox Fruits", module: "blox", icon: "gem", href: "/blox", live: true },
];

export function Sidebar({ guildId, guild, user, off = [] }: {
  guildId: string;
  off?: string[];
  guild: { name: string; icon: string | null } | null;
  user: { id: string; name: string; avatar: string | null };
}) {
  const pathname = usePathname().replace(/\/+$/, "");
  const [open, setOpen] = useState(false);

  // close the phone menu after navigating, and on Escape
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  const nav = (
    <nav className="flex flex-col gap-1 px-3 pb-3 md:flex-1 md:overflow-y-auto" aria-label="Dashboard sections">
      {ITEMS.map((item) => {
        const href = `/dashboard/${guildId}${item.href ?? ""}`;
        const active = item.href ? pathname === href || pathname.startsWith(href + "/") : pathname === href;
        const inner = (
          <>
            {active && <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-violet-400" />}
            <Icon name={item.icon} className={`h-[18px] w-[18px] shrink-0 ${active ? "text-violet-300" : ""}`} />
            <span className="flex-1">{item.label}</span>
            {item.module && off.includes(item.module) && <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">Off</span>}
          </>
        );
        return item.live ? (
          <Link key={item.label} href={href} aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[44px] items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-gradient-to-r from-violet-600/25 to-transparent text-white" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"}`}>
            {inner}
          </Link>
        ) : (
          <span key={item.label} className="relative flex min-h-[44px] cursor-not-allowed items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm text-zinc-600">{inner}</span>
        );
      })}
    </nav>
  );

  const account = (
    <div className="mx-3 mb-4 mt-2 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatarUrl(user.id, user.avatar)} alt="" className="h-9 w-9 rounded-full ring-1 ring-violet-400/30" />
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{user.name}</span>
      <form action="/api/auth/logout" method="post">
        <button title="Log out" aria-label="Log out" className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-rose-300">
          <Icon name="logout" className="h-4 w-4" />
        </button>
      </form>
    </div>
  );

  const serverCard = guild && (
    <Link href="/servers" title="Switch server"
          className="group mx-3 mb-3 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-2.5 transition-colors hover:border-violet-400/40 hover:bg-violet-500/10">
      {guild.icon
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={guild.icon} alt="" className="h-10 w-10 rounded-xl ring-1 ring-white/10" />
        : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-700 font-display text-violet-300">{guild.name.slice(0, 1)}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-white">{guild.name}</span>
        <span className="text-[11px] text-zinc-500">Switch server</span>
      </span>
      <Icon name="swap" className="h-4 w-4 text-zinc-500 group-hover:text-violet-300" />
    </Link>
  );

  return (
    <>
      {/* phone / tablet: slim top bar + drawer */}
      <header className="sticky top-0 z-30 -mx-3 mb-3 flex items-center gap-2 border-b border-white/[0.07] bg-[#07040f] px-3 py-2 sm:-mx-4 sm:px-4 md:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-zinc-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <span className="min-w-0 flex-1 truncate text-center font-display text-sm font-semibold text-white">{guild?.name ?? "Zenvyx"}</span>
        <button type="button" onClick={() => window.dispatchEvent(new Event("zx:palette"))} aria-label="Search"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-zinc-200"><Icon name="search" className="h-5 w-5" /></button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => e.stopPropagation()}
               className="absolute inset-y-0 left-0 flex w-[19rem] max-w-[85vw] flex-col overflow-y-auto border-r border-white/10 bg-[#0b0716]">
            <div className="flex items-center justify-between px-4 py-4">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-white/5"><Icon name="x" className="h-5 w-5" /></button>
            </div>
            {serverCard}
            {nav}
            {account}
          </div>
        </div>
      )}

      {/* desktop sidebar */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-72 md:shrink-0 md:flex-col md:border-r md:border-white/[0.06] md:bg-black/30">
        <div className="px-6 py-7"><Logo /></div>
        {serverCard}
        <button type="button" onClick={() => window.dispatchEvent(new Event("zx:palette"))}
                className="mx-3 mb-3 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2 text-sm text-zinc-500 transition hover:border-violet-400/40 hover:text-zinc-300">
          <Icon name="search" className="h-4 w-4" /><span className="flex-1 text-left">Search…</span>
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
        </button>
        {nav}
        {account}
      </aside>
    </>
  );
}
