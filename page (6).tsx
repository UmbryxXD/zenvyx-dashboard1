import { ErrorCard } from "@/components/ErrorCard";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { guard } from "@/lib/guard";
import { getAudit, StoreError } from "@/lib/store";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  "settings.save": "Server settings", "tickets.config.save": "Ticket settings", "tickets.panel.save": "Panel saved",
  "tickets.panel.delete": "Panel deleted", "tickets.panel.publish": "Panel posted", "staffapps.config.save": "Staff applications",
  "appeals.config.save": "Appeal settings", "appeals.panel.publish": "Appeal panel",
};

export default async function Page({ params }: { params: { guildId: string } }) {
  const g = await guard(params.guildId);
  if (!g.ok) return g.view;
  let rows;
  try { rows = await getAudit(params.guildId); }
  catch (e) { return <ErrorCard title="Couldn't load history" message={e instanceof StoreError ? e.message : "Could not load history."} />; }

  return (
    <div className="space-y-6">
      <PageHeader icon="history" title="Change history" subtitle="Everything changed from this dashboard, newest first (kept for 90 days)." />
      <div className="glass rise p-2">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">No changes yet. When someone saves something here, it shows up in this list.</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {rows.map((r) => (
              <li key={r.id} className="flex items-start gap-4 p-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><Icon name="check" className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-200"><span className="font-medium text-white">{r.user_name || "Someone"}</span> · {LABELS[r.kind] ?? r.kind}</p>
                  <p className="mt-0.5 break-words text-sm text-zinc-400">{r.summary}</p>
                </div>
                <time className="shrink-0 text-xs text-zinc-500" dateTime={r.created_at}>{r.created_at.slice(0, 16).replace("T", " ")} UTC</time>
              </li>))}
          </ul>)}
      </div>
    </div>
  );
}
