import { redirect } from "next/navigation";
import { ErrorCard } from "@/components/ErrorCard";
import { manageableGuilds } from "@/lib/access";
import { getSession, type Session } from "@/lib/session";
import { getSnapshots, StoreError, type Overview } from "@/lib/store";
import type { ReactElement } from "react";

type Guard = { ok: true; session: Session; data: Overview; updatedAt: string } | { ok: false; view: ReactElement };

/** Every protected page starts here: logged in? allowed to manage this server? has the bot reported it? */
export async function guard(guildId: string): Promise<Guard> {
  const session = await getSession();
  if (!session) redirect("/");
  if (!/^\d{5,25}$/.test(guildId)) redirect("/servers");

  const { guilds, error } = await manageableGuilds(session);
  if (error) return { ok: false, view: <ErrorCard title="Couldn't verify access" message={error} /> };
  if (!guilds.some((g) => g.id === guildId)) {
    return { ok: false, view: <ErrorCard title="No access" message="You need Administrator or Manage Server in that server." /> };
  }
  try {
    const [snap] = await getSnapshots([guildId]);
    if (!snap) return { ok: false, view: <ErrorCard title="Waiting for Zenvyx" message="The bot hasn't reported this server yet. Make sure it's added and online, then refresh in a minute." /> };
    return { ok: true, session, data: snap.data, updatedAt: snap.updated_at };
  } catch (e) {
    return { ok: false, view: <ErrorCard title="Couldn't load server" message={e instanceof StoreError ? e.message : "Could not load this server."} /> };
  }
}

export const waitingForBot = (what: string) => (
  <ErrorCard title="Waiting for Zenvyx" message={`The bot hasn't reported ${what} yet. Restart it with the latest files, then refresh in a minute.`} />
);

import { getData } from "@/lib/store";
import type { Channel, Role } from "@/lib/store";

type FeatureOk<T> = { ok: true; session: Session; overview: Overview; data: T; roles: Role[]; channels: Channel[] };

/** guard() + the feature's own data (tickets / staffapps / appeals), with friendly errors. */
export async function feature<T>(guildId: string, key: "tickets" | "staffapps" | "appeals", label: string): Promise<FeatureOk<T> | { ok: false; view: ReactElement }> {
  const g = await guard(guildId);
  if (!g.ok) return g;
  try {
    const d = await getData<T>(guildId, key);
    if (!d || !g.data.roles || !g.data.channels) return { ok: false, view: waitingForBot(label) };
    return { ok: true, session: g.session, overview: g.data, data: d.data, roles: g.data.roles, channels: g.data.channels };
  } catch (e) {
    return { ok: false, view: <ErrorCard title="Couldn't load data" message={e instanceof StoreError ? e.message : "Could not load this page."} /> };
  }
}
