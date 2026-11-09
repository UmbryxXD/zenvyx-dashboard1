import { ErrorCard } from "@/components/ErrorCard";
import { PageHeader } from "@/components/PageHeader";
import { PanelEditor } from "@/components/PanelEditor";
import { feature } from "@/lib/guard";
import { template } from "@/lib/templates";
import type { TicketsData } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function Page({ params, searchParams }: { params: { guildId: string; name: string }; searchParams: { template?: string } }) {
  const f = await feature<TicketsData>(params.guildId, "tickets", "ticket data");
  if (!f.ok) return f.view;
  const name = decodeURIComponent(params.name);
  const back = (
    <a href={`/dashboard/${params.guildId}/tickets`} className="btn btn-ghost">← All panels</a>
  );

  if (name === "new") {
    const t = template(searchParams.template);
    return (
      <div className="space-y-6">
        <PageHeader icon="ticket" title="New panel" subtitle={`Template: ${t.name}`} action={back} />
        <PanelEditor key={t.id} guildId={params.guildId} mode="create" initialName="" initial={t.config} published={false} channels={f.channels} />
      </div>
    );
  }

  const panel = f.data.panels.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (!panel) return <ErrorCard title="Panel not found" message="It may have been deleted. Go back to the panel list." />;
  return (
    <div className="space-y-6">
      <PageHeader icon="ticket" title={panel.name} subtitle="Edit panel" action={back} />
      <PanelEditor key={panel.updated_at} guildId={params.guildId} mode="edit" initialName={panel.name} initial={panel.config} published={panel.status === "published"} channels={f.channels} />
    </div>
  );
}
