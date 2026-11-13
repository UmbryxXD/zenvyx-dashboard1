"use server";

import { manageableGuilds } from "@/lib/access";
import { getSession } from "@/lib/session";
import { countPendingJobs, createJob, StoreError, waitForJob } from "@/lib/store";

export type SaveInput = { guildId: string; prefix: string; nickname?: string; humans: string[]; bots: string[] };
export type SaveResult = { ok: boolean; message: string };

const ID = /^\d{5,25}$/;

export async function saveSettings(input: SaveInput): Promise<SaveResult> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Your session expired. Please log in again." };

  // Re-validate everything on the server. The browser is never trusted.
  if (!ID.test(input.guildId)) return { ok: false, message: "Invalid server." };
  const prefix = String(input.prefix ?? "");
  if (prefix.length < 1 || prefix.length > 5 || /\s/.test(prefix)) return { ok: false, message: "Prefix must be 1-5 characters with no spaces." };
  const nickname = String(input.nickname ?? "").trim();
  if (nickname.length > 32) return { ok: false, message: "Nickname must be 32 characters or fewer." };
  const clean = (list: unknown) =>
    Array.isArray(list) ? Array.from(new Set(list.map(String))).filter((x) => ID.test(x)) : [];
  const humans = clean(input.humans);
  const bots = clean(input.bots);
  if (humans.length > 10 || bots.length > 10) return { ok: false, message: "You can pick up to 10 autoroles per list." };

  const { guilds, error } = await manageableGuilds(session);
  if (error) return { ok: false, message: error };
  if (!guilds.some((g) => g.id === input.guildId)) return { ok: false, message: "You need Administrator or Manage Server in that server." };

  try {
    if ((await countPendingJobs(session.id)) >= 3) return { ok: false, message: "You have too many unfinished changes. Wait a few seconds and try again." };
    const id = await createJob(input.guildId, session.id, "settings.save", {
      prefix,
      nickname,
      autorole_humans: humans,
      autorole_bots: bots,
    });
    const job = await waitForJob(id);
    if (job.status === "done") return { ok: true, message: job.result || "Saved." };
    if (job.status === "error") return { ok: false, message: job.result || "The bot couldn't apply this." };
    return { ok: false, message: "The bot didn't answer in time. It may be offline. The change expires after 2 minutes, so check and try again." };
  } catch (e) {
    return { ok: false, message: e instanceof StoreError ? e.message : "Something went wrong." };
  }
}
