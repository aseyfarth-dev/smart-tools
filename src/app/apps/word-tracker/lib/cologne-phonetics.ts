/**
 * Kölner Phonetik (Cologne Phonetics)
 *
 * A phonetic algorithm for German language that encodes words
 * by their pronunciation. Words that sound similar produce
 * the same code, regardless of spelling.
 *
 * Reference: Hans Joachim Postel, "Die Kölner Phonetik", 1969
 */

const CHAR_MAP: Record<string, (prev: string, next: string) => string> = {
  a: () => "0",
  e: () => "0",
  i: () => "0",
  o: () => "0",
  u: () => "0",
  ä: () => "0",
  ö: () => "0",
  ü: () => "0",
  h: () => "",
  b: () => "1",
  p: (_prev, next) => (next === "h" ? "3" : "1"),
  f: () => "3",
  v: () => "3",
  w: () => "3",
  g: () => "4",
  k: () => "4",
  q: () => "4",
  c: (prev, next) =>
    "ahkloqrux".includes(next) &&
    !["s", "z"].includes(prev)
      ? "4"
      : "8",
  d: (_prev, next) => (["c", "s", "z"].includes(next) ? "8" : "2"),
  t: (_prev, next) => (["c", "s", "z"].includes(next) ? "8" : "2"),
  l: () => "5",
  m: () => "6",
  n: () => "6",
  r: () => "7",
  s: () => "8",
  z: () => "8",
  ß: () => "8",
  x: () => "48",
  j: () => "0",
  y: () => "0",
};

/**
 * Encode a word using Cologne Phonetics.
 * Returns a numeric string code representing the word's pronunciation.
 */
export function colognePhonetics(word: string): string {
  if (!word || word.trim().length === 0) return "";

  const input = word.toLowerCase().replace(/[^a-zäöüß]/g, "");
  if (input.length === 0) return "";

  let code = "";
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const prev = i > 0 ? input[i - 1] : "";
    const next = i < input.length - 1 ? input[i + 1] : "";

    const mapper = CHAR_MAP[char];
    if (mapper) {
      code += mapper(prev, next);
    }
  }

  // Remove consecutive duplicate digits
  let deduplicated = "";
  for (let i = 0; i < code.length; i++) {
    if (i === 0 || code[i] !== code[i - 1]) {
      deduplicated += code[i];
    }
  }

  // Remove all zeros except if it's the first character
  const firstChar = deduplicated[0] || "";
  const rest = deduplicated.slice(1).replace(/0/g, "");

  return firstChar + rest;
}

/**
 * Check if two words sound similar based on Cologne Phonetics.
 */
export function soundsSimilar(wordA: string, wordB: string): boolean {
  const codeA = colognePhonetics(wordA);
  const codeB = colognePhonetics(wordB);

  if (!codeA || !codeB) return false;

  return codeA === codeB;
}
