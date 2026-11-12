"use client";

import { useEffect, useMemo, useState } from "react";
import { saveBloxValues } from "@/app/actions/blox";
import { Icon } from "./Icon";
import { ChannelSelect, RoleSelect, SaveBar, Section, Stat, Tabs, TextInput, Toggle, useJob } from "./ui";
import type { BloxData, BloxValues, Channel, Role } from "@/lib/store";

type Tab = "stock" | "calc" | "values";
type Fruit = { name: string; value: number };
type Line = { id: number; name: string; qty: number };

// Names only. Values change all the time, so they are never pre-filled: your staff enter them.
const FRUIT_NAMES = ["Rocket", "Spin", "Blade", "Spring", "Bomb", "Smoke", "Spike", "Flame", "Ice", "Sand", "Dark", "Eagle", "Diamond", "Light", "Rubber", "Ghost", "Magma", "Quake", "Buddha", "Love", "Creation", "Spider", "Sound", "Phoenix", "Portal", "Rumble", "Pain", "Blizzard", "Gravity", "Mammoth", "T-Rex", "Dough", "Shadow", "Venom", "Gas", "Spirit", "Control", "Dragon", "Leopard", "Kitsune", "Yeti"];
const FAIR = 0.05; // within 5% counts as fair

const countdown = (hours: number) => {
  const n = new Date();
  const into = (n.getUTCHours() % hours) * 3600 + n.getUTCMinutes() * 60 + n.getUTCSeconds();
  const left = hours * 3600 - into;
  const h = Math.floor(left / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
};
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

export function BloxView({ guildId, stock, values, channels, roles }: { guildId: string; stock: BloxData | null; values: BloxValues; channels: Channel[]; roles: Role[] }) {
  const [tab, setTab] = useState<Tab>("stock");
  const [list, setList] = useState<Fruit[]>(values.fruits);
  const [source, setSource] = useState(values.source);
  const [base, setBase] = useState({ fruits: values.fruits, source: values.source });
  const valueOf = useMemo(() => new Map(list.map((f) => [f.name.toLowerCase(), f.value])), [list]);

  return (
    <div className="space-y-6">
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: "stock", label: "Stock", icon: "clock" }, { id: "calc", label: "Trade calculator", icon: "swap" }, { id: "values", label: "Values", icon: "gem" }]} />
      {tab === "stock" && <StockTab guildId={guildId} stock={stock} channels={channels} roles={roles} valueOf={valueOf} />}
      {tab === "calc" && <CalcTab list={list.filter((f) => f.value > 0)} hasAny={list.length > 0} openValues={() => setTab("values")} />}
      {tab === "values" && <ValuesTab guildId={guildId} list={list} setList={setList} source={source} setSource={setSource} base={base} setBase={setBase} updatedBy={values.updated_by} />}
    </div>
  );
}

