"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { calculateSettlements } from "./lib/settlement";
import type { PlayerWithDetails } from "@/types/poker-session";

const PATH = "/apps/poker-session";

type ActionResult = { success: boolean; error?: string };

// ============================================================
// Session actions
// ============================================================

export async function createSession(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Check if there's already an active session
  const { data: existing } = await supabase
    .from("live_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    return { success: false, error: "An active session already exists" };
  }

  const { error } = await supabase
    .from("live_sessions")
    .insert({ user_id: user.id });

  if (error) return { success: false, error: error.message };

  revalidatePath(PATH);
  return { success: true };
}

export async function settleSession(
  sessionId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("live_sessions")
    .update({ status: "settled", settled_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath(PATH);
  return { success: true };
}

// ============================================================
// Player actions
// ============================================================

export async function addPlayer(
  sessionId: string,
  name: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Name cannot be empty" };

  // Verify session ownership
  const { data: session } = await supabase
    .from("live_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!session) return { success: false, error: "Session not found" };

  // Check for duplicate name in this session
  const { data: existingPlayer } = await supabase
    .from("live_session_players")
    .select("id")
    .eq("session_id", sessionId)
    .ilike("name", trimmed)
    .maybeSingle();

  if (existingPlayer) {
    return { success: false, error: `"${trimmed}" is already in the session` };
  }

  const { error } = await supabase
    .from("live_session_players")
    .insert({ session_id: sessionId, name: trimmed });

  if (error) return { success: false, error: error.message };

  revalidatePath(PATH);
  return { success: true };
}

export async function removePlayer(playerId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // CASCADE will delete buyins and cashouts too
  const { error } = await supabase
    .from("live_session_players")
    .delete()
    .eq("id", playerId);

  if (error) return { success: false, error: error.message };

  revalidatePath(PATH);
  return { success: true };
}

// ============================================================
// Buy-in actions
// ============================================================

export async function addBuyin(
  playerId: string,
  amount: number
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (amount <= 0) return { success: false, error: "Amount must be positive" };

  const { error } = await supabase
    .from("live_session_buyins")
    .insert({ player_id: playerId, amount });

  if (error) return { success: false, error: error.message };

  revalidatePath(PATH);
  return { success: true };
}

export async function removeBuyin(buyinId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("live_session_buyins")
    .delete()
    .eq("id", buyinId);

  if (error) return { success: false, error: error.message };

  revalidatePath(PATH);
  return { success: true };
}

export async function toggleBuyinPaidCash(
  buyinId: string,
  paidCash: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("live_session_buyins")
    .update({ paid_cash: paidCash })
    .eq("id", buyinId);

  if (error) return { success: false, error: error.message };

  revalidatePath(PATH);
  return { success: true };
}

// ============================================================
// Cashout actions
// ============================================================

export async function setCashout(
  playerId: string,
  chipCount: number
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (chipCount < 0)
    return { success: false, error: "Chip count cannot be negative" };

  // Upsert: delete existing cashout first, then insert
  await supabase
    .from("live_session_cashouts")
    .delete()
    .eq("player_id", playerId);

  const { error } = await supabase
    .from("live_session_cashouts")
    .insert({ player_id: playerId, chip_count: chipCount });

  if (error) return { success: false, error: error.message };

  revalidatePath(PATH);
  return { success: true };
}

export async function removeCashout(playerId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("live_session_cashouts")
    .delete()
    .eq("player_id", playerId);

  if (error) return { success: false, error: error.message };

  revalidatePath(PATH);
  return { success: true };
}

// ============================================================
// Settlement actions
// ============================================================

export async function generateSettlements(
  sessionId: string,
  players: PlayerWithDetails[]
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Calculate settlements using the deterministic algorithm
  const transactions = calculateSettlements(players);

  // Clear existing settlements for this session
  await supabase
    .from("live_session_settlements")
    .delete()
    .eq("session_id", sessionId);

  // Insert new settlements
  if (transactions.length > 0) {
    const rows = transactions.map((t) => ({
      session_id: sessionId,
      from_player: t.fromPlayer,
      to_player: t.toPlayer,
      amount: t.amount,
      completed: false,
    }));

    const { error } = await supabase
      .from("live_session_settlements")
      .insert(rows);

    if (error) return { success: false, error: error.message };
  }

  revalidatePath(PATH);
  return { success: true };
}

export async function toggleSettlementCompleted(
  settlementId: string,
  completed: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("live_session_settlements")
    .update({ completed })
    .eq("id", settlementId);

  if (error) return { success: false, error: error.message };

  revalidatePath(PATH);
  return { success: true };
}

// ============================================================
// Export to Poker Results
// ============================================================

export async function pushToResults(
  sessionId: string,
  players: PlayerWithDetails[],
  sessionDate: string // YYYY-MM-DD
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Verify all players have a net result
  const playersWithResult = players.filter((p) => p.netResult !== null);
  if (playersWithResult.length === 0) {
    return { success: false, error: "No players have cashed out yet" };
  }

  // Check not already exported
  const { data: session } = await supabase
    .from("live_sessions")
    .select("exported_to_results")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!session) return { success: false, error: "Session not found" };
  if (session.exported_to_results) {
    return { success: false, error: "Session already exported to Results" };
  }

  // Insert into poker_sessions
  const { data: pokerSession, error: sessionError } = await supabase
    .from("poker_sessions")
    .insert({ user_id: user.id, date: sessionDate })
    .select("id")
    .single();

  if (sessionError || !pokerSession) {
    return {
      success: false,
      error: sessionError?.message ?? "Failed to create results session",
    };
  }

  // Bulk insert player results
  const results = playersWithResult.map((p) => ({
    session_id: pokerSession.id,
    player_name: p.name,
    amount: p.netResult as number,
  }));

  const { error: resultsError } = await supabase
    .from("poker_results")
    .insert(results);

  if (resultsError) {
    // Clean up the session on failure
    await supabase.from("poker_sessions").delete().eq("id", pokerSession.id);
    return { success: false, error: resultsError.message };
  }

  // Mark session as exported
  const { error: flagError } = await supabase
    .from("live_sessions")
    .update({ exported_to_results: true })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (flagError) return { success: false, error: flagError.message };

  revalidatePath(PATH);
  revalidatePath("/apps/poker-results");
  return { success: true };
}
