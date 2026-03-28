import { colognePhonetics } from "./cologne-phonetics";

/**
 * Levenshtein distance between two strings.
 */
export function editDistance(a: string, b: string): number {
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

/**
 * Common German suffixes for plural, diminutive, and conjugation.
 * Ordered longest-first so we strip the most specific suffix.
 */
const GERMAN_SUFFIXES = [
  "chen",
  "lein",
  "ung",
  "heit",
  "keit",
  "ern",
  "eln",
  "en",
  "er",
  "es",
  "st",
  "te",
  "et",
  "em",
  "el",
  "le",
  "n",
  "e",
  "s",
  "t",
];

/**
 * Strip common German suffixes to get an approximate word stem.
 * Only strips if the remaining stem is at least 2 characters.
 */
export function germanStem(word: string): string {
  const lower = word.toLowerCase();
  for (const suffix of GERMAN_SUFFIXES) {
    if (lower.endsWith(suffix) && lower.length - suffix.length >= 2) {
      return lower.slice(0, -suffix.length);
    }
  }
  return lower;
}

/**
 * Check if two words are likely the same word (variant/inflection).
 *
 * Uses a multi-signal approach:
 * 1. German stem matching — catches plurals, diminutives, conjugations
 * 2. Cologne Phonetics + tight edit distance — catches misspellings that sound alike
 * 3. Edit distance ≤ 1 — catches single-character typos
 *
 * Avoids false positives like "mama"/"papa" or "ball"/"hall".
 */
export function isSimilarWord(wordA: string, wordB: string): boolean {
  const a = wordA.toLowerCase();
  const b = wordB.toLowerCase();

  if (a === b) return false; // exact match handled separately

  // Signal 1: Same German stem → likely plural/conjugation variant
  const stemA = germanStem(a);
  const stemB = germanStem(b);
  if (stemA === stemB && stemA.length >= 2) {
    return true;
  }

  // Signal 2: Same phonetic code AND edit distance ≤ 1
  // This catches misspellings that sound the same (e.g., "Meier"/"Meyer")
  // The edit distance guard prevents false positives from phonetic collisions
  // (e.g., "Mama"/"Nana" have same phonetic code but edit distance 2)
  const phoneticA = colognePhonetics(a);
  const phoneticB = colognePhonetics(b);
  const dist = editDistance(a, b);

  if (phoneticA && phoneticB && phoneticA === phoneticB && dist <= 1) {
    return true;
  }

  // Signal 3: Very close edit distance (single character typo)
  // Only for words with length >= 3 to avoid matching unrelated short words.
  // Exclude cases where the first letter differs — that's more likely
  // a different word than a typo (e.g., "Ball"/"Hall", "Hund"/"Bund").
  if (dist <= 1 && Math.min(a.length, b.length) >= 3 && a[0] === b[0]) {
    return true;
  }

  return false;
}

/**
 * Find similar words from a list of existing words.
 * Returns all words that are likely variants, inflections, or misspellings
 * of the new word.
 */
export function findSimilarWords(
  newWord: string,
  existingWords: string[]
): string[] {
  const normalized = newWord.toLowerCase();

  return existingWords.filter((existing) => {
    const existingLower = existing.toLowerCase();
    if (existingLower === normalized) return false;
    return isSimilarWord(normalized, existingLower);
  });
}
