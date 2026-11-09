import { ModulesView } from "@/components/ModulesView";
import { PageHeader } from "@/components/PageHeader";
import { guard } from "@/lib/guard";
import { getData, type StaffAppsData, type TicketsData } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function Page({ params }: { params: { guildId: string } }) {
  const g = await guard(params.guildId);
  if (!g.ok) return g.view;
  const [tickets, apps] = await Promise.all([
    getData<TicketsData>(params.guildId, "tickets").catch(() => null),
    getData<StaffAppsData>(params.guildId, "staffapps").catch(() => null),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader icon="puzzle" title="Modules" subtitle={`${g.data.guild.name} · switch features on or off and jump to their settings`} />
      <ModulesView
        guildId={params.guildId}
        tickets={tickets ? tickets.data.config.enabled : null}
        staffapps={apps ? apps.data.config.enabled : null}
        loaded={g.data.modules}
      />
    </div>
  );
}
