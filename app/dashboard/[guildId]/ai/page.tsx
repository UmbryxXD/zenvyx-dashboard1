import { AiView } from "@/components/AiView";
import { PageHeader } from "@/components/PageHeader";
import { guard } from "@/lib/guard";
import { getData, type AiData } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // teaching the AI a channel reads its message history

export default async function Page({ params }: { params: { guildId: string } }) {
  const g = await guard(params.guildId);
  if (!g.ok) return g.view;
  const result = await getData<AiData>(params.guildId, "ai").catch(() => null);
  return (
    <div className="space-y-6">
      <PageHeader icon="sparkles" title="AI" subtitle={`${g.data.guild.name} · AI moderation, reports and what the AI has learned`} />
      {!result ? (
        <div className="glass p-6 text-sm text-zinc-300">Waiting for the bot to publish AI data. Restart it with the latest <code>zenvyx_sync</code> folder, then refresh in a minute.</div>
      ) : !result.data.available ? (
        <div className="glass p-6 text-sm text-zinc-300">The AI assistant isn&apos;t loaded on the bot, so there is nothing to manage yet.</div>
      ) : (
        <AiView guildId={params.guildId} data={result.data} prefix={g.data.prefix || "?"} channels={g.data.channels || []} roles={g.data.roles || []} />
      )}
    </div>
  );
}
