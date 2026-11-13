import { PageHeader } from "@/components/PageHeader";
import { WelcomeView } from "@/components/WelcomeView";
import { guard } from "@/lib/guard";
import { getData, type WelcomeData } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function Page({ params }: { params: { guildId: string } }) {
  const g = await guard(params.guildId);
  if (!g.ok) return g.view;
  const row = await getData<WelcomeData>(params.guildId, "welcome").catch(() => null);
  return (
    <div className="space-y-6">
      <PageHeader icon="users" title="Welcomer" subtitle={`${g.data.guild.name} · greet new members`} />
      <WelcomeView guildId={params.guildId} data={row?.data ?? { available: true, configured: false }} channels={g.data.channels || []} />
    </div>
  );
}
