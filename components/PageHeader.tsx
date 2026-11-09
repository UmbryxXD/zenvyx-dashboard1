import { Icon, type IconName } from "./Icon";

export function PageHeader({ icon, title, subtitle, action }: { icon: IconName; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="rise flex flex-wrap items-center gap-4">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/25 shadow-[0_0_30px_-6px_rgba(139,92,246,.8)]">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-2xl font-bold sm:text-3xl tracking-tight"><span className="text-gradient">{title}</span></h1>
        {subtitle && <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
