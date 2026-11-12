import { MusicView } from "@/components/MusicView";
import { PageHeader } from "@/components/PageHeader";
import { guard } from "@/lib/guard";
import { getData, type MusicData } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function Page({ params }: { params: { guildId: string } }) {
  const g = await guard(params.guildId);
  if (!g.ok) return g.view;
  const result = await getData<MusicData>(params.guildId, "music").catch(() => null);
  return (
    <div className="space-y-6">
      <PageHeader icon="music" title="Music" subtitle={`${g.data.guild.name} · player controls, 24/7 mode and join-to-create rooms`} />
      {!result ? (
        <div className="glass p-6 text-sm text-zinc-300">Waiting for the bot to publish music data. Restart it with the latest <code>zenvyx_sync</code> folder, then refresh in a minute.</div>
      ) : !result.data.available ? (
        <div className="glass p-6 text-sm text-zinc-300">The music system isn&apos;t loaded on the bot, so there is nothing to manage yet.</div>
      ) : (
        <MusicView guildId={params.guildId} data={result.data} age={Math.max(0, Math.round((Date.now() - Date.parse(result.updated_at)) / 1000))} channels={g.data.channels || []} />
      )}
    </div>
  );
}
