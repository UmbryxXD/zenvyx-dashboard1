"use server";

import { manageableGuilds } from "@/lib/access";
import { getSession } from "@/lib/session";
import { addAudit, putData, StoreError } from "@/lib/store";

export type BloxSaveResult = { ok: boolean; message: string };

/** Save this server's fruit values list. Only people who can manage the server may do this. */
export async function saveBloxValues(input: { guildId: string; fruits: { name: string; value: number }[]; source: string }): Promise<BloxSaveResult> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Your session expired. Please log in again." };
  if (!/^\d{5,25}$/.test(input.guildId)) return { ok: false, message: "Invalid request." };
  const { guilds, error } = await manageableGuilds(session);
  if (error) return { ok: false, message: error };
  if (!guilds.some((g) => g.id === input.guildId)) return { ok: false, message: "You need Administrator or Manage Server in that server." };

  if (!Array.isArray(input.fruits) || input.fruits.length > 150) return { ok: false, message: "Too many fruits (150 max)." };
  const seen = new Set<string>();
  const fruits: { name: string; value: number }[] = [];
  for (const f of input.fruits) {
    const name = String(f?.name ?? "").trim().replace(/\s+/g, " ");
    const value = Number(f?.value);
    if (!name || name.length > 30) return { ok: false, message: "Each fruit needs a name of 1 to 30 characters." };
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000) return { ok: false, message: `"${name}": value must be a number from 0 up.` };
    if (seen.has(name.toLowerCase())) return { ok: false, message: `"${name}" is listed twice.` };
    seen.add(name.toLowerCase());
    fruits.push({ name, value: Math.round(value * 100) / 100 });
  }
  const source = String(input.source ?? "").trim().slice(0, 120);
  try {
    await putData(input.guildId, "blox_values", { fruits, source, updated_by: session.name });
    await addAudit(input.guildId, session.id, session.name, "blox.values.save", `Saved fruit values (${fruits.length} fruits)`);
    return { ok: true, message: `Saved ${fruits.length} fruit values.` };
  } catch (e) {
    return { ok: false, message: e instanceof StoreError ? e.message : "Something went wrong." };
  }
}
