export function uptime(seconds: number): string {
  const d = Math.floor(seconds / 86400), h = Math.floor((seconds % 86400) / 3600), m = Math.floor((seconds % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}

export const number = (n: number) => new Intl.NumberFormat("en-US").format(n);

export const avatarUrl = (id: string, avatar: string | null) =>
  avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=64` : "https://cdn.discordapp.com/embed/avatars/0.png";

export function ago(seconds: number): string {
  if (seconds < 90) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.floor(h / 24)} d ago`;
}
