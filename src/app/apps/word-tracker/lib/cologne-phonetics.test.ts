import { describe, it, expect } from "vitest";
import { colognePhonetics, soundsSimilar } from "./cologne-phonetics";

describe("colognePhonetics", () => {
  it("encodes classic German examples correctly", () => {
    expect(colognePhonetics("Müller")).toBe("657");
    expect(colognePhonetics("Mueller")).toBe("657");
    expect(colognePhonetics("Wikipedia")).toBe("3412");
  });

  it("handles empty and whitespace input", () => {
    expect(colognePhonetics("")).toBe("");
    expect(colognePhonetics("   ")).toBe("");
  });

  it("handles single characters", () => {
    expect(colognePhonetics("a")).toBe("0");
    expect(colognePhonetics("b")).toBe("1");
  });

  it("is case-insensitive", () => {
    expect(colognePhonetics("Auto")).toBe(colognePhonetics("auto"));
    expect(colognePhonetics("BALL")).toBe(colognePhonetics("ball"));
  });

  it("removes non-alphabetic characters", () => {
    expect(colognePhonetics("test123")).toBe(colognePhonetics("test"));
  });

  it("deduplicates consecutive identical codes", () => {
    expect(colognePhonetics("Ball")).toBe("15");
  });

  it("distinguishes different starting consonants", () => {
    // m=6, p=1, d=2, n=6 — mama/papa have different codes
    const mama = colognePhonetics("Mama");
    const papa = colognePhonetics("Papa");
    expect(mama).not.toBe(papa);
  });
});

describe("soundsSimilar", () => {
  it("matches common misspellings", () => {
    expect(soundsSimilar("Müller", "Mueller")).toBe(true);
    expect(soundsSimilar("Kaiser", "Kayser")).toBe(true);
    expect(soundsSimilar("Meier", "Meyer")).toBe(true);
  });

  it("does NOT match completely different words", () => {
    expect(soundsSimilar("Mama", "Papa")).toBe(false);
    expect(soundsSimilar("Hund", "Katze")).toBe(false);
    expect(soundsSimilar("Ball", "Haus")).toBe(false);
  });

  it("handles empty strings", () => {
    expect(soundsSimilar("", "test")).toBe(false);
    expect(soundsSimilar("test", "")).toBe(false);
    expect(soundsSimilar("", "")).toBe(false);
  });

  // Note: Mama/Nana DO share phonetic code (m=6, n=6 in Cologne Phonetics)
  // This is a known limitation — the fuzzy-match module uses additional
  // signals (edit distance) to filter out these false positives.
  it("may match words with same nasal consonants (known behavior)", () => {
    expect(soundsSimilar("Mama", "Nana")).toBe(true); // both code "66"
  });
});
