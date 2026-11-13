"use client";

import { useState } from "react";
import { DiscordEmbedPreview } from "./DiscordEmbedPreview";
import { ChannelSelect, Section, TextInput, Toggle, useJob } from "./ui";
import type { Channel } from "@/lib/store";

type F = { name: string; value: string; inline: boolean };
const intOf = (h: string) => (/^#[0-9a-fA-F]{6}$/.test(h) ? parseInt(h.slice(1), 16) : 0x9b5cff);

export function EmbedBuilder({ guildId, channels }: { guildId: string; channels: Channel[] }) {
  const [channel, setChannel] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [e, setE] = useState({ title: "", description: "", color: "#9b5cff", author_name: "", author_icon: "", footer_text: "", footer_icon: "", thumbnail: "", image: "", url: "" });
  const [timestamp, setTimestamp] = useState(false);
  const [fields, setFields] = useState<F[]>([]);
  const { pending, result, run } = useJob(guildId);
  const set = (k: keyof typeof e, v: string) => setE((p) => ({ ...p, [k]: v }));
  const setField = (i: number, patch: Partial<F>) => setFields((p) => p.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const send = () => run("embed.send", { channel_id: channel, content, embed: { ...e, color: intOf(e.color), fields, timestamp } }, false);

  return (
    <div className="space-y-6">
      <Section icon="send" title="Destination" hint="The bot posts this message as itself. Mentions in it never ping anyone.">
        <ChannelSelect label="Channel" kind="text" channels={channels} value={channel} onChange={setChannel} />
        <div className="mt-4"><TextInput label="Message text (optional)" multiline rows={2} max={2000} value={content} onChange={setContent} /></div>
      </Section>

      <Section icon="edit" title="Embed">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Title" max={256} value={e.title} onChange={(v) => set("title", v)} />
          <label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">Colour</span><input type="color" value={e.color} onChange={(ev) => set("color", ev.target.value)} className="h-11 w-full cursor-pointer rounded-xl border border-white/10 bg-transparent" /></label>
          <div className="sm:col-span-2"><TextInput label="Description" multiline max={4096} value={e.description} onChange={(v) => set("description", v)} /></div>
          <TextInput label="Title link (https)" value={e.url} onChange={(v) => set("url", v)} />
          <TextInput label="Author name" max={256} value={e.author_name} onChange={(v) => set("author_name", v)} />
          <TextInput label="Author icon (https)" value={e.author_icon} onChange={(v) => set("author_icon", v)} />
          <TextInput label="Footer text" max={2048} value={e.footer_text} onChange={(v) => set("footer_text", v)} />
          <TextInput label="Footer icon (https)" value={e.footer_icon} onChange={(v) => set("footer_icon", v)} />
          <TextInput label="Thumbnail (https)" value={e.thumbnail} onChange={(v) => set("thumbnail", v)} />
          <TextInput label="Image (https)" value={e.image} onChange={(v) => set("image", v)} />
        </div>
        <div className="mt-4"><Toggle checked={timestamp} onChange={setTimestamp} label="Show the current time in the footer" /></div>
      </Section>

      <Section icon="hash" title={`Fields (${fields.length}/25)`}>
        <div className="space-y-3">
          {fields.map((f, i) => (
            <div key={i} className="grid gap-3 rounded-xl border border-white/10 p-3 sm:grid-cols-2">
              <TextInput label="Name" max={256} value={f.name} onChange={(v) => setField(i, { name: v })} />
              <TextInput label="Value" max={1024} value={f.value} onChange={(v) => setField(i, { value: v })} />
              <Toggle checked={f.inline} onChange={(v) => setField(i, { inline: v })} label="Show beside other fields" />
              <button type="button" className="btn btn-ghost justify-self-end" onClick={() => setFields((p) => p.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          {fields.length < 25 && <button type="button" className="btn btn-ghost" onClick={() => setFields((p) => [...p, { name: "", value: "", inline: false }])}>Add a field</button>}
        </div>
      </Section>

      <Section icon="send" title="Preview"><DiscordEmbedPreview content={content} embed={{ ...e, color: intOf(e.color), fields }} /></Section>

      <div className="glass safe-b sticky bottom-2 z-10 flex flex-wrap items-center gap-3 p-3 sm:bottom-4 sm:p-4">
        <button className="btn btn-primary disabled:opacity-40" disabled={pending || !channel} onClick={send}>{pending ? <><span className="spinner" /> Sending…</> : "Send message"}</button>
        {!channel && <span className="text-xs text-zinc-500">Choose a channel first.</span>}
        {result && <span className={`text-sm ${result.ok ? "text-emerald-300" : "text-rose-300"}`}>{result.message}</span>}
      </div>
    </div>
  );
}