/* ------------------------------------------------------------------ stock */
function StockTab({ guildId, stock, channels, roles, valueOf }: { guildId: string; stock: BloxData | null; channels: Channel[]; roles: Role[]; valueOf: Map<string, number> }) {
  const job = useJob(guildId);
  const cfg = stock?.config;
  const [channel, setChannel] = useState<string | null>(cfg?.channel_id ?? null);
  const [nOn, setNOn] = useState(cfg?.normal_enabled ?? true);
  const [mOn, setMOn] = useState(cfg?.mirage_enabled ?? true);
  const [nRole, setNRole] = useState<string | null>(cfg?.normal_role_id ?? null);
  const [mRole, setMRole] = useState<string | null>(cfg?.mirage_role_id ?? null);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  if (!stock) return <div className="glass p-6 text-sm text-zinc-300">Waiting for the bot to publish Blox Fruits data. Restart it with the latest <code>zenvyx_sync</code> folder, then refresh in a minute.</div>;
  if (!stock.available) return <div className="glass p-6 text-sm text-zinc-300">The Blox Fruits system isn&apos;t loaded on the bot.</div>;

  const dirty = cfg ? channel !== cfg.channel_id || nOn !== cfg.normal_enabled || mOn !== cfg.mirage_enabled || nRole !== cfg.normal_role_id || mRole !== cfg.mirage_role_id : true;
  const market = (title: string, emoji: string, hours: number, fruits: string[]) => (
    <div className="glass flex flex-col p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-base font-semibold text-white">{emoji} {title}</h3>
        <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-xs text-violet-200" suppressHydrationWarning>{now ? countdown(hours) : "--h --m --s"}</span>
      </div>
      <p className="mt-0.5 text-xs text-zinc-500">Restocks every {hours} hours (UTC).</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {fruits.length === 0 && <span className="text-sm text-zinc-500">{stock.stock_known ? "Empty right now." : "No stock read yet."}</span>}
        {fruits.map((f) => {
          const v = valueOf.get(f.toLowerCase());
          return (
            <span key={f} className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-600/15 px-3 py-1.5 text-sm text-white">
              {f}{v ? <span className="text-xs text-violet-300">{fmt(v)}</span> : null}
            </span>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Normal dealer" value={(stock.normal ?? []).length} icon="gem" hint="fruits in stock" />
        <Stat label="Mirage dealer" value={(stock.mirage ?? []).length} icon="gem" hint="fruits in stock" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {market("Normal Dealer", "🛒", 4, stock.normal ?? [])}
        {market("Mirage Dealer", "🌙", 2, stock.mirage ?? [])}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={job.pending} onClick={() => job.run("blox.stock.refresh", {})} className="btn btn-ghost">
          {job.pending ? <><span className="spinner" /> Checking…</> : <><Icon name="swap" className="h-4 w-4" /> Refresh stock</>}
        </button>
        <span className="text-xs text-zinc-500">Stock comes from community wiki sites, so it can lag a little. Fruit numbers are from your Values tab.</span>
      </div>

      <Section icon="clock" title="Stock alerts" hint="The bot posts here when a dealer restocks. It checks every 5 minutes.">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2"><ChannelSelect label="Announcement channel" kind="text" channels={channels} value={channel} onChange={setChannel} /></div>
          <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
            <Toggle checked={nOn} onChange={setNOn} label="🛒 Normal dealer alerts" />
            <RoleSelect label="Ping role (optional)" roles={roles} value={nRole} onChange={setNRole} />
          </div>
          <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
            <Toggle checked={mOn} onChange={setMOn} label="🌙 Mirage dealer alerts" />
            <RoleSelect label="Ping role (optional)" roles={roles} value={mRole} onChange={setMRole} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" disabled={!dirty || job.pending} onClick={() => job.run("blox.stock.save", { channel_id: channel, normal_enabled: nOn, mirage_enabled: mOn, normal_role_id: nRole, mirage_role_id: mRole })}
                  className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40">Save alerts</button>
          {job.result && <p aria-live="polite" className={`text-sm ${job.result.ok ? "text-emerald-300" : "text-rose-300"}`}>{job.result.message}</p>}
        </div>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------- calculator */
function CalcTab({ list, hasAny, openValues }: { list: Fruit[]; hasAny: boolean; openValues: () => void }) {
  const [give, setGive] = useState<Line[]>([]);
  const [get, setGet] = useState<Line[]>([]);
  const [next, setNext] = useState(1);
  const byName = new Map(list.map((f) => [f.name, f.value]));
  const total = (lines: Line[]) => lines.reduce((s, l) => s + (byName.get(l.name) ?? 0) * l.qty, 0);
  const g1 = total(give), g2 = total(get);
  const diff = g2 - g1;
  const pct = g1 > 0 ? diff / g1 : null;

  if (list.length === 0) {
    return (
      <div className="glass p-6 text-sm text-zinc-300">
        <p>{hasAny ? "None of your fruits have a value above 0 yet." : "There are no fruit values yet."} The calculator uses the numbers from your Values tab.</p>
        <button type="button" onClick={openValues} className="btn btn-primary mt-4">Set up values</button>
      </div>
    );
  }

  const side = (title: string, lines: Line[], set: (l: Line[]) => void, sum: number) => (
    <div className="glass flex flex-col p-4 sm:p-5">
      <div className="flex items-baseline justify-between"><h3 className="font-display text-base font-semibold text-white">{title}</h3><span className="font-display text-xl text-violet-200">{fmt(sum)}</span></div>
      <ul className="mt-3 space-y-2">
        {lines.map((l) => (
          <li key={l.id} className="flex items-center gap-2">
            <select aria-label="Fruit" value={l.name} onChange={(e) => set(lines.map((x) => (x.id === l.id ? { ...x, name: e.target.value } : x)))}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/60">
              {list.map((f) => <option key={f.name} value={f.name}>{f.name} ({fmt(f.value)})</option>)}
            </select>
            <input aria-label="Quantity" type="number" inputMode="numeric" min={1} max={20} value={l.qty}
                   onChange={(e) => set(lines.map((x) => (x.id === l.id ? { ...x, qty: Math.max(1, Math.min(20, Math.round(+e.target.value) || 1)) } : x)))}
                   className="w-16 rounded-xl border border-white/10 bg-black/30 px-2 py-2.5 text-center text-sm text-white outline-none focus:border-violet-400/60" />
            <button type="button" aria-label="Remove" onClick={() => set(lines.filter((x) => x.id !== l.id))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-rose-300"><Icon name="x" className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      <button type="button" disabled={lines.length >= 8} onClick={() => { set([...lines, { id: next, name: list[0].name, qty: 1 }]); setNext(next + 1); }} className="btn btn-ghost mt-3 self-start !py-2 disabled:opacity-40">
        <Icon name="plus" className="h-4 w-4" /> Add fruit
      </button>
    </div>
  );

  let verdict: { label: string; tone: string; text: string } | null = null;
  if (g1 > 0 && g2 > 0 && pct !== null) {
    if (Math.abs(pct) <= FAIR) verdict = { label: "Fair trade", tone: "border-sky-400/30 bg-sky-500/10 text-sky-200", text: `Within ${FAIR * 100}% of each other (${diff >= 0 ? "+" : ""}${fmt(diff)}).` };
    else if (diff > 0) verdict = { label: "Win", tone: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200", text: `You get ${fmt(diff)} more (+${(pct * 100).toFixed(1)}%).` };
    else verdict = { label: "Loss", tone: "border-rose-400/30 bg-rose-500/10 text-rose-200", text: `You lose ${fmt(-diff)} (${(pct * 100).toFixed(1)}%).` };
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">{side("You give", give, setGive, g1)}{side("You get", get, setGet, g2)}</div>
      <div aria-live="polite" className={`rounded-2xl border px-5 py-4 ${verdict ? verdict.tone : "border-white/10 bg-black/20 text-zinc-400"}`}>
        {verdict ? <p><span className="font-display text-xl font-semibold">{verdict.label}</span> <span className="ml-2 text-sm">{verdict.text}</span></p> : <p className="text-sm">Add fruits to both sides to see the result.</p>}
      </div>
      <p className="text-xs text-zinc-500">Uses the numbers in your Values tab only. Real trades also depend on demand, so treat this as a guide.</p>
    </div>
  );
}

/* ----------------------------------------------------------------- values */
function ValuesTab({ guildId, list, setList, source, setSource, base, setBase, updatedBy }: {
  guildId: string; list: Fruit[]; setList: (f: Fruit[]) => void; source: string; setSource: (s: string) => void;
  base: { fruits: Fruit[]; source: string }; setBase: (b: { fruits: Fruit[]; source: string }) => void; updatedBy: string;
}) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [paste, setPaste] = useState("");
  const [query, setQuery] = useState("");
  const dirty = JSON.stringify(list) !== JSON.stringify(base.fruits) || source !== base.source;
  const missing = FRUIT_NAMES.filter((n) => !list.some((f) => f.name.toLowerCase() === n.toLowerCase()));

  const update = (i: number, patch: Partial<Fruit>) => setList(list.map((f, k) => (k === i ? { ...f, ...patch } : f)));
  const importText = () => {
    const out = [...list]; let added = 0, bad = 0;
    for (const raw of paste.split(/\r?\n/)) {
      const line = raw.trim(); if (!line) continue;
      const m = line.match(/^(.+?)\s+(\d{1,3}(?:,\d{3})+(?:\.\d+)?)$/) ?? line.match(/^(.+?)\s*[,:=\t]\s*([\d.,]+)$/) ?? line.match(/^(.+?)\s+([\d.,]+)$/);
      const value = m ? Number(m[2].replace(/,/g, "")) : NaN;
      if (!m || !Number.isFinite(value)) { bad++; continue; }
      const name = m[1].trim(); const at = out.findIndex((f) => f.name.toLowerCase() === name.toLowerCase());
      if (at >= 0) out[at] = { name: out[at].name, value }; else out.push({ name, value });
      added++;
    }
    setList(out); setPaste("");
    setResult({ ok: bad === 0, message: `Imported ${added} line(s)${bad ? `, skipped ${bad} I couldn't read` : ""}. Press Save to keep them.` });
  };
  const save = async () => {
    setPending(true); setResult(null);
    try {
      const r = await saveBloxValues({ guildId, fruits: list, source });
      setResult(r); if (r.ok) setBase({ fruits: list, source });
    } catch { setResult({ ok: false, message: "Couldn't save. Try again." }); }
    finally { setPending(false); }
  };
  const shown = list.map((f, i) => ({ f, i })).filter(({ f }) => f.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <Section icon="gem" title="Fruit values" hint="Type the values your community trades by. They power the calculator and show next to stock. Anyone who can manage the server can edit this.">
        <div className="space-y-4">
          <TextInput label="Where these numbers come from (optional)" value={source} onChange={setSource} max={120} placeholder="e.g. our staff list, updated weekly" />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setList([...list, { name: "", value: 0 }])} className="btn btn-ghost !py-2"><Icon name="plus" className="h-4 w-4" /> Add fruit</button>
            <button type="button" disabled={missing.length === 0} onClick={() => setList([...list, ...missing.map((name) => ({ name, value: 0 }))])} className="btn btn-ghost !py-2 disabled:opacity-40">Add all fruit names ({missing.length})</button>
            <button type="button" disabled={list.length < 2} onClick={() => setList([...list].sort((a, b) => b.value - a.value))} className="btn btn-ghost !py-2 disabled:opacity-40">Sort by value</button>
            <input aria-label="Search fruits" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="ml-auto w-40 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/60" />
          </div>
          {list.length === 0 ? <p className="text-sm text-zinc-500">No fruits yet. Use &quot;Add all fruit names&quot;, then fill in the values.</p> : (
            <ul className="space-y-2">
              {shown.map(({ f, i }) => (
                <li key={i} className="flex items-center gap-2">
                  <input aria-label="Fruit name" value={f.name} maxLength={30} onChange={(e) => update(i, { name: e.target.value })} placeholder="Fruit name"
                         className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/60" />
                  <input aria-label={`Value of ${f.name || "fruit"}`} type="number" inputMode="decimal" min={0} value={f.value === 0 ? "" : f.value} placeholder="Value"
                         onChange={(e) => update(i, { value: e.target.value === "" ? 0 : Math.max(0, +e.target.value) })}
                         className="w-28 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-right text-sm text-white outline-none focus:border-violet-400/60" />
                  <button type="button" aria-label={`Remove ${f.name || "fruit"}`} onClick={() => setList(list.filter((_, k) => k !== i))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-rose-300"><Icon name="trash" className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
          {list.some((f) => f.value === 0) && list.length > 0 && <p className="text-xs text-amber-300">Fruits with no value are left out of the calculator.</p>}
        </div>
      </Section>

      <Section icon="scroll" title="Paste a list" hint="One fruit per line, like “Dragon: 300” or “Kitsune, 250”. Existing fruits get updated.">
        <TextInput label="Values" value={paste} onChange={setPaste} multiline rows={5} placeholder={"Dragon: 300\nKitsune, 250"} />
        <button type="button" disabled={!paste.trim()} onClick={importText} className="btn btn-ghost mt-3 disabled:opacity-40">Import lines</button>
      </Section>

      <SaveBar dirty={dirty} pending={pending} result={result} onSave={save} onReset={() => { setList(base.fruits); setSource(base.source); setResult(null); }} />
      {updatedBy && <p className="text-xs text-zinc-500">Last saved by {updatedBy}.</p>}
    </div>
  );
}
