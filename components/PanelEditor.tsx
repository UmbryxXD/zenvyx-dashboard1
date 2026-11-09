"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Channel, PanelConfig, PanelOption, PanelQuestion } from "@/lib/store";
import { EmbedPreview } from "./EmbedPreview";
import { Icon } from "./Icon";
import { Badge, ChannelSelect, Field, Section, Select, TextInput, Tabs, Toggle, SaveBar, useJob } from "./ui";

type Tab = "general" | "embed" | "buttons" | "form";
const TYPES = [
  { id: "normal", label: "Normal", hint: "One button opens a ticket." },
  { id: "form", label: "Form", hint: "Members fill a form first." },
  { id: "multiple", label: "Categories", hint: "Members pick a category." },
] as const;

export function PanelEditor({ guildId, mode, initialName, initial, published, channels }: {
  guildId: string; mode: "create" | "edit"; initialName: string; initial: PanelConfig; published: boolean; channels: Channel[];
}) {
  const router = useRouter();
  const { pending, result, run, setResult } = useJob(guildId);
  const publish = useJob(guildId);
  const start = { name: initialName, cfg: initial };
  const [base, setBase] = useState(JSON.stringify(start));
  const [name, setName] = useState(initialName);
  const [cfg, setCfg] = useState<PanelConfig>(initial);
  const [tab, setTab] = useState<Tab>("general");
  const [target, setTarget] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dirty = JSON.stringify({ name, cfg }) !== base;
  const set = <K extends keyof PanelConfig>(key: K, value: PanelConfig[K]) => setCfg((c) => ({ ...c, [key]: value }));
  const allowed = cfg.type === "multiple" ? ["normal", "staffapp"] : ["normal", "form", "staffapp"];
  const options = cfg.options;
  const questions = cfg.questions ?? [];

  const setType = (type: PanelConfig["type"]) =>
    setCfg((c) => {
      let opts = c.type === type ? c.options : c.options.map((o) => ({ ...o }));
      if (type !== "multiple") opts = opts.slice(0, 1);
      opts = opts.map((o) => (type === "form" && o.type === "normal" ? { ...o, type: "form" } : type !== "form" && o.type === "form" ? { ...o, type: "normal" } : o));
      const qs = type === "form" && !(c.questions && c.questions.length) ? [{ label: "What do you need help with?", style: "paragraph", required: true, placeholder: "" }] : c.questions;
      return { ...c, type, options: opts, questions: qs };
    });
  const setOption = (i: number, patch: Partial<PanelOption>) => set("options", options.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const setQuestion = (i: number, patch: Partial<PanelQuestion>) => set("questions", questions.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const moveQuestion = (i: number, d: number) => {
    const next = [...questions]; const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set("questions", next);
  };

  const save = async () => {
    const r = await run("tickets.panel.save", { create: mode === "create", name, config: cfg });
    if (r.ok) {
      setBase(JSON.stringify({ name, cfg }));
      if (mode === "create") router.replace(`/dashboard/${guildId}/tickets/panels/${encodeURIComponent(name)}`);
    }
  };
  const remove = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    const r = await run("tickets.panel.delete", { name: initialName }, false);
    if (r.ok) router.push(`/dashboard/${guildId}/tickets`);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: "General" }, { id: "embed", label: "Embed" }, { id: "buttons", label: cfg.type === "multiple" ? "Categories" : "Button" },
    ...(cfg.type === "form" ? [{ id: "form" as Tab, label: "Form" }] : []),
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />

        {tab === "general" && (
          <Section icon="sliders" title="General" hint="Name your panel and choose how members open tickets.">
            <div className="space-y-5">
              <TextInput label="Panel name" value={name} onChange={setName} max={40} disabled={mode === "edit"} placeholder="e.g. Support Panel"
                         hint={mode === "edit" ? "The name can't be changed after the panel is created." : "Only you and staff see this name."} />
              <div>
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">Panel type</span>
                <div className="grid gap-3 sm:grid-cols-3">
                  {TYPES.map((t) => (
                    <button key={t.id} type="button" onClick={() => setType(t.id)} aria-pressed={cfg.type === t.id}
                            className={`rounded-xl border p-4 text-left transition duration-200 ${cfg.type === t.id ? "border-violet-400/60 bg-violet-600/20 shadow-[0_0_24px_-8px_rgba(139,92,246,.9)]" : "border-white/10 bg-white/[0.02] hover:border-violet-400/40"}`}>
                      <p className="font-medium text-white">{t.label}</p><p className="mt-1 text-xs text-zinc-400">{t.hint}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        )}

        {tab === "embed" && (
          <Section icon="edit" title="Embed" hint="The message members see in Discord. The preview updates as you type.">
            <div className="space-y-4">
              <TextInput label="Title" value={cfg.title} onChange={(v) => set("title", v)} max={256} />
              <TextInput label="Description" value={cfg.description} onChange={(v) => set("description", v)} max={3000} multiline rows={5} hint="Use **bold** like in Discord." />
              <Field label="Color">
                <div className="flex items-center gap-3">
                  <input type="color" aria-label="Pick a color" value={/^[0-9a-fA-F]{6}$/.test(cfg.color) ? `#${cfg.color}` : "#9b5cff"}
                         onChange={(e) => set("color", e.target.value.slice(1).toUpperCase())} className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
                  <input className="w-32 rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 font-mono text-sm text-white outline-none focus:border-violet-400/60" value={cfg.color} maxLength={6}
                         onChange={(e) => set("color", e.target.value.replace("#", "").toUpperCase())} aria-label="Hex color" />
                </div>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Author name" value={cfg.author_name ?? ""} onChange={(v) => set("author_name", v)} max={256} />
                <TextInput label="Author icon URL" value={cfg.author_icon_url ?? ""} onChange={(v) => set("author_icon_url", v)} placeholder="https://…" />
                <TextInput label="Thumbnail URL" value={cfg.thumbnail_url ?? ""} onChange={(v) => set("thumbnail_url", v)} placeholder="https://…" />
                <TextInput label="Banner image URL" value={cfg.banner_url ?? ""} onChange={(v) => set("banner_url", v)} placeholder="https://…" />
              </div>
              <TextInput label="Footer" value={cfg.footer ?? ""} onChange={(v) => set("footer", v)} max={2048} />
            </div>
          </Section>
        )}

        {tab === "buttons" && (
          <Section icon="ticket" title={cfg.type === "multiple" ? "Categories" : "Button"} hint={cfg.type === "multiple" ? "Members choose one of these from a dropdown (1-5)." : "The button members press to open a ticket."}
                   aside={cfg.type === "multiple" && options.length < 5 ? (
                     <button type="button" className="btn btn-ghost !px-3 !py-1.5" onClick={() => set("options", [...options, { label: `Category ${options.length + 1}`, emoji: "🎫", type: "normal" }])}>
                       <Icon name="plus" className="h-4 w-4" /> Add
                     </button>) : undefined}>
            <div className="space-y-3">
              {options.map((o, i) => (
                <div key={i} className="grid gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-4 sm:grid-cols-[72px_1fr_1fr_auto]">
                  <TextInput label="Emoji" value={o.emoji ?? ""} onChange={(v) => setOption(i, { emoji: v })} max={80} />
                  <TextInput label="Name" value={o.label} onChange={(v) => setOption(i, { label: v })} max={80} />
                  <Select label="Opens" value={o.type} onChange={(v) => setOption(i, { type: v })}
                          options={allowed.map((t) => ({ value: t, label: t === "normal" ? "Ticket" : t === "form" ? "Form, then ticket" : "Staff application" }))} />
                  {cfg.type === "multiple" && options.length > 1 && (
                    <button type="button" aria-label="Remove category" onClick={() => set("options", options.filter((_, j) => j !== i))}
                            className="self-end rounded-xl p-2.5 text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-300"><Icon name="trash" className="h-4 w-4" /></button>
                  )}
                  {cfg.type === "multiple" && (
                    <div className="sm:col-span-4"><TextInput label="Description" value={o.description ?? ""} onChange={(v) => setOption(i, { description: v })} max={100} /></div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {tab === "form" && (
          <Section icon="clipboard" title="Form questions" hint="Members answer these before the ticket opens (up to 25)."
                   aside={questions.length < 25 ? (
                     <button type="button" className="btn btn-ghost !px-3 !py-1.5" onClick={() => set("questions", [...questions, { label: "", style: "short", required: true, placeholder: "" }])}>
                       <Icon name="plus" className="h-4 w-4" /> Add
                     </button>) : undefined}>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={i} className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
                    <TextInput label={`Question ${i + 1}`} value={q.label} onChange={(v) => setQuestion(i, { label: v })} max={45} />
                    <Select label="Answer" value={q.style} onChange={(v) => setQuestion(i, { style: v })} options={[{ value: "short", label: "Short" }, { value: "paragraph", label: "Paragraph" }]} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-end gap-4">
                    <div className="min-w-[200px] flex-1"><TextInput label="Placeholder" value={q.placeholder ?? ""} onChange={(v) => setQuestion(i, { placeholder: v })} max={100} /></div>
                    <div className="pb-1"><Toggle checked={q.required} onChange={(v) => setQuestion(i, { required: v })} label="Required" /></div>
                    <div className="flex gap-1 pb-1">
                      <button type="button" aria-label="Move up" onClick={() => moveQuestion(i, -1)} className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white"><Icon name="up" className="h-4 w-4" /></button>
                      <button type="button" aria-label="Move down" onClick={() => moveQuestion(i, 1)} className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white"><Icon name="down" className="h-4 w-4" /></button>
                      <button type="button" aria-label="Remove question" onClick={() => set("questions", questions.filter((_, j) => j !== i))} className="rounded-lg p-2 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300"><Icon name="trash" className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <SaveBar dirty={dirty} pending={pending} result={result} onSave={save} disabled={!name.trim()}
                 onReset={() => { setName(initialName); setCfg(initial); setResult(null); }} saveLabel={mode === "create" ? "Create panel" : "Save panel"} />
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Live preview {published && <Badge tone="green">published</Badge>}</p>
          <EmbedPreview config={cfg} />
        </div>

        {mode === "edit" && (
          <Section icon="send" title="Post to Discord" hint="Saving resets the panel to draft. Post it again so the message matches.">
            <div className="space-y-4">
              <ChannelSelect label="Channel" kind="text" channels={channels} value={target} onChange={setTarget} />
              <button type="button" className="btn btn-primary w-full" disabled={!target || dirty || publish.pending}
                      onClick={() => publish.run("tickets.panel.publish", { name: initialName, channel_id: target })}>
                {publish.pending ? <><span className="spinner" /> Posting…</> : "Post panel"}
              </button>
              {dirty && <p className="text-xs text-amber-300">Save your changes first.</p>}
              {publish.result && <p className={`text-sm ${publish.result.ok ? "text-emerald-300" : "text-rose-300"}`}>{publish.result.message}</p>}
              <button type="button" className={`btn w-full ${confirmDelete ? "bg-rose-600 text-white" : "btn-ghost !text-rose-300"}`} onClick={remove} onBlur={() => setConfirmDelete(false)}>
                <Icon name="trash" className="h-4 w-4" /> {confirmDelete ? "Click again to delete" : "Delete panel"}
              </button>
            </div>
          </Section>
        )}
      </aside>
    </div>
  );
}
