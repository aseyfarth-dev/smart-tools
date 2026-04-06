import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/shell/logout-button";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { MessageSquareText, TrendingUp, Users, Fuel } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const apps: {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
}[] = [
  {
    name: "Word Tracker",
    description: "Track your toddler's first words",
    href: "/apps/word-tracker",
    icon: MessageSquareText,
    color: "text-emerald-500",
  },
  {
    name: "Poker Results",
    description: "Track poker session results over time",
    href: "/apps/poker-results",
    icon: TrendingUp,
    color: "text-blue-500",
  },
  {
    name: "Poker Session",
    description: "Manage live poker session buy-ins & payouts",
    href: "/apps/poker-session",
    icon: Users,
    color: "text-amber-500",
  },
  {
    name: "Tanken",
    description: "Log refuel events & track consumption",
    href: "/apps/tanken",
    icon: Fuel,
    color: "text-orange-500",
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
        <h1 className="text-lg font-semibold">My Smart Tools</h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.href}
                href={app.href}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center transition-colors hover:bg-accent active:bg-accent/80"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <Icon className={`h-6 w-6 ${app.color}`} />
                </div>
                <span className="text-sm font-medium">{app.name}</span>
                <span className="text-xs text-muted-foreground">
                  {app.description}
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
