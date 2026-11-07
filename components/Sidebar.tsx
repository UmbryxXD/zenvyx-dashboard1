"use client";

import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import { Logo } from "./Logo";
import { avatarUrl } from "@/lib/format";

type Item = { label: string; icon: IconName; href?: string; live: boolean };
const ITEMS: Item[] = [
  { label: "Overview", icon: "grid", href: "", live: true },
  { label: "Server settings", icon: "sliders", href: "/settings", live: true },
  { label: "Moderation", icon: "shield", live: false },
  { label: "AI", icon: "sparkles", live: false },
  { label: "Music", icon: "music", live: false },
  { label: "Blox Fruits", icon: "gem", live: false },
  { label: "Appeals & reports", icon: "flag", live: false },
  { label: "Logs", icon: "scroll", live: false },
];

export function Sidebar({ guildId, guild, user }: {
  guildId: string;
  guild: { name: string; icon: string | null } | null;
  user: { id: string; name: string; avatar: string | null };
}) {
  const pathname = usePathname().replace(/\/+$/, "");

  return (
    <aside className="relative md:sticky md:top-0 md:flex md:h-screen md:w-72 md:shrink-0 md:flex-col md:border-r md:border-white/[0.06] md:bg-black/20 md:backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-4 md:px-6 md:py-7">
        <Logo />
        <a href="/servers" className="text-xs text-zinc-400 hover:text-violet-300 md:hidden">Servers</a>
      </div>

      {guild && (
        <a href="/servers" title="Switch server"
           className="group mx-3 mb-4 hidden items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-2.5 transition hover:border-violet-400/40 hover:bg-violet-500/10 md:flex">
          {guild.icon
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={guild.icon} alt="" className="h-10 w-10 rounded-xl ring-1 ring-white/10" />
            : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-700 font-display text-violet-300">{guild.name.slice(0, 1)}</span>}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{guild.name}</span>
            <span className="text-[11px] text-zinc-500">Switch server</span>
          </span>
          <Icon name="swap" className="h-4 w-4 text-zinc-500 transition group-hover:text-violet-300" />
        </a>
      )}

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-y-auto" aria-label="Dashboard sections">
        {ITEMS.map((item) => {
          const href = `/dashboard/${guildId}${item.href ?? ""}`;
          const active = pathname === href;
          const inner = (
            <>
              {active && <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-violet-400 shadow-[0_0_14px_2px_rgba(167,139,250,.9)]" />}
              <Icon name={item.icon} className={`h-[18px] w-[18px] shrink-0 transition ${active ? "text-violet-300" : ""}`} />
              <span className="flex-1">{item.label}</span>
              {!item.live && <span className="hidden rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide md:inline">Soon</span>}
            </>
          );
          return item.live ? (
            <a key={item.label} href={href} aria-current={active ? "page" : undefined}
               className={`relative flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200 ${
                 active ? "bg-gradient-to-r from-violet-600/25 to-transparent text-white" : "text-zinc-400 hover:translate-x-0.5 hover:bg-white/[0.05] hover:text-white"}`}>
              {inner}
            </a>
          ) : (
            <span key={item.label} className="relative flex cursor-not-allowed items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm text-zinc-600">
              {inner}
            </span>
          );
        })}
      </nav>

      <div className="mx-3 mb-4 mt-2 hidden items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-2.5 md:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl(user.id, user.avatar)} alt="" className="h-9 w-9 rounded-full ring-1 ring-violet-400/30" />
        <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{user.name}</span>
        <form action="/api/auth/logout" method="post">
          <button title="Log out" aria-label="Log out" className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-rose-300">
            <Icon name="logout" className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
