"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { submitJob, type JobResult } from "@/app/actions/jobs";
import type { Channel, Role } from "@/lib/store";
import { Icon, type IconName } from "./Icon";

export function Section({ icon, title, hint, aside, children }: { icon: IconName; title: string; hint?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="glass spot rise p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
          {hint && <p className="mt-0.5 text-sm text-zinc-400">{hint}</p>}
        </div>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Badge({ tone = "zinc", children }: { tone?: "zinc" | "green" | "red" | "violet" | "amber"; children: ReactNode }) {
  const tones = {
    zinc: "border-white/10 bg-white/[0.04] text-zinc-300", green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    red: "border-rose-400/25 bg-rose-500/10 text-rose-300", violet: "border-violet-400/30 bg-violet-500/15 text-violet-200",
    amber: "border-amber-400/25 bg-amber-500/10 text-amber-200",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${tones[tone]}`}>{children}</span>;
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; icon?: IconName }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.07] bg-black/20 p-1">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition duration-200 ${
                  value === t.id ? "bg-gradient-to-b from-violet-600/40 to-violet-600/20 text-white shadow-[0_0_24px_-8px_rgba(139,92,246,.9)]" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}>
          {t.icon && <Icon name={t.icon} className="h-4 w-4" />}{t.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div><p className="text-sm font-medium text-white">{label}</p>{hint && <p className="text-xs text-zinc-500">{hint}</p>}</div>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
              className={`relative h-7 w-12 shrink-0 rounded-full border transition duration-300 ${checked ? "border-violet-400/50 bg-violet-600 shadow-[0_0_20px_-4px_rgba(139,92,246,.9)]" : "border-white/10 bg-white/10"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${checked ? "left-6" : "left-0.5"}`} />
      </button>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:shadow-[0_0_0_4px_rgba(139,92,246,.15)]";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export function TextInput(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; max?: number; multiline?: boolean; rows?: number; disabled?: boolean }) {
  const { label, value, onChange, placeholder, hint, max, multiline, rows = 4, disabled } = props;
  return (
    <Field label={label} hint={hint}>
      {multiline
        ? <textarea className={`${inputCls} resize-y`} rows={rows} value={value} maxLength={max} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
        : <input className={inputCls} value={value} maxLength={max} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} />}
    </Field>
  );
}

export function Select({ label, value, onChange, options, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string; disabled?: boolean }[]; placeholder?: string; hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <select className={`${inputCls} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2214%22 height=%2214%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23a78bfa%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:14px] bg-[right_14px_center] bg-no-repeat pr-10`}
              value={value} onChange={(e) => onChange(e.target.value)}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export function ChannelSelect({ label, channels, kind, value, onChange, hint }: {
  label: string; channels: Channel[]; kind: "text" | "category"; value: string | null; onChange: (v: string | null) => void; hint?: string;
}) {
  const list = channels.filter((c) => c.type === kind);
  const missing = value && !list.some((c) => c.id === value);
  return (
    <Select label={label} hint={hint} value={value ?? ""} onChange={(v) => onChange(v || null)} placeholder="Not set"
            options={[...(missing ? [{ value: value!, label: "(deleted channel)" }] : []), ...list.map((c) => ({ value: c.id, label: kind === "text" ? `# ${c.name}${c.parent ? `  ·  ${c.parent}` : ""}` : c.name }))]} />
  );
}

export function RoleSelect({ label, roles, value, onChange, hint, needAssignable }: {
  label: string; roles: Role[]; value: string | null; onChange: (v: string | null) => void; hint?: string; needAssignable?: boolean;
}) {
  return (
    <Select label={label} hint={hint} value={value ?? ""} onChange={(v) => onChange(v || null)} placeholder="Not set"
            options={roles.map((r) => ({ value: r.id, label: `@${r.name}${needAssignable && !r.assignable ? "  (above my role)" : ""}`, disabled: needAssignable && !r.assignable && r.id !== value }))} />
  );
}

const SHOW_STEP = 60;

/** Selected roles as removable chips + an "Add roles" button that opens a popup (bottom sheet on phones). */
export function RoleChips({ roles, selected, onToggle, max = 10, needAssignable = false, title = "Choose roles" }: {
  roles: Role[]; selected: string[]; onToggle: (id: string) => void; max?: number; needAssignable?: boolean; title?: string;
}) {
  const [open, setOpen] = useState(false);
  const byId = new Map(roles.map((r) => [r.id, r]));
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {selected.map((id) => {
          const r = byId.get(id);
          return (
            <span key={id} className="inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-600/20 py-1 pl-3 pr-1 text-sm text-white">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: r?.color || "#6b7280" }} />
              <span className="max-w-[10rem] truncate">{r ? r.name : "(deleted role)"}</span>
              <button type="button" onClick={() => onToggle(id)} aria-label={`Remove ${r?.name ?? "role"}`}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-violet-200 hover:bg-white/10"><Icon name="x" className="h-3.5 w-3.5" /></button>
            </span>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost !px-3 !py-1.5 text-sm">
          <Icon name="plus" className="h-4 w-4" /> {selected.length ? "Edit roles" : "Add roles"}
        </button>
        <span className="ml-auto text-xs text-zinc-500">{selected.length}/{max}</span>
      </div>
      {open && <RolePopup title={title} roles={roles} selected={selected} onToggle={onToggle} max={max} needAssignable={needAssignable} onClose={() => setOpen(false)} />}
    </div>
  );
}

function RolePopup({ title, roles, selected, onToggle, max, needAssignable, onClose }: {
  title: string; roles: Role[]; selected: string[]; onToggle: (id: string) => void; max: number; needAssignable: boolean; onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(SHOW_STEP);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  if (!mounted) return null;

  const matches = roles.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));
  const shown = matches.slice(0, limit);
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
           className="flex max-h-[85dvh] w-full flex-col rounded-t-3xl border border-white/10 bg-[#0d0818] shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center gap-3 border-b border-white/[0.07] p-4">
          <h3 className="flex-1 font-display text-lg font-semibold text-white">{title}</h3>
          <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-zinc-300">{selected.length}/{max}</span>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-white/5"><Icon name="x" className="h-5 w-5" /></button>
        </div>
        <div className="p-4 pb-2">
          <label className="relative block">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input className={`${inputCls} pl-9`} value={query} onChange={(e) => { setQuery(e.target.value); setLimit(SHOW_STEP); }} placeholder="Search roles" aria-label="Search roles" autoFocus />
          </label>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {shown.map((r) => {
            const on = selected.includes(r.id);
            const locked = needAssignable && !r.assignable && !on;
            const full = !on && selected.length >= max;
            return (
              <li key={r.id}>
                <button type="button" disabled={locked || full} onClick={() => onToggle(r.id)} aria-pressed={on}
                        className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${on ? "border-violet-400 bg-violet-600" : "border-white/20"}`}>
                    {on && <Icon name="check" className="h-3.5 w-3.5 text-white" />}
                  </span>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color || "#6b7280" }} />
                  <span className="min-w-0 flex-1 truncate">{r.name}</span>
                  {locked && <span className="flex items-center gap-1 text-[11px] text-zinc-500"><Icon name="lock" className="h-3 w-3" /> above my role</span>}
                </button>
              </li>
            );
          })}
          {matches.length === 0 && <li className="px-3 py-6 text-center text-sm text-zinc-500">No roles match.</li>}
          {matches.length > limit && (
            <li className="p-2"><button type="button" className="btn btn-ghost w-full" onClick={() => setLimit((l) => l + SHOW_STEP)}>Show more ({matches.length - limit})</button></li>
          )}
        </ul>
        <div className="safe-b border-t border-white/[0.07] p-4 pb-3"><button type="button" onClick={onClose} className="btn btn-primary w-full">Done</button></div>
      </div>
    </div>,
    document.body,
  );
}

/** Chosen text channels as removable chips + a dropdown to add more. Light on phones (no popup needed). */
export function ChannelPicker({ channels, selected, onChange, max = 25, placeholder = "Add a channel…" }: {
  channels: Channel[]; selected: string[]; onChange: (ids: string[]) => void; max?: number; placeholder?: string;
}) {
  const text = channels.filter((c) => c.type === "text");
  const byId = new Map(text.map((c) => [c.id, c]));
  const free = text.filter((c) => !selected.includes(c.id));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selected.length === 0 && <span className="text-sm text-zinc-500">None selected.</span>}
        {selected.map((id) => (
          <span key={id} className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-600/20 py-1 pl-3 pr-1 text-sm text-white">
            <span className="max-w-[12rem] truncate"># {byId.get(id)?.name ?? "deleted-channel"}</span>
            <button type="button" onClick={() => onChange(selected.filter((x) => x !== id))} aria-label={`Remove ${byId.get(id)?.name ?? "channel"}`}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-violet-200 hover:bg-white/10"><Icon name="x" className="h-3.5 w-3.5" /></button>
          </span>
        ))}
      </div>
      {selected.length < max && (
        <select aria-label={placeholder} value="" onChange={(e) => e.target.value && onChange([...selected, e.target.value])} className={`${inputCls} max-w-sm`}>
          <option value="">{placeholder}</option>
          {free.map((c) => <option key={c.id} value={c.id}># {c.name}{c.parent ? `  ·  ${c.parent}` : ""}</option>)}
        </select>
      )}
    </div>
  );
}

export function SaveBar({ dirty, pending, result, onSave, onReset, disabled, saveLabel = "Save changes" }: {
  dirty: boolean; pending: boolean; result: JobResult | null; onSave: () => void; onReset?: () => void; disabled?: boolean; saveLabel?: string;
}) {
  return (
    <div className={`glass safe-b sticky bottom-2 z-10 flex flex-wrap items-center gap-3 p-3 sm:bottom-4 sm:gap-4 sm:p-4 ${dirty ? "glow-border" : ""}`}>
      <button type="button" onClick={onSave} disabled={!dirty || !!disabled || pending} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">
        {pending ? <><span className="spinner" /> Saving…</> : saveLabel}
      </button>
      {dirty && !pending && onReset && <button type="button" className="btn btn-ghost" onClick={onReset}>Reset</button>}
      <p aria-live="polite" className={`flex min-w-0 basis-full items-center gap-2 text-sm sm:basis-auto ${result ? (result.ok ? "text-emerald-300" : "text-rose-300") : "text-zinc-500"}`}>
        {result && <Icon name={result.ok ? "check" : "x"} className="pop h-4 w-4" />}
        {pending ? "Waiting for the bot…" : result ? result.message : dirty ? "You have unsaved changes." : "Everything is saved."}
      </p>
    </div>
  );
}

/** Sends one action to the bot and tracks progress. Refreshes the page data after a success. */
export function useJob(guildId: string) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<JobResult | null>(null);
  const run = async (kind: string, payload: unknown, refresh = true): Promise<JobResult> => {
    setPending(true);
    setResult(null);
    let r: JobResult;
    try {
      r = await submitJob({ guildId, kind, payload });
    } catch {
      r = { ok: false, message: "Couldn't reach the website server. Try again." };
    }
    setResult(r);
    setPending(false);
    if (r.ok && refresh) router.refresh();
    return r;
  };
  return { pending, result, run, setResult };
}

export const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export function Stat({ label, value, icon, hint }: { label: string; value: string | number; icon: IconName; hint?: string }) {
  return (
    <div className="glass spot p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20"><Icon name={icon} className="h-[18px] w-[18px]" /></span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-500"><Icon name={icon} /></span>
      <p className="font-medium text-zinc-300">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-zinc-500">{children}</p>}
    </div>
  );
}
