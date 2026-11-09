import { redirect } from "next/navigation";
import { ErrorCard } from "@/components/ErrorCard";
import { Icon } from "@/components/Icon";
import { SettingsForm } from "@/components/SettingsForm";
import { manageableGuilds } from "@/lib/access";
import { getSession } from "@/lib/session";
import { getSnapshots, StoreError } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // saving waits for the bot to confirm

export default async function Page({ params }: { params: { guildId: string } }) {
  const session = await getSession();
  if (!session) redirect("/");
  if (!/^\d{5,25}$/.test(params.guildId)) redirect("/servers");

  const { guilds, error } = await manageableGuilds(session);
  if (error) return <ErrorCard title="Couldn't verify access" message={error} />;
  if (!guilds.some((g) => g.id === params.guildId)) {
    return <ErrorCard title="No access" message="You need Administrator or Manage Server in that server." />;
  }

  let snap;
  try {
    [snap] = await getSnapshots([params.guildId]);
  } catch (e) {
    return <ErrorCard title="Couldn't load settings" message={e instanceof StoreError ? e.message : "Could not load this server."} />;
  }
  const data = snap?.data;
  if (!snap || !data?.settings || !data.roles) {
    return <ErrorCard title="Waiting for Zenvyx" message="The bot hasn't reported this server's settings yet. Make sure it was restarted with the latest files, then refresh in a minute." />;
  }
  const online = Date.now() - Date.parse(snap.updated_at) < 180000;

  return (
    <div className="space-y-6">
      <header className="rise flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/25 shadow-[0_0_30px_-6px_rgba(139,92,246,.8)]">
          <Icon name="sliders" className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight"><span className="text-gradient">Server settings</span></h1>
          <p className="mt-0.5 text-sm text-zinc-400">{data.guild.name} · changes reach the bot within a few seconds.</p>
        </div>
      </header>
      <SettingsForm
        guildId={params.guildId}
        prefix={data.settings.prefix || "?"}
        nickname={data.settings.nickname || ""}
        humans={data.settings.autorole.humans}
        bots={data.settings.autorole.bots}
        roles={data.roles}
        online={online}
      />
    </div>
  );
}
