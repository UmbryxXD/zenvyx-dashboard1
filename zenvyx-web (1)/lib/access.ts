import "server-only";
import { redirect } from "next/navigation";
import type { Session } from "./session";

export type DiscordGuild = { id: string; name: string; icon: string | null; owner: boolean; permissions: string };

const MANAGE = BigInt(0x28); // Administrator | Manage Server

/**
 * Servers the signed-in user can manage, straight from Discord (server-side, using their own token).
 * Never trust the browser for this: every protected page calls it again.
 */
export async function manageableGuilds(session: Session): Promise<{ guilds: DiscordGuild[]; error: string | null }> {
  const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  if (res.status === 401) redirect("/api/auth/login");
  if (!res.ok) return { guilds: [], error: "Discord is rate-limiting us. Refresh in a few seconds." };
  const all = (await res.json()) as DiscordGuild[];
  return { guilds: all.filter((g) => g.owner || (BigInt(g.permissions) & MANAGE) !== BigInt(0)), error: null };
}
