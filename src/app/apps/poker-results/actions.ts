"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SessionInput = {
  date: string;
  players: { name: string; amount: number }[];
};

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function createSession(input: SessionInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (!input.date) {
    return { success: false, error: "Date is required" };
  }

  if (input.players.length === 0) {
    return { success: false, error: "At least one player is required" };
  }

  for (const p of input.players) {
    if (!p.name.trim()) {
      return { success: false, error: "All players need a name" };
    }
    if (isNaN(p.amount)) {
      return { success: false, error: `Invalid amount for ${p.name}` };
    }
  }

  // Insert session
  const { data: session, error: sessionError } = await supabase
    .from("poker_sessions")
    .insert({ user_id: user.id, date: input.date })
    .select("id")
    .single();

  if (sessionError || !session) {
    return { success: false, error: sessionError?.message ?? "Failed to create session" };
  }

  // Insert results
  const results = input.players.map((p) => ({
    session_id: session.id,
    player_name: p.name.trim(),
    amount: p.amount,
  }));

  const { error: resultsError } = await supabase
    .from("poker_results")
    .insert(results);

  if (resultsError) {
    // Clean up the session if results failed
    await supabase.from("poker_sessions").delete().eq("id", session.id);
    return { success: false, error: resultsError.message };
  }

  revalidatePath("/apps/poker-results");
  return { success: true };
}

export async function updateSession(
  sessionId: string,
  input: SessionInput
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (!input.date) {
    return { success: false, error: "Date is required" };
  }

  if (input.players.length === 0) {
    return { success: false, error: "At least one player is required" };
  }

  for (const p of input.players) {
    if (!p.name.trim()) {
      return { success: false, error: "All players need a name" };
    }
    if (isNaN(p.amount)) {
      return { success: false, error: `Invalid amount for ${p.name}` };
    }
  }

  // Update session date
  const { error: sessionError } = await supabase
    .from("poker_sessions")
    .update({ date: input.date })
    .eq("id", sessionId);

  if (sessionError) {
    return { success: false, error: sessionError.message };
  }

  // Delete existing results and insert new ones
  const { error: deleteError } = await supabase
    .from("poker_results")
    .delete()
    .eq("session_id", sessionId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  const results = input.players.map((p) => ({
    session_id: sessionId,
    player_name: p.name.trim(),
    amount: p.amount,
  }));

  const { error: resultsError } = await supabase
    .from("poker_results")
    .insert(results);

  if (resultsError) {
    return { success: false, error: resultsError.message };
  }

  revalidatePath("/apps/poker-results");
  return { success: true };
}

export async function deleteSession(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // CASCADE will delete related poker_results
  const { error } = await supabase
    .from("poker_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/apps/poker-results");
  return { success: true };
}
