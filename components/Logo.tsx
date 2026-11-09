/* eslint-disable @next/next/no-img-element */
export function Logo({ size = 32, text = true }: { size?: number; text?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img src="/logo-192.png" width={size} height={size} alt={text ? "" : "Zenvyx"} decoding="async"
           style={{ filter: "drop-shadow(0 2px 10px rgba(139,92,246,.55))" }} />
      {text && <span className="font-display text-lg font-semibold tracking-tight text-white">Zenvyx</span>}
    </span>
  );
}
