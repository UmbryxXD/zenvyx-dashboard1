"use server";

import { manageableGuilds } from "@/lib/access";
import { getSession } from "@/lib/session";
import { countPendingJobs, createJob, StoreError, waitForJob } from "@/lib/store";

export type JobResult = { ok: boolean; message: string };

const KINDS = new Set([
  "tickets.config.save", "tickets.panel.save", "tickets.panel.delete", "tickets.panel.publish",
  "staffapps.config.save", "appeals.config.save", "appeals.panel.publish", "modules.toggle",
  "moderation.command.toggle", "moderation.commands.bulk", "moderation.automod.master", "moderation.automod.option.save", "moderation.automod.rule.save", "moderation.automod.logging.save", "moderation.logs.save",
  "moderation.roleperm.add", "moderation.roleperm.save", "moderation.roleperm.remove",
]);

/** Queue one action for the bot. The bot validates the contents and re-checks permissions itself. */
export async function submitJob(input: { guildId: string; kind: string; payload: unknown }): Promise<JobResult> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Your session expired. Please log in again." };
  if (!/^\d{5,25}$/.test(input.guildId) || !KINDS.has(input.kind)) return { ok: false, message: "Invalid request." };
  if (JSON.stringify(input.payload ?? {}).length > 30000) return { ok: false, message: "That is too much data to save at once." };

  const { guilds, error } = await manageableGuilds(session);
  if (error) return { ok: false, message: error };
  if (!guilds.some((g) => g.id === input.guildId)) return { ok: false, message: "You need Administrator or Manage Server in that server." };

  try {
    if ((await countPendingJobs(session.id)) >= 3) return { ok: false, message: "You have too many unfinished changes. Wait a few seconds and try again." };
    const id = await createJob(input.guildId, session.id, input.kind, input.payload ?? {});
    const job = await waitForJob(id);
    if (job.status === "done") return { ok: true, message: job.result || "Saved." };
    if (job.status === "error") return { ok: false, message: job.result || "The bot couldn't apply this." };
    return { ok: false, message: "The bot didn't answer in time. It may be offline. The change expires after 2 minutes." };
  } catch (e) {
    return { ok: false, message: e instanceof StoreError ? e.message : "Something went wrong." };
  }
}
