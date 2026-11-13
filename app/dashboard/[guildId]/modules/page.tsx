import { ModulesView } from "@/components/ModulesView";
import { PageHeader } from "@/components/PageHeader";
import { guard } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function Page({ params }: { params: { guildId: string } }) {
  const g = await guard(params.guildId);
  if (!g.ok) return g.view;
  return (
    <div className="space-y-6">
      <PageHeader icon="puzzle" title="Modules" subtitle={`${g.data.guild.name} · choose which features this server uses`} />
      <ModulesView guildId={params.guildId} prefix={g.data.prefix || "?"} catalog={g.data.module_catalog ?? []} />
    </div>
  );
}
