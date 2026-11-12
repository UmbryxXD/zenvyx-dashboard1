"use client";

import { useState } from "react";
import { Icon, type IconName } from "./Icon";
import { Badge, ChannelSelect, Section, Select, Stat, useJob } from "./ui";
import { ago } from "@/lib/format";
import type { Channel, MusicData } from "@/lib/store";

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function MusicView({ guildId, data, age, channels }: { guildId: string; data: MusicData; age: number; channels: Channel[] }) {
  const p = data.player ?? null;
  const voice = data.voice_channels ?? [];
  const job = useJob(guildId);
  const [volume, setVolume] = useState(p?.volume ?? 100);
  const [stay, setStay] = useState<string>(data.stay_247?.channel_id ?? "");
  const [panelChannel, setPanelChannel] = useState<string | null>(data.jtc?.panel_channel?.id ?? null);

  const act = (action: string, extra: Record<string, unknown> = {}) => job.run("music.player", { action, ...extra });
  const btn = (action: string, label: string, icon: IconName, on = false, disabled = false) => (
    <button type="button" key={action} onClick={() => act(action)} disabled={job.pending || disabled} aria-pressed={on || undefined}
            className={`btn flex-col !gap-1 !px-3 !py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-40 ${on ? "btn-primary" : "btn-ghost"}`}>
      <Icon name={icon} className="h-5 w-5" /> {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Music server" value={data.nodes_online ? "Online" : "Offline"} icon="zap" hint={data.nodes_online ? "ready to play" : "players can't start"} />
        <Stat label="Player" value={p ? (p.paused ? "Paused" : p.playing ? "Playing" : "Idle") : "Not in voice"} icon="music" hint={p ? p.channel_name : "nobody is listening"} />
        <Stat label="Queue" value={p ? p.queue_length : 0} icon="scroll" hint="songs waiting" />
        <Stat label="24/7 mode" value={data.stay_247 ? "On" : "Off"} icon="clock" hint={data.stay_247?.channel_name ?? "bot leaves when idle"} />
      </div>

      {!data.nodes_online && (
        <p role="alert" className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          The bot can&apos;t reach its Lavalink music server right now, so songs won&apos;t play. The bot owner needs to check the Lavalink node.
        </p>
      )}

      <Section icon="music" title="Now playing" hint={`As of ${ago(age)} · controls update it right away`}
               aside={p ? <Badge tone={p.paused ? "amber" : "green"}>{p.paused ? "Paused" : p.playing ? "Playing" : "Idle"}</Badge> : <Badge>Idle</Badge>}>
        {!p ? (
          <p className="text-sm text-zinc-400">The bot isn&apos;t in a voice channel. Start a song with the play command and the controls appear here.</p>
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
              {p.current ? (
                <>
                  <p className="truncate font-display text-lg font-semibold text-white">{p.current.uri ? <a href={p.current.uri} target="_blank" rel="noopener noreferrer" className="hover:text-violet-300">{p.current.title}</a> : p.current.title}</p>
                  <p className="truncate text-sm text-zinc-400">{p.current.author}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400" style={{ width: `${p.current.length ? Math.min(100, (p.current.position / p.current.length) * 100) : 0}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500">{clock(p.current.position)} / {clock(p.current.length)} · {p.listeners} listening in {p.channel_name}</p>
                </>
              ) : <p className="text-sm text-zinc-400">Connected to {p.channel_name}, nothing playing.</p>}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {p.paused ? btn("resume", "Resume", "zap") : btn("pause", "Pause", "clock", false, !p.playing)}
              {btn("skip", "Skip", "arrow", false, !p.playing)}
              {btn("shuffle", "Shuffle", "swap", false, p.queue_length === 0)}
              {btn("loop", "Loop", "history", p.loop)}
              {btn("autoplay", "Autoplay", "sparkles", p.autoplay)}
              {btn("clear", "Clear queue", "trash", false, p.queue_length === 0)}
              <button type="button" onClick={() => window.confirm("Stop the music, clear the queue and make the bot leave voice?") && act("stop")} disabled={job.pending}
                      className="btn btn-ghost flex-col !gap-1 !px-3 !py-2.5 text-xs text-rose-300 disabled:opacity-40"><Icon name="x" className="h-5 w-5" /> Stop</button>
            </div>

            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-zinc-400" htmlFor="vol">
                <span>Volume</span><span className="text-white">{volume}%</span>
              </label>
              <div className="flex items-center gap-3">
                <input id="vol" type="range" min={1} max={150} value={volume} onChange={(e) => setVolume(+e.target.value)} className="h-2 w-full flex-1 accent-violet-500" />
                <button type="button" disabled={job.pending || volume === p.volume} onClick={() => act("volume", { value: volume })} className="btn btn-primary !py-2 disabled:opacity-40">Set</button>
              </div>
              {volume > 100 && <p className="mt-1 text-xs text-amber-300">Above 100% can sound distorted.</p>}
            </div>

            {p.queue.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Up next ({p.queue_length})</p>
                <ol className="space-y-1.5">
                  {p.queue.map((t, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-sm">
                      <span className="w-5 shrink-0 text-center text-xs text-zinc-500">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-zinc-200">{t.title}<span className="text-zinc-500"> · {t.author}</span></span>
                      <span className="shrink-0 text-xs text-zinc-500">{clock(t.length)}</span>
                    </li>
                  ))}
                </ol>
                {p.queue_length > p.queue.length && <p className="mt-2 text-xs text-zinc-500">…and {p.queue_length - p.queue.length} more.</p>}
              </div>
            )}
          </div>
        )}
        {job.result && <p aria-live="polite" className={`mt-4 text-sm ${job.result.ok ? "text-emerald-300" : "text-rose-300"}`}>{job.result.message}</p>}
      </Section>

      <Section icon="clock" title="24/7 mode" hint="Keep the bot sitting in one voice channel even when nobody is playing music."
               aside={<Badge tone={data.stay_247 ? "green" : "zinc"}>{data.stay_247 ? "On" : "Off"}</Badge>}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Select label="Voice channel" value={stay} onChange={setStay} placeholder="Choose a voice channel"
                    options={voice.map((c) => ({ value: c.id, label: `🔊 ${c.name}` }))} />
          </div>
          <button type="button" disabled={!stay || job.pending || stay === data.stay_247?.channel_id} onClick={() => job.run("music.247", { channel_id: stay })} className="btn btn-primary disabled:opacity-40">
            {data.stay_247 ? "Move" : "Turn on"}
          </button>
          {data.stay_247 && <button type="button" disabled={job.pending} onClick={() => { setStay(""); job.run("music.247", { channel_id: null }); }} className="btn btn-ghost">Turn off</button>}
        </div>
      </Section>

      <Section icon="users" title="Join-to-create voice rooms" hint="Members join one voice channel and get their own private room with a control panel. Rooms delete themselves when empty."
               aside={<Badge tone={data.jtc?.trigger ? "green" : "zinc"}>{data.jtc?.trigger ? "On" : "Off"}</Badge>}>
        {data.jtc?.trigger && (
          <p className="mb-4 text-sm text-zinc-300">Members join <b className="text-white">🔊 {data.jtc.trigger.name}</b>{data.jtc.category ? <> in <b className="text-white">{data.jtc.category.name}</b></> : null}.</p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <ChannelSelect label="Post the control panel in" kind="text" channels={channels} value={panelChannel} onChange={setPanelChannel} />
          </div>
          <button type="button" disabled={!panelChannel || job.pending} onClick={() => job.run("music.jtc.setup", { text_channel_id: panelChannel })} className="btn btn-primary disabled:opacity-40">
            {data.jtc?.trigger ? "Re-post panel" : "Set up"}
          </button>
          {data.jtc?.trigger && <button type="button" disabled={job.pending} onClick={() => window.confirm("Turn off join-to-create? Existing channels stay.") && job.run("music.jtc.off", {})} className="btn btn-ghost">Turn off</button>}
        </div>
        <p className="mt-3 text-xs text-zinc-500">Needs the Manage Channels permission. Setting it up creates the voice channel for you.</p>
      </Section>
    </div>
  );
}
