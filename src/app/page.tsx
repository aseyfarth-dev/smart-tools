import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/shell/logout-button";
import { ThemeToggle } from "@/components/shell/theme-toggle";

export const dynamic = "force-dynamic";

const apps = [
  {
    name: "Word Tracker",
    description: "Track your toddler's first words",
    href: "/apps/word-tracker",
    icon: "📝",
  },
  {
    name: "Poker Results",
    description: "Track poker session results over time",
    href: "/apps/poker-results",
    icon: "📊",
  },
  {
    name: "Poker Session",
    description: "Manage live poker session buy-ins & payouts",
    href: "/apps/poker-session",
    icon: "🃏",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">My Apps</h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {apps.map((app) => (
            <Link
              key={app.href}
              href={app.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:bg-accent active:bg-accent/80"
            >
              <span className="text-3xl">{app.icon}</span>
              <span className="text-sm font-medium">{app.name}</span>
              <span className="text-xs text-muted-foreground">
                {app.description}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
