import "server-only";
import { env } from "./env";

export type Overview = {
  guild: { id: string; name: string; icon: string | null; member_count: number; text_channels: number; voice_channels: number; categories: number; roles: number; boosts: number };
  bot: { latency_ms: number | null; started_at: number; guild_count: number; command_count: number; module_count: number };
  prefix: string | null;
  modules: { name: string; commands: number }[];
};
export type Snapshot = { guild_id: string; updated_at: string; data: Overview };

export class StoreError extends Error {}

function headers(): Record<string, string> {
  const key = env("SUPABASE_SERVICE_KEY");
  const h: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("eyJ")) h.Authorization = `Bearer ${key}`;
  return h;
}

/** Latest snapshots the bot uploaded for these servers. A server with no row = bot not added (or not synced yet). */
export async function getSnapshots(ids: string[]): Promise<Snapshot[]> {
  const clean = ids.filter((id) => /^\d{5,25}$/.test(id));
  if (!clean.length) return [];
  const base = env("SUPABASE_URL").replace(/\/+$/, "");
  let res: Response;
  try {
    res = await fetch(`${base}/rest/v1/zx_snapshots?guild_id=in.(${clean.join(",")})&select=guild_id,data,updated_at`, {
      headers: headers(),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new StoreError("Can't reach the database. Check SUPABASE_URL in Vercel.");
  }
  if (res.status === 401 || res.status === 403) throw new StoreError("The database refused the key. Check SUPABASE_SERVICE_KEY in Vercel.");
  if (res.status === 404) throw new StoreError("Table zx_snapshots was not found. Run supabase_setup.sql in Supabase.");
  if (!res.ok) throw new StoreError(`Database error (${res.status}).`);
  return (await res.json()) as Snapshot[];
}
