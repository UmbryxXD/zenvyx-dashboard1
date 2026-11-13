export type PreviewEmbed = {
  title?: string; description?: string; color?: number; author_name?: string; author_icon?: string;
  footer_text?: string; footer_icon?: string; thumbnail?: string; image?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
};

const hex = (n?: number) => `#${(n ?? 0x9b5cff).toString(16).padStart(6, "0")}`;
const safeUrl = (u?: string) => (u && /^https:\/\//.test(u) ? u : undefined);

/** Replaces {placeholders} with sample values, for previews only. */
export function sample(text: string | undefined, vars: Record<string, string> | null): string {
  if (!text) return "";
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k.toLowerCase()] ?? m);
}

export function DiscordEmbedPreview({ content, embed, vars, botName = "Zenvyx" }: { content?: string; embed?: PreviewEmbed | null; vars?: Record<string, string> | null; botName?: string }) {
  const v = vars ?? null;
  const s = (t?: string) => sample(t, v);
  const has = embed && (embed.title || embed.description || embed.author_name || embed.footer_text || embed.image || embed.thumbnail || embed.fields?.length);
  return (
    <div className="rounded-xl border border-white/10 bg-[#313338] p-4 text-[15px] text-zinc-200">
      <div className="mb-1 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-xs font-bold text-white">Z</span><span className="font-semibold text-white">{botName}</span><span className="rounded bg-[#5865f2] px-1 text-[10px] font-bold text-white">APP</span></div>
      <div className="pl-10">
        {content ? <p className="mb-2 whitespace-pre-wrap break-words">{s(content)}</p> : null}
        {has ? (
          <div className="max-w-md overflow-hidden rounded border-l-4 bg-[#2b2d31] p-3" style={{ borderColor: hex(embed?.color) }}>
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                {embed?.author_name && <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">{safeUrl(s(embed.author_icon)) && <img src={safeUrl(s(embed.author_icon))} alt="" className="h-5 w-5 rounded-full" />}{s(embed.author_name)}</p>}
                {embed?.title && <p className="mb-1 font-semibold text-white">{s(embed.title)}</p>}
                {embed?.description && <p className="whitespace-pre-wrap break-words text-sm">{s(embed.description)}</p>}
                {!!embed?.fields?.length && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {embed.fields.map((f, i) => (
                      <div key={i} className={f.inline ? "col-span-1" : "col-span-3"}>
                        <p className="text-sm font-semibold text-white">{f.name}</p>
                        <p className="whitespace-pre-wrap break-words text-sm">{f.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {safeUrl(s(embed?.thumbnail)) && <img src={safeUrl(s(embed?.thumbnail))} alt="" className="h-16 w-16 shrink-0 rounded object-cover" />}
            </div>
            {safeUrl(s(embed?.image)) && <img src={safeUrl(s(embed?.image))} alt="" className="mt-3 max-h-60 w-full rounded object-cover" />}
            {embed?.footer_text && <p className="mt-2 flex items-center gap-2 text-xs text-zinc-400">{safeUrl(s(embed.footer_icon)) && <img src={safeUrl(s(embed.footer_icon))} alt="" className="h-4 w-4 rounded-full" />}{s(embed.footer_text)}</p>}
          </div>
        ) : null}
        {!content && !has && <p className="text-sm italic text-zinc-500">Nothing to preview yet.</p>}
      </div>
    </div>
  );
}
