import { ModerationView } from "@/components/ModerationView";
import { PageHeader } from "@/components/PageHeader";
import { guard } from "@/lib/guard";
import { getData, type ModerationData } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function Page({ params }: { params: { guildId: string } }) {
  const g = await guard(params.guildId);
  if (!g.ok) return g.view;
  const result = await getData<ModerationData>(params.guildId, "moderation").catch(() => null);
  return (
    <div className="space-y-6">
      <PageHeader icon="shield" title="Moderation Center" subtitle={`${g.data.guild.name} · manage commands, AutoMod and moderation activity`} />
      {!result ? (
        <div className="glass p-6 text-sm text-zinc-300">Waiting for the bot to publish moderation data. Make sure Zenvyx is online and refresh in a moment.</div>
      ) : <ModerationView guildId={params.guildId} data={result.data} prefix={g.data.prefix || "?"} channels={g.data.channels || []} roles={g.data.roles || []} />}
    </div>
  );
}
