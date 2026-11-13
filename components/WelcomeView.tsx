"use client";

import { useState } from "react";
import { DiscordEmbedPreview } from "./DiscordEmbedPreview";
import { ChannelSelect, Section, SaveBar, Select, TextInput, useJob } from "./ui";
import type { Channel, WelcomeData } from "@/lib/store";

const VARS = ["{user}", "{user_name}", "{user_nick}", "{user_id}", "{user_avatar}", "{user_joindate}", "{user_createdate}", "{server_name}", "{server_id}", "{server_membercount}", "{server_icon}", "{timestamp}"];
const SAMPLE: Record<string, string> = { user: "@NewMember", user_name: "newmember", user_nick: "New Member", user_id: "123456789012345678", user_avatar: "https://cdn.discordapp.com/embed/avatars/1.png", user_joindate: "Today", user_createdate: "Jan 01, 2024", server_name: "Your Server", server_id: "987654321098765432", server_membercount: "1,234", server_icon: "https://cdn.discordapp.com/embed/avatars/0.png", timestamp: "just now" };

const hexOf = (n: number) => `#${n.toString(16).padStart(6, "0")}`;
const intOf = (h: string) => (/^#[0-9a-fA-F]{6}$/.test(h) ? parseInt(h.slice(1), 16) : 0x9b5cff);

type Form = { type: "simple" | "embed"; channel: string | null; message: string; auto: string; embed: Record<string, string> & { color: string } };
const EMPTY = { message: "", title: "", description: "", footer_text: "", footer_icon: "", author_name: "", author_icon: "", thumbnail: "", image: "" };

function initial(d: WelcomeData): Form {
  const e = d.embed;
  return {
    type: d.type ?? "simple", channel: d.channel_id ?? null, message: d.message ?? "", auto: d.auto_delete ? String(d.auto_delete) : "",
    embed: { ...EMPTY, ...(e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== "color")) : {}), color: hexOf(e?.color ?? 0x4c1d95) } as Form["embed"],
  };
}

export function WelcomeView({ guildId, data, channels }: { guildId: string; data: WelcomeData; channels: Channel[] }) {
  const [base, setBase] = useState<Form>(() => initial(data));
  const [f, setF] = useState<Form>(base);
  const { pending, result, run } = useJob(guildId);
  const dirty = JSON.stringify(f) !== JSON.stringify(base);
  const setE = (k: string, v: string) => setF((p) => ({ ...p, embed: { ...p.embed, [k]: v } }));

  const save = async () => {
    const r = await run("welcome.save", {
      type: f.type, channel_id: f.channel, message: f.message, auto_delete: f.auto ? Number(f.auto) : 0,
      embed: { ...f.embed, color: intOf(f.embed.color) },
    });
    if (r.ok) setBase(f);
  };

  if (!data.available) return <Section icon="lock" title="Welcomer not available"><p className="text-sm text-zinc-400">The bot&apos;s welcomer isn&apos;t loaded in this server&apos;s bot right now.</p></Section>;

  return (
    <div className="space-y-6">
      <Section icon="users" title="Welcome message" hint="Posted in a channel whenever someone joins. This uses the same settings as the bot's greet commands.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Style" value={f.type} onChange={(v) => setF({ ...f, type: v as Form["type"] })} options={[{ value: "simple", label: "Simple text" }, { value: "embed", label: "Embed" }]} />
          <ChannelSelect label="Channel" kind="text" channels={channels} value={f.channel} onChange={(v) => setF({ ...f, channel: v })} />
          <TextInput label="Auto-delete after (seconds)" hint="Leave empty to keep it. 5 s to 7 days." value={f.auto} onChange={(v) => setF({ ...f, auto: v.replace(/\D/g, "").slice(0, 6) })} placeholder="Off" />
        </div>
        {f.type === "simple" ? (
          <div className="mt-4"><TextInput label="Message" multiline rows={4} max={2000} value={f.message} onChange={(v) => setF({ ...f, message: v })} placeholder="Welcome {user} to {server_name}!" /></div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><TextInput label="Text above the embed" max={2000} value={f.embed.message} onChange={(v) => setE("message", v)} placeholder="{user}" /></div>
            <TextInput label="Title" max={256} value={f.embed.title} onChange={(v) => setE("title", v)} />
            <label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">Colour</span><input type="color" value={f.embed.color} onChange={(e) => setE("color", e.target.value)} className="h-11 w-full cursor-pointer rounded-xl border border-white/10 bg-transparent" /></label>
            <div className="sm:col-span-2"><TextInput label="Description" multiline max={4096} value={f.embed.description} onChange={(v) => setE("description", v)} /></div>
            <TextInput label="Author name" max={256} value={f.embed.author_name} onChange={(v) => setE("author_name", v)} />
            <TextInput label="Author icon (https link)" value={f.embed.author_icon} onChange={(v) => setE("author_icon", v)} />
            <TextInput label="Footer text" max={2048} value={f.embed.footer_text} onChange={(v) => setE("footer_text", v)} />
            <TextInput label="Footer icon (https link)" value={f.embed.footer_icon} onChange={(v) => setE("footer_icon", v)} />
            <TextInput label="Thumbnail (https link)" value={f.embed.thumbnail} onChange={(v) => setE("thumbnail", v)} placeholder="{user_avatar}" />
            <TextInput label="Image (https link)" value={f.embed.image} onChange={(v) => setE("image", v)} />
          </div>
        )}
        <p className="mt-4 text-xs text-zinc-500">Placeholders: {VARS.join("  ")}</p>
      </Section>

      <Section icon="send" title="Preview" hint="Sample values are filled in. Real members' details are used when they join.">
        <DiscordEmbedPreview vars={SAMPLE} content={f.type === "simple" ? f.message : f.embed.message} embed={f.type === "embed" ? { ...f.embed, color: intOf(f.embed.color) } : null} />
      </Section>

      <Section icon="zap" title="Test and reset">
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-ghost" disabled={pending || dirty || !data.configured} onClick={() => run("welcome.test", {}, false)}>Send a test to the channel</button>
          <button className="btn btn-ghost" disabled={pending || !data.configured} onClick={() => { if (confirm("Remove the welcome message? New members won't be greeted.")) run("welcome.reset", {}); }}>Remove welcome message</button>
        </div>
        {dirty && <p className="mt-2 text-xs text-zinc-500">Save your changes before sending a test.</p>}
      </Section>

      <SaveBar dirty={dirty} pending={pending} result={result} onSave={save} onReset={() => setF(base)} />
    </div>
  );
}
