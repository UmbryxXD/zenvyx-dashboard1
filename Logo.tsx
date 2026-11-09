export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ filter: "drop-shadow(0 4px 14px rgba(139,92,246,.65))" }}>
        <defs>
          <linearGradient id="zg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ddd6fe" />
            <stop offset="0.5" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#zg)" />
        <path d="M9 10h14l-9 12h9" fill="none" stroke="#0b0814" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight text-white">Zenvyx</span>
    </span>
  );
}
