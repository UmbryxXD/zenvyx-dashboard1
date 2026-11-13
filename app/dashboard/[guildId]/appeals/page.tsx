import { AppealsView } from "@/components/AppealsView";
import { PageHeader } from "@/components/PageHeader";
import { feature } from "@/lib/guard";
import { getData, type AppealsData, type TicketsData } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function Page({ params }: { params: { guildId: string } }) {
  const f = await feature<AppealsData>(params.guildId, "appeals", "appeal data");
  if (!f.ok) return f.view;
  const tickets = await getData<TicketsData>(params.guildId, "tickets").catch(() => null);
  const ready = { category: !!tickets?.data.config.category_id, staff: (tickets?.data.staff_roles.length ?? 0) > 0 };
  return (
    <div className="space-y-6">
      <PageHeader icon="scale" title="Appeals" subtitle={`${f.overview.guild.name} · rules, panel and history`} />
      <AppealsView guildId={params.guildId} data={f.data} channels={f.channels} ticketReady={ready} />
    </div>
  );
}
