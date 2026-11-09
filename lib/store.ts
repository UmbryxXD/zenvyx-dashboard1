import "server-only";
import { cache } from "react";
import { env } from "./env";

export type Role = { id: string; name: string; color: string | null; position: number; assignable: boolean };
export type Channel = { id: string; name: string; type: "text" | "category"; parent?: string | null };
export type Overview = {
  guild: { id: string; name: string; icon: string | null; member_count: number; text_channels: number; voice_channels: number; categories: number; roles: number; boosts: number };
  bot: { latency_ms: number | null; started_at: number; guild_count: number; command_count: number; module_count: number };
  prefix: string | null;
  settings?: { prefix: string | null; nickname?: string | null; autorole: { humans: string[]; bots: string[] } };
  roles?: Role[];
  channels?: Channel[];
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
const snapshotsOnce = cache((joined: string) => fetchSnapshots(joined ? joined.split(",") : []));
export const getSnapshots = (ids: string[]): Promise<Snapshot[]> => snapshotsOnce(ids.join(","));

async function fetchSnapshots(ids: string[]): Promise<Snapshot[]> {
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

export type JobState = { status: string; result: string | null };

async function rest<T>(method: string, path: string, body?: unknown, prefer?: string): Promise<T> {
  const base = env("SUPABASE_URL").replace(/\/+$/, "");
  let res: Response;
  try {
    res = await fetch(`${base}/rest/v1/${path}`, {
      method,
      headers: { ...headers(), ...(prefer ? { Prefer: prefer } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new StoreError("Can't reach the database.");
  }
  if (res.status === 404) throw new StoreError("A database table is missing. Run the latest supabase_setup.sql in Supabase.");
  if (!res.ok) throw new StoreError(`Database error (${res.status}).`);
  const text = await res.text();
  return (text ? JSON.parse(text) : []) as T;
}

export async function countPendingJobs(userId: string): Promise<number> {
  const rows = await rest<unknown[]>("GET", `zx_jobs?user_id=eq.${encodeURIComponent(userId)}&status=in.(pending,working)&select=id`);
  return rows.length;
}

/** Queue an action for the bot. The bot re-checks the user's permissions before doing anything. */
export async function createJob(guildId: string, userId: string, kind: string, payload: unknown): Promise<number> {
  const rows = await rest<{ id: number }[]>("POST", "zx_jobs", { guild_id: guildId, user_id: userId, kind, payload }, "return=representation");
  return rows[0].id;
}

export async function waitForJob(id: number, timeoutMs = 20000): Promise<JobState> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const [row] = await rest<JobState[]>("GET", `zx_jobs?id=eq.${id}&select=status,result`);
    if (row && (row.status === "done" || row.status === "error")) return row;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return { status: "pending", result: null };
}

// ---------------------------------------------------------------- feature data
export type PanelOption = { label: string; emoji?: string; type: string; description?: string };
export type PanelQuestion = { label: string; style: string; required: boolean; placeholder?: string };
export type PanelConfig = {
  name?: string; type: "normal" | "form" | "multiple"; title: string; description: string; color: string;
  author_name?: string; author_icon_url?: string; thumbnail_url?: string; banner_url?: string; footer?: string;
  options: PanelOption[]; questions?: PanelQuestion[];
};
export type TicketsData = {
  config: { enabled: boolean; category_id: string | null; log_channel_id: string | null; transcript_channel_id: string | null };
  staff_roles: string[];
  panels: { name: string; status: string; updated_at: string; config: PanelConfig }[];
  recent: { id: number; user: string; category: string; status: string; claimed_by: string; created_at: string }[];
  stats: { total: number; open: number; per_day: { date: string; count: number }[]; top_claimers: { name: string; count: number }[] };
};
export type StaffAppsData = {
  config: { enabled: boolean; result_channel_id: string | null; ping_role_id: string | null; accept_role_id: string | null; log_channel_id: string | null };
  questions: string[];
  history: { id: number; applicant: string; reviewer: string; accepted: boolean; note: string; decided_at: string }[];
  stats: { accepted: number; denied: number };
};
export type AppealsData = {
  config: { channel_id: string | null; cooldown_hours: number; strict: boolean; posted: boolean };
  recent: { id: number; user: string; status: string; created_at: string }[];
  ai_status: Record<string, number>;
  open: number;
  total: number;
};

export type ModerationCommand = { name: string; root: string; category: "Moderation" | "AutoMod"; description: string; signature: string; usage: string; aliases: string[]; enabled: boolean; permission: string };
export type ModerationRule = { key: string; label: string; enabled: boolean; action: string; summary: string; config: Record<string, unknown> };
export type RoleAccess = {
  available: boolean;
  staff_roles: string[];
  grants: Record<string, string[]>;
  catalog: { category: string; emoji: string; blurb: string; commands: { name: string; description: string }[] }[];
  presets: Record<string, string[]>;
};
export type ModerationData = {
  commands: ModerationCommand[];
  role_access?: RoleAccess;
  modlog_channel_id: string | null;
  cases: { case_id: number; user_id: string; user_name: string; moderator_id: string; moderator_name: string; action: string; reason: string; duration: string | null; created_at: string; expires_at: string | null; active: boolean }[];
  automod: { enabled: boolean; bypass_staff: boolean; scan_edits: boolean; log_channel_id: string | null; rules: ModerationRule[];
    incidents: { id: number; user_id: string; rule: string; action: string; outcome: string; created_at: string }[] };
};

export type AuditRow = { id: number; user_name: string | null; kind: string; summary: string | null; created_at: string };

export async function getData<T>(guildId: string, key: "tickets" | "staffapps" | "appeals" | "moderation"): Promise<{ data: T; updated_at: string } | null> {
  if (!/^\d{5,25}$/.test(guildId)) return null;
  const [row] = await rest<{ data: T; updated_at: string }[]>("GET", `zx_data?guild_id=eq.${guildId}&key=eq.${key}&select=data,updated_at`);
  return row ?? null;
}

export async function getAudit(guildId: string): Promise<AuditRow[]> {
  if (!/^\d{5,25}$/.test(guildId)) return [];
  return rest<AuditRow[]>("GET", `zx_audit?guild_id=eq.${guildId}&order=id.desc&limit=100&select=id,user_name,kind,summary,created_at`);
}


/** Per-user cache of the Discord server list, so we don't hit Discord on every page load. */
export async function getUserGuilds(userId: string): Promise<{ guilds: unknown[]; fetchedAt: number } | null> {
  try {
    const rows = await rest<{ guilds: unknown[]; fetched_at: string }[]>("GET", `zx_users?user_id=eq.${encodeURIComponent(userId)}&select=guilds,fetched_at`);
    if (!rows[0]) return null;
    return { guilds: rows[0].guilds, fetchedAt: new Date(rows[0].fetched_at).getTime() };
  } catch {
    return null; // table missing or DB hiccup: caller falls back to Discord directly
  }
}

export async function putUserGuilds(userId: string, guilds: unknown[]): Promise<void> {
  try {
    await rest("POST", "zx_users?on_conflict=user_id", { user_id: userId, guilds, fetched_at: new Date().toISOString() }, "resolution=merge-duplicates,return=minimal");
  } catch {
    /* cache is optional */
  }
}
