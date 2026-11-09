import { ApplicationsView } from "@/components/ApplicationsView";
import { PageHeader } from "@/components/PageHeader";
import { feature } from "@/lib/guard";
import type { StaffAppsData } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function Page({ params }: { params: { guildId: string } }) {
  const f = await feature<StaffAppsData>(params.guildId, "staffapps", "staff application data");
  if (!f.ok) return f.view;
  return (
    <div className="space-y-6">
      <PageHeader icon="clipboard" title="Staff applications" subtitle={`${f.overview.guild.name} · questions, review settings and history`} />
      <ApplicationsView guildId={params.guildId} data={f.data} channels={f.channels} roles={f.roles} />
    </div>
  );
}
