import type { ReactNode } from "react";
import type { PanelConfig } from "@/lib/store";

function md(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.length > 4 && part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>);
}

const safeUrl = (u?: string) => (u && /^https?:\/\//.test(u) ? u : "");

/** Mirrors how the bot builds the panel message, so what you see is what Discord shows. */
export function EmbedPreview({ config }: { config: PanelConfig }) {
  const color = /^[0-9a-fA-F]{6}$/.test(config.color) ? `#${config.color}` : "#9b5cff";
  let description = config.description || "No description set.";
  if (config.type === "multiple") description += "\n\n**Choose a category below to open a ticket.**";
  else if (config.type === "form") description += "\n\n📝 Select the button to complete the form before your ticket opens.";
  const banner = safeUrl(config.banner_url), thumb = safeUrl(config.thumbnail_url), authorIcon = safeUrl(config.author_icon_url);

  return (
    <div className="rounded-2xl bg-[#313338] p-4 text-[#dbdee1] shadow-[0_20px_60px_-20px_rgba(0,0,0,.8)]">
      <div className="flex items-center gap-3 pb-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-700 font-display text-sm font-bold text-white">Z</span>
        <div><span className="font-medium text-white">Zenvyx</span> <span className="ml-1 rounded bg-[#5865f2] px-1 py-0.5 text-[10px] font-bold text-white">BOT</span></div>
      </div>
      <div className="max-w-md rounded-md border-l-4 bg-[#2b2d31] p-3" style={{ borderLeftColor: color }}>
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            {config.author_name && (
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-white">
                {authorIcon && /* eslint-disable-next-line @next/next/no-img-element */ <img src={authorIcon} alt="" className="h-6 w-6 rounded-full" />}
                {config.author_name}
              </div>
            )}
            <p className="font-semibold text-white">{config.title || "Zenvyx Support"}</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-snug">{md(description)}</p>
            {config.type === "multiple" && config.options.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-semibold text-white">🎫 Categories</p>
                <p className="whitespace-pre-wrap text-sm">
                  {config.options.map((o) => `${o.emoji || "🎫"} ${o.label}${o.description ? ` — ${o.description}` : ""}`).join("\n")}
                </p>
              </div>
            )}
          </div>
          {thumb && /* eslint-disable-next-line @next/next/no-img-element */ <img src={thumb} alt="" className="h-16 w-16 rounded-md object-cover" />}
        </div>
        {banner && /* eslint-disable-next-line @next/next/no-img-element */ <img src={banner} alt="" className="mt-3 max-h-48 w-full rounded-md object-cover" />}
        {config.footer && <p className="mt-3 text-xs text-[#949ba4]">{config.footer}</p>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {config.type === "multiple" ? (
          <div className="flex w-full max-w-md items-center justify-between rounded-md border border-[#1e1f22] bg-[#1e1f22] px-3 py-2 text-sm text-[#949ba4]">
            Select a category… <span aria-hidden="true">⌄</span>
          </div>
        ) : (
          config.options.slice(0, 1).map((o, i) => (
            <span key={i} className="inline-flex items-center gap-2 rounded-[3px] bg-[#5865f2] px-4 py-1.5 text-sm font-medium text-white">
              <span>{o.emoji || "🎫"}</span>{o.label || "Open Ticket"}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
