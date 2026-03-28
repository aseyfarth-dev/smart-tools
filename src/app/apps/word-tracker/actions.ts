"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { findSimilarWords } from "./lib/fuzzy-match";
import {
  isGeminiEnabled,
  geminiFilterSimilarWords,
} from "./lib/gemini-match";

export type AddWordResult = {
  success: boolean;
  error?: string;
  fuzzyMatches?: string[];
};

export async function addWord(
  word: string,
  force: boolean = false
): Promise<AddWordResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const trimmed = word.trim();
  if (!trimmed) {
    return { success: false, error: "Word cannot be empty" };
  }

  const normalized = trimmed.toLowerCase();

  // Check for exact duplicate
  const { data: exactMatch } = await supabase
    .from("words")
    .select("word")
    .eq("user_id", user.id)
    .eq("word_normalized", normalized)
    .maybeSingle();

  if (exactMatch) {
    return {
      success: false,
      error: `"${exactMatch.word}" already exists`,
    };
  }

  // Check for fuzzy matches (unless user chose to force-add)
  if (!force) {
    const { data: fuzzyMatches } = await supabase
      .from("words")
      .select("word")
      .eq("user_id", user.id)
      .filter("word_normalized", "not.eq", normalized);

    if (fuzzyMatches && fuzzyMatches.length > 0) {
      // Stage 1: Rule-based matching (Cologne Phonetics + German stems + edit distance)
      let similar = findSimilarWords(
        normalized,
        fuzzyMatches.map((m) => m.word)
      );

      // Stage 2: If Gemini is enabled, use LLM to filter out false positives
      if (similar.length > 0 && isGeminiEnabled()) {
        similar = await geminiFilterSimilarWords(trimmed, similar);
      }

      if (similar.length > 0) {
        return {
          success: false,
          fuzzyMatches: similar,
        };
      }
    }
  }

  // Insert the word
  const { error } = await supabase.from("words").insert({
    user_id: user.id,
    word: trimmed,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: `"${trimmed}" already exists` };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/apps/word-tracker");
  return { success: true };
}

export async function deleteWord(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("words").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/apps/word-tracker");
  return { success: true };
}

