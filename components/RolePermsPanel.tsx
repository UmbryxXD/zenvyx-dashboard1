"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { Badge, Section, useJob } from "./ui";
import type { Role, RoleAccess } from "@/lib/store";

const sameSet = (a: Set<string>, b: string[]) => a.size === b.length && b.every((x) => a.has(x));

/** Role → command permissions. Only roles you ADD are listed; the picker for new roles scrolls and searches. */
export function RolePermsPanel({ guildId, access, roles, prefix }: { guildId: string; access?: RoleAccess; roles: Role[]; prefix: string }) {
  const router = useRouter();
  const { pending, result, run } = useJob(guildId);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<string | null>(null);

  const byId = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const added = useMemo(
    () => (access?.staff_roles ?? []).map((id) => byId.get(id)).filter((r): r is Role => !!r).sort((a, b) => b.position - a.position),
    [access, byId],
  );
  const saved = selected ? access?.grants[selected] ?? [] : [];
  const role = selected ? byId.get(selected) ?? null : null;
  const dirty = !!role && !sameSet(draft, saved);

  // Load the saved commands whenever another role is opened or the bot publishes new data.
  useEffect(() => { setDraft(new Set(saved)); }, [selected, access]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!category && access?.catalog[0]) setCategory(access.catalog[0].category); }, [access, category]);
  useEffect(() => { if (selected && !byId.has(selected)) setSelected(null); }, [selected, byId]);

  if (!access || !access.available) {
    return <div className="glass p-6 text-sm text-zinc-300">
      Role permissions aren&apos;t published by the bot yet. Update the bot with the new <code className="text-violet-200">zenvyx_sync</code> files, restart it, and refresh this page.
    </div>;
  }

  const toggle = (name: string, on: boolean) => setDraft((d) => { const n = new Set(d); if (on) n.add(name); else n.delete(name); return n; });
  const setMany = (names: string[], on: boolean) => setDraft((d) => { const n = new Set(d); names.forEach((x) => (on ? n.add(x) : n.delete(x))); return n; });

  const addRoles = async (ids: string[]) => {
    const r = await run("moderation.roleperm.add", { role_ids: ids }, false);
    if (r.ok) { setAdding(false); if (ids.length === 1) setSelected(ids[0]); router.refresh(); }
  };
  const save = async () => {
    if (!role) return;
    const r = await run("moderation.roleperm.save", { role_id: role.id, commands: [...draft] }, false);
    if (r.ok) router.refresh();
  };
  const remove = async () => {
    if (!role || !window.confirm(`Remove @${role.name} from this list and clear all of its command access?`)) return;
    const r = await run("moderation.roleperm.remove", { role_id: role.id }, false);
    if (r.ok) { setSelected(null); router.refresh(); }
  };

  const current = access.catalog.find((c) => c.category === category) ?? access.catalog[0];

  return (
    <div className="space-y-5">
      <Section icon="users" title="Role permissions" hint="Choose which role may use which moderation command. Add a role, tick its commands, press Save."
               aside={<button type="button" className="btn btn-primary !px-4 !py-2 text-sm" onClick={() => setAdding(true)} disabled={pending}><Icon name="plus" className="h-4 w-4" /> Add role</button>}>
        <p className="rounded-xl border border-white/[0.07] bg-black/20 p-3 text-xs leading-5 text-zinc-400">
          Once a command has a rule, only the roles ticked for it (plus the owner and Administrators) can use it. Commands with no rule keep their normal Discord-permission checks.
          Same data as <code className="text-violet-200">{prefix}roleperm</code> and <code className="text-violet-200">{prefix}modperms</code>.
        </p>
      </Section>

      {result && <p role="status" className={`text-sm ${result.ok ? "text-emerald-300" : "text-rose-300"}`}>{result.message}</p>}

      <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        {/* Added roles only */}
        <div className="glass p-3">
          <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Added roles ({added.length})</p>
          {added.length ? <ul className="max-h-[28rem] space-y-1 overflow-y-auto pr-1">
            {added.map((r) => {
              const n = access.grants[r.id]?.length ?? 0;
              return <li key={r.id}><button type="button" onClick={() => setSelected(r.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${selected === r.id ? "border-violet-400/40 bg-violet-500/15" : "border-transparent hover:bg-white/5"}`}>
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: r.color || "#71717a" }} />
                <span className="min-w-0 flex-1 truncate text-sm text-white">{r.name}</span>
                <Badge tone={n ? "violet" : "zinc"}>{n}</Badge>
              </button></li>;
            })}
          </ul> : <div className="p-4 text-center text-sm text-zinc-500">No roles added yet.<br />Press <b className="text-zinc-300">Add role</b> to start.</div>}
        </div>

        {/* Editor */}
        <div className="glass min-w-0 p-4 sm:p-5">
          {!role ? <div className="flex min-h-[16rem] flex-col items-center justify-center gap-3 text-center text-sm text-zinc-500">
            <Icon name="lock" className="h-8 w-8 text-violet-400/60" />
            <p>{added.length ? "Pick one of your added roles to edit what it can do." : "Add a role to choose which commands it can use."}</p>
          </div> : <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="h-4 w-4 rounded-full" style={{ background: role.color || "#71717a" }} />
              <h3 className="font-display text-lg font-semibold text-white">@{role.name}</h3>
              <Badge tone="violet">{draft.size} command{draft.size === 1 ? "" : "s"}</Badge>
              <button type="button" onClick={remove} disabled={pending} className="btn btn-ghost !px-3 !py-2 ml-auto text-xs text-rose-300"><Icon name="trash" className="h-3.5 w-3.5" /> Remove role</button>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Quick presets (adds commands)</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(access.presets).map(([name, cmds]) => <button key={name} type="button" onClick={() => setMany(cmds, true)} className="btn btn-ghost !px-3 !py-2 text-xs">{name}</button>)}
                <button type="button" onClick={() => setDraft(new Set())} className="btn btn-ghost !px-3 !py-2 text-xs">Clear all</button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {access.catalog.map((c) => {
                const have = c.commands.filter((x) => draft.has(x.name)).length;
                return <button key={c.category} type="button" onClick={() => setCategory(c.category)}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${current?.category === c.category ? "border-violet-400/40 bg-violet-500/15 text-violet-100" : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"}`}>
                  {c.emoji} {c.category} <span className="text-xs text-zinc-500">{have}/{c.commands.length}</span></button>;
              })}
            </div>

            {current && <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <p className="text-sm text-zinc-400">{current.blurb}</p>
                <span className="ml-auto flex gap-2">
                  <button type="button" onClick={() => setMany(current.commands.map((x) => x.name), true)} className="btn btn-ghost !px-3 !py-1.5 text-xs">Allow all</button>
                  <button type="button" onClick={() => setMany(current.commands.map((x) => x.name), false)} className="btn btn-ghost !px-3 !py-1.5 text-xs">Allow none</button>
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {current.commands.map((c) => {
                  const on = draft.has(c.name);
                  return <label key={c.name} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${on ? "border-violet-400/40 bg-violet-500/10" : "border-white/[0.07] bg-black/20 hover:border-white/20"}`}>
                    <input type="checkbox" checked={on} onChange={(e) => toggle(c.name, e.target.checked)} className="mt-1 accent-violet-500" />
                    <span className="min-w-0"><span className="block text-sm font-medium text-white">{prefix}{c.name}</span><span className="block text-xs text-zinc-500">{c.description}</span></span>
                  </label>;
                })}
              </div>
            </div>}

            <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-4">
              <button type="button" onClick={save} disabled={!dirty || pending} className="btn btn-primary">{pending ? "Saving…" : "Save changes"}</button>
              <button type="button" onClick={() => setDraft(new Set(saved))} disabled={!dirty || pending} className="btn btn-ghost">Discard</button>
              {dirty && <span className="text-xs text-amber-300">Not saved yet</span>}
            </div>
          </div>}
        </div>
      </div>

      {adding && <AddRoleDialog roles={roles} addedIds={new Set(access.staff_roles)} pending={pending} onClose={() => setAdding(false)} onAdd={addRoles} />}
    </div>
  );
}

/** Scrollable, searchable list of every server role that hasn't been added yet. */
function AddRoleDialog({ roles, addedIds, pending, onClose, onAdd }: { roles: Role[]; addedIds: Set<string>; pending: boolean; onClose: () => void; onAdd: (ids: string[]) => void }) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const list = roles.filter((r) => !addedIds.has(r.id) && r.name.toLowerCase().includes(query.trim().toLowerCase()));
  const flip = (id: string) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : p.length >= 10 ? p : [...p, id]);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Add roles" onClick={(e) => e.stopPropagation()} className="flex max-h-[88dvh] w-full flex-col rounded-t-3xl border border-white/10 bg-[#0d0818] p-5 shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1"><h2 className="font-display text-xl font-bold text-white">Add roles</h2><p className="mt-1 text-sm text-zinc-400">Scroll or search, then pick up to 10.</p></div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-white/5"><Icon name="x" /></button>
        </div>
        <label className="relative mt-4 block">
          <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search roles…" className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-violet-400/60" />
        </label>
        <ul className="mt-3 min-h-[8rem] flex-1 space-y-1 overflow-y-auto pr-1">
          {list.map((r) => {
            const on = picked.includes(r.id);
            return <li key={r.id}><label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition ${on ? "border-violet-400/40 bg-violet-500/15" : "border-transparent hover:bg-white/5"}`}>
              <input type="checkbox" checked={on} onChange={() => flip(r.id)} className="accent-violet-500" />
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: r.color || "#71717a" }} />
              <span className="min-w-0 flex-1 truncate text-sm text-white">{r.name}</span>
            </label></li>;
          })}
          {!list.length && <li className="p-6 text-center text-sm text-zinc-500">{query ? "No roles match your search." : "Every role has already been added."}</li>}
        </ul>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
          <button type="button" disabled={!picked.length || pending} onClick={() => onAdd(picked)} className="btn btn-primary flex-1">{pending ? "Adding…" : picked.length ? `Add ${picked.length} role${picked.length > 1 ? "s" : ""}` : "Add role"}</button>
        </div>
      </div>
    </div>, document.body);
}
