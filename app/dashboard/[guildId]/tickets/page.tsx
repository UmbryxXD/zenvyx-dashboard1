import { PageHeader } from "@/components/PageHeader";
import { TicketsView } from "@/components/TicketsView";
import { feature } from "@/lib/guard";
import type { TicketsData } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function Page({ params }: { params: { guildId: string } }) {
  const f = await feature<TicketsData>(params.guildId, "tickets", "ticket data");
  if (!f.ok) return f.view;
  return (
    <div className="space-y-6">
      <PageHeader icon="ticket" title="Tickets" subtitle={`${f.overview.guild.name} · panels, settings and analytics`} />
      <TicketsView guildId={params.guildId} data={f.data} channels={f.channels} roles={f.roles} />
    </div>
  );
}
