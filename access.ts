import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Session } from "./session";
import { getUserGuilds, putUserGuilds } from "./store";

export type DiscordGuild = { id: string; name: string; icon: string | null; owner: boolean; permissions: string };

const MANAGE = BigInt(0x28); // Administrator | Manage Server
const FRESH_MS = 5 * 60 * 1000; // trust the saved list this long
const STALE_MS = 24 * 60 * 60 * 1000; // use it this long if Discord is rate-limiting us

const onlyManageable = (all: DiscordGuild[]) => all.filter((g) => g.owner || (BigInt(g.permissions) & MANAGE) !== BigInt(0));

async function load(session: Session): Promise<{ guilds: DiscordGuild[]; error: string | null }> {
  const saved = await getUserGuilds(session.id);
  if (saved && Date.now() - saved.fetchedAt < FRESH_MS) return { guilds: onlyManageable(saved.guilds as DiscordGuild[]), error: null };

  let res: Response | null = null;
  try {
    res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    res = null;
  }
  if (res?.status === 401) redirect("/api/auth/login");
  if (res?.ok) {
    const all = (await res.json()) as DiscordGuild[];
    await putUserGuilds(session.id, all);
    return { guilds: onlyManageable(all), error: null };
  }
  // Discord said 429 / failed: fall back to the last list we saved (up to a day old) instead of showing an error.
  if (saved && Date.now() - saved.fetchedAt < STALE_MS) return { guilds: onlyManageable(saved.guilds as DiscordGuild[]), error: null };
  return { guilds: [], error: "Discord is busy right now. Wait a few seconds and refresh." };
}

/**
 * Servers the signed-in user can manage. Saved for 5 minutes (once per request in memory too) so
 * Discord isn't asked on every click. The bot still re-checks live permissions before doing anything.
 */
const once = cache((id: string, token: string) => load({ id, accessToken: token } as Session));
export const manageableGuilds = (session: Session) => once(session.id, session.accessToken);
