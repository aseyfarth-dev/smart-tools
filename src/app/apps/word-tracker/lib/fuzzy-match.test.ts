import { describe, it, expect } from "vitest";
import {
  editDistance,
  germanStem,
  isSimilarWord,
  findSimilarWords,
} from "./fuzzy-match";

describe("editDistance", () => {
  it("returns 0 for identical strings", () => {
    expect(editDistance("hello", "hello")).toBe(0);
  });

  it("returns length of other string when one is empty", () => {
    expect(editDistance("", "hello")).toBe(5);
    expect(editDistance("hello", "")).toBe(5);
    expect(editDistance("", "")).toBe(0);
  });

  it("handles single character difference", () => {
    expect(editDistance("cat", "car")).toBe(1);
    expect(editDistance("cat", "cats")).toBe(1);
    expect(editDistance("cats", "cat")).toBe(1);
  });

  it("handles multiple character differences", () => {
    expect(editDistance("cat", "dog")).toBe(3);
    expect(editDistance("mama", "papa")).toBe(2);
  });
});

describe("germanStem", () => {
  it("strips common German plural suffixes", () => {
    expect(germanStem("Autos")).toBe("auto");
    expect(germanStem("Hunde")).toBe("hund");
    expect(germanStem("Kinder")).toBe("kind");
    expect(germanStem("Katzen")).toBe("katz");
  });

  it("strips diminutive suffixes", () => {
    expect(germanStem("Häuschen")).toBe("häus");
    expect(germanStem("Kindlein")).toBe("kind");
  });

  it("does not strip if stem would be too short", () => {
    expect(germanStem("an")).toBe("an");
    expect(germanStem("es")).toBe("es");
  });

  it("handles already-stemmed words", () => {
    expect(germanStem("Hund")).toBe("hund");
  });
});

describe("isSimilarWord", () => {
  // TRUE: should catch these as similar
  it("catches German plural/singular pairs", () => {
    expect(isSimilarWord("Auto", "Autos")).toBe(true);
    expect(isSimilarWord("Hund", "Hunde")).toBe(true);
    expect(isSimilarWord("Katze", "Katzen")).toBe(true);
  });

  it("catches single-character typos", () => {
    expect(isSimilarWord("Ball", "Balll")).toBe(true);
    expect(isSimilarWord("Hund", "Hune")).toBe(true);
  });

  it("catches words with same pronunciation and close spelling", () => {
    // These have same Cologne phonetic code AND edit distance ≤ 1
    expect(isSimilarWord("Müller", "Muller")).toBe(true);
  });

  // FALSE: should NOT catch these
  it("does NOT match completely different words", () => {
    expect(isSimilarWord("Mama", "Papa")).toBe(false);
    expect(isSimilarWord("Hund", "Katze")).toBe(false);
    expect(isSimilarWord("Ball", "Haus")).toBe(false);
    expect(isSimilarWord("Mama", "Nana")).toBe(false);
    expect(isSimilarWord("Mama", "Dada")).toBe(false);
    expect(isSimilarWord("Ball", "Hall")).toBe(false);
  });

  it("does NOT match short unrelated words", () => {
    expect(isSimilarWord("ja", "da")).toBe(false);
    expect(isSimilarWord("ab", "an")).toBe(false);
  });

  it("excludes exact matches", () => {
    expect(isSimilarWord("Hund", "Hund")).toBe(false);
    expect(isSimilarWord("hund", "Hund")).toBe(false);
  });
});

describe("findSimilarWords", () => {
  const toddlerWords = [
    "Mama",
    "Papa",
    "Dada",
    "Nana",
    "Ball",
    "Hund",
    "Katze",
    "Auto",
    "Wasser",
    "Milch",
  ];

  it("catches plurals of existing words", () => {
    const result = findSimilarWords("Autos", toddlerWords);
    expect(result).toContain("Auto");
    expect(result).not.toContain("Mama");
  });

  it("does not flag unrelated words", () => {
    const result = findSimilarWords("Papa", toddlerWords);
    // Papa itself is excluded (exact match handled separately)
    // Mama, Dada, Nana should NOT be flagged
    expect(result).not.toContain("Mama");
    expect(result).not.toContain("Dada");
    expect(result).not.toContain("Nana");
  });

  it("returns empty for clearly new words", () => {
    expect(findSimilarWords("Elefant", toddlerWords)).toEqual([]);
    expect(findSimilarWords("Schmetterling", toddlerWords)).toEqual([]);
  });

  it("returns empty for empty word list", () => {
    expect(findSimilarWords("hello", [])).toEqual([]);
  });
});
