import { BloxView } from "@/components/BloxView";
import { PageHeader } from "@/components/PageHeader";
import { guard } from "@/lib/guard";
import { getData, type BloxData, type BloxValues } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function Page({ params }: { params: { guildId: string } }) {
  const g = await guard(params.guildId);
  if (!g.ok) return g.view;
  const [stock, values] = await Promise.all([
    getData<BloxData>(params.guildId, "blox").catch(() => null),
    getData<BloxValues>(params.guildId, "blox_values").catch(() => null),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader icon="gem" title="Blox Fruits" subtitle={`${g.data.guild.name} · dealer stock, trade calculator and fruit values`} />
      <BloxView guildId={params.guildId} stock={stock?.data ?? null} values={values?.data ?? { fruits: [], source: "", updated_by: "" }} channels={g.data.channels || []} roles={g.data.roles || []} />
    </div>
  );
}
