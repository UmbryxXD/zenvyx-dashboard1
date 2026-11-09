import { redirect } from "next/navigation";
import { CommandPalette } from "@/components/CommandPalette";
import { Sidebar } from "@/components/Sidebar";
import { getSession } from "@/lib/session";
import { getSnapshots } from "@/lib/store";

export default async function DashboardLayout({ children, params }: { children: React.ReactNode; params: { guildId: string } }) {
  const session = await getSession();
  if (!session) redirect("/");

  // Only used for the sidebar header; pages do their own permission checks.
  let guild: { name: string; icon: string | null } | null = null;
  try {
    const [snap] = await getSnapshots([params.guildId]);
    if (snap) guild = { name: snap.data.guild.name, icon: snap.data.guild.icon };
  } catch {
    /* sidebar just hides the server card */
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[88rem] flex-col md:flex-row">
      <Sidebar guildId={params.guildId} guild={guild} user={{ id: session.id, name: session.name, avatar: session.avatar }} />
      <CommandPalette guildId={params.guildId} />
      <main className="min-w-0 flex-1 px-3 pb-24 pt-3 sm:px-4 md:px-10 md:pb-16 md:pt-10">{children}</main>
    </div>
  );
}
