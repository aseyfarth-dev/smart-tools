"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
      // Simple client-side fuzzy matching using edit distance / substring
      const similar = fuzzyMatches
        .filter((m) => {
          const existing = m.word.toLowerCase();
          return (
            // One is a substring of the other
            existing.includes(normalized) ||
            normalized.includes(existing) ||
            // Levenshtein-like: differ by at most 1-2 chars
            editDistance(existing, normalized) <= 2
          );
        })
        .map((m) => m.word);

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

// Simple Levenshtein distance
function editDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
