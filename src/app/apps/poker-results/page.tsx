import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PokerResultsClient } from "./poker-results-client";
import type { PokerSession } from "@/types/poker-results";

export const dynamic = "force-dynamic";

export default async function PokerResultsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: sessions } = await supabase
    .from("poker_sessions")
    .select("id, user_id, date, created_at, poker_results(id, session_id, player_name, amount)")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          &larr; Back
        </Link>
        <h1 className="text-lg font-semibold">Poker Results</h1>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col gap-4">
        <PokerResultsClient sessions={(sessions as PokerSession[]) ?? []} />
      </main>
    </div>
  );
}
