"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { submitJob } from "@/app/actions/jobs";
import { Icon } from "./Icon";

// dashboard page -> module id
const PAGE_MODULE: Record<string, string> = { tickets: "tickets", applications: "staffapps", appeals: "appeals", moderation: "moderation", ai: "ai", music: "music", blox: "blox", welcome: "welcome", embeds: "embed" };

/** Shown on a module's page when that module is switched off in this server, with a one-click Turn on. */
export function ModuleBanner({ guildId, off }: { guildId: string; off: Record<string, string> }) {
  const segment = usePathname().split("/")[3] ?? "";
  const id = PAGE_MODULE[segment];
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!id || !off[id]) return null;

  const turnOn = async () => {
    setBusy(true); setError(null);
    const r = await submitJob({ guildId, kind: "modules.toggle", payload: { module: id, enabled: true } });
    setBusy(false);
    if (r.ok) router.refresh(); else setError(r.message);
  };
  return (
    <div role="status" className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <Icon name="lock" className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1"><b>{off[id]}</b> is turned off in this server. Its commands and automatic features are paused.</span>
      <button type="button" onClick={turnOn} disabled={busy} className="btn btn-primary !py-1.5 text-sm">{busy ? "Turning on…" : "Turn on"}</button>
      {error && <span className="basis-full text-rose-300">{error}</span>}
    </div>
  );
}
