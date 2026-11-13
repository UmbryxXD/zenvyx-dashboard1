import { EmbedBuilder } from "@/components/EmbedBuilder";
import { PageHeader } from "@/components/PageHeader";
import { guard } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { guildId: string } }) {
  const g = await guard(params.guildId);
  if (!g.ok) return g.view;
  return (
    <div className="space-y-6">
      <PageHeader icon="send" title="Embed builder" subtitle={`${g.data.guild.name} · design and send a message as the bot`} />
      <EmbedBuilder guildId={params.guildId} channels={g.data.channels || []} />
    </div>
  );
}
