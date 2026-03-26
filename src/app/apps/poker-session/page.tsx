import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SessionStarter } from "./session-starter";
import { PlayerManagement } from "./player-management";
import { BuyinTracking } from "./buyin-tracking";
import { CashoutSection } from "./cashout-section";
import { SettlementSection } from "./settlement-section";
import type {
  LiveSession,
  LiveSessionPlayer,
  LiveSessionBuyin,
  LiveSessionCashout,
  LiveSessionSettlement,
  PlayerWithDetails,
} from "@/types/poker-session";

export const dynamic = "force-dynamic";

export default async function PokerSessionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch active session
  const { data: activeSession } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const session = activeSession as LiveSession | null;

  // If there's an active session, fetch all related data
  let players: LiveSessionPlayer[] = [];
  let buyins: LiveSessionBuyin[] = [];
  let cashouts: LiveSessionCashout[] = [];
  let settlements: LiveSessionSettlement[] = [];

  if (session) {
    const [playersRes, settlementsRes] = await Promise.all([
      supabase
        .from("live_session_players")
        .select("*")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("live_session_settlements")
        .select("*")
        .eq("session_id", session.id)
        .order("amount", { ascending: false }),
    ]);

    players = (playersRes.data as LiveSessionPlayer[]) ?? [];
    settlements = (settlementsRes.data as LiveSessionSettlement[]) ?? [];

    if (players.length > 0) {
      const playerIds = players.map((p) => p.id);

      const [buyinsRes, cashoutsRes] = await Promise.all([
        supabase
          .from("live_session_buyins")
          .select("*")
          .in("player_id", playerIds)
          .order("created_at", { ascending: true }),
        supabase
          .from("live_session_cashouts")
          .select("*")
          .in("player_id", playerIds),
      ]);

      buyins = (buyinsRes.data as LiveSessionBuyin[]) ?? [];
      cashouts = (cashoutsRes.data as LiveSessionCashout[]) ?? [];
    }
  }

  // Aggregate player details
  const playersWithDetails: PlayerWithDetails[] = players.map((player) => {
    const playerBuyins = buyins.filter((b) => b.player_id === player.id);
    const totalBuyins = playerBuyins.reduce(
      (sum, b) => sum + Number(b.amount),
      0
    );
    const cashPaid = playerBuyins
      .filter((b) => b.paid_cash)
      .reduce((sum, b) => sum + Number(b.amount), 0);
    const playerCashout =
      cashouts.find((c) => c.player_id === player.id) ?? null;
    const netResult = playerCashout
      ? Number(playerCashout.chip_count) - totalBuyins
      : null;

    return {
      id: player.id,
      name: player.name,
      buyins: playerBuyins,
      totalBuyins,
      cashPaid,
      cashout: playerCashout,
      netResult,
    };
  });

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          &larr; Back
        </Link>
        <h1 className="text-lg font-semibold">Poker Session</h1>
      </header>

      {!session ? (
        <SessionStarter />
      ) : (
        <main className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col gap-4 pb-8">
          <PlayerManagement sessionId={session.id} players={players} />
          <BuyinTracking players={playersWithDetails} />
          <CashoutSection players={playersWithDetails} />
          <SettlementSection
            sessionId={session.id}
            players={playersWithDetails}
            settlements={settlements}
          />
        </main>
      )}
    </div>
  );
}
