import { describe, it, expect } from "vitest";
import { editDistance, findSimilarWords } from "./fuzzy-match";

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
    expect(editDistance("cat", "car")).toBe(1); // substitution
    expect(editDistance("cat", "cats")).toBe(1); // insertion
    expect(editDistance("cats", "cat")).toBe(1); // deletion
  });

  it("handles two character differences", () => {
    expect(editDistance("cat", "dog")).toBe(3);
    expect(editDistance("ball", "bell")).toBe(1);
    expect(editDistance("mama", "papa")).toBe(2);
  });

  it("is case-sensitive", () => {
    expect(editDistance("Cat", "cat")).toBe(1);
    expect(editDistance("CAT", "cat")).toBe(3);
  });
});

describe("findSimilarWords", () => {
  const wordList = ["mama", "papa", "ball", "dog", "cat", "car", "hello"];

  it("returns empty array when no similar words", () => {
    expect(findSimilarWords("elephant", wordList)).toEqual([]);
  });

  it("finds words within edit distance of 2", () => {
    const result = findSimilarWords("bat", wordList);
    expect(result).toContain("ball"); // distance 2
    expect(result).toContain("cat"); // distance 1
    expect(result).toContain("car"); // distance 2
  });

  it("finds substring matches", () => {
    const result = findSimilarWords("hell", wordList);
    expect(result).toContain("hello"); // "hell" is substring of "hello"
  });

  it("finds superstring matches", () => {
    const result = findSimilarWords("dogs", wordList);
    expect(result).toContain("dog"); // "dog" is substring of "dogs"
  });

  it("is case-insensitive", () => {
    const result = findSimilarWords("CAT", wordList);
    // "CAT" lowercased = "cat", which is an exact match → excluded
    expect(result).not.toContain("cat");
    expect(result).toContain("car"); // distance 1 from "cat"
  });

  it("excludes exact matches", () => {
    const result = findSimilarWords("cat", wordList);
    expect(result).not.toContain("cat");
  });

  it("finds close toddler words", () => {
    const toddlerWords = ["mama", "dada", "baba", "nana", "ball", "bye"];
    const result = findSimilarWords("papa", toddlerWords);
    expect(result).toContain("mama"); // distance 2
    expect(result).toContain("dada"); // distance 2
    expect(result).toContain("baba"); // distance 2
    expect(result).toContain("nana"); // distance 2
  });

  it("returns empty array for empty word list", () => {
    expect(findSimilarWords("hello", [])).toEqual([]);
  });

  it("handles single character words", () => {
    const result = findSimilarWords("a", ["b", "ab", "abc"]);
    expect(result).toContain("b"); // distance 1
    expect(result).toContain("ab"); // "a" is substring of "ab"
    expect(result).toContain("abc"); // "a" is substring of "abc"
  });
});
