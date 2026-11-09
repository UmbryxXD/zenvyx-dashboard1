const PATHS = {
  grid: <><rect x="3" y="3" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="2" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" /></>,
  sliders: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
  shield: <path d="M12 3l8 3v6c0 4.5-3.3 8.2-8 9-4.7-.8-8-4.5-8-9V6l8-3z" />,
  sparkles: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" /></>,
  music: <><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>,
  gem: <><path d="M6 4h12l3 5-9 11L3 9l3-5z" /><path d="M3 9h18M9 4l3 5 3-5M12 9v11" /></>,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  scroll: <><path d="M5 3h14v18H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5.2a3.2 3.2 0 010 6M18 14.3c1.8.8 3 2.6 3 4.7" /></>,
  hash: <path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16" />,
  tag: <><path d="M3 12V4h8l10 10-8 8L3 12z" /><circle cx="7.5" cy="8.5" r="1.2" /></>,
  zap: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  terminal: <><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M7.5 10l3 2-3 2M13 15h4" /></>,
  server: <><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="13" width="18" height="7" rx="2" /><path d="M7 7.5h.01M7 16.5h.01" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  logout: <path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  swap: <path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />,
  ticket: <><path d="M3 9a2 2 0 002-2V6h14v1a2 2 0 002 2v2a2 2 0 00-2 2v5H5v-5a2 2 0 00-2-2V9z" /><path d="M10 6v12" strokeDasharray="2 2.5" /></>,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9zM8.5 12h7M8.5 16h5" /></>,
  scale: <path d="M12 3v18M5 21h14M5 7h14M7 7l-3 7a3 3 0 006 0L7 7zM17 7l-3 7a3 3 0 006 0l-3-7z" />,
  history: <><path d="M3.5 12a8.5 8.5 0 108.5-8.5A8.5 8.5 0 005.6 6.3M3.5 4v3h3" /><path d="M12 8v4.5l3 1.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />,
  send: <path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" />,
  up: <path d="M6 15l6-6 6 6" />,
  down: <path d="M6 9l6 6 6-6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  command: <path d="M9 6a3 3 0 10-3 3h12a3 3 0 10-3-3v12a3 3 0 103-3H6a3 3 0 103 3V6z" />,
  puzzle: <path d="M10 4h4v3a2 2 0 104 0h2v6h-3a2 2 0 100 4h3v3H4v-5h3a2 2 0 100-4H4V4h6z" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
