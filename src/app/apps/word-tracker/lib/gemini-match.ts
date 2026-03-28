/**
 * Gemini-based smart duplicate detection.
 *
 * Uses Google Gemini (Flash) to determine if a new word is semantically
 * the same as any candidate words — catching plurals, conjugations,
 * misspellings, and dialect variations that rule-based matching might miss.
 *
 * This is designed as a second-stage filter: the candidate list should
 * already be pre-filtered by the rule-based fuzzy matcher to keep costs minimal.
 */

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Check if the Gemini LLM matching feature is enabled.
 */
export function isGeminiEnabled(): boolean {
  return (
    process.env.GEMINI_MATCH_ENABLED === "true" &&
    !!process.env.GEMINI_API_KEY
  );
}

/**
 * Ask Gemini to evaluate which candidate words are likely the same word
 * as the new word (just a different form: plural, conjugation, misspelling, etc.)
 *
 * Returns only the candidates that Gemini considers to be the same word.
 */
export async function geminiFilterSimilarWords(
  newWord: string,
  candidates: string[]
): Promise<string[]> {
  if (!candidates.length) return [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return candidates; // fallback: return all candidates

  const prompt = `You are a German language expert. A toddler's vocabulary is being tracked.

The user wants to add the word: "${newWord}"

These existing words were flagged as potentially similar:
${candidates.map((w) => `- "${w}"`).join("\n")}

For each existing word, determine if it is essentially the SAME word as "${newWord}" — meaning it's a plural form, singular form, conjugation, diminutive, common misspelling, or dialect variation of the same word.

Words that are completely DIFFERENT words (even if they share some letters) should NOT be included.

Respond with ONLY a JSON array of the words that ARE the same word. If none are the same, respond with an empty array [].
Example response: ["Hunde", "Hunds"]`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 256,
        },
      }),
    });

    if (!response.ok) {
      console.error(
        `Gemini API error: ${response.status} ${response.statusText}`
      );
      return candidates; // fallback: return all candidates
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "[]";

    // Extract JSON array from response (Gemini might wrap it in markdown)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return candidates;

    const matched: string[] = JSON.parse(jsonMatch[0]);

    // Only return words that were actually in the candidate list
    return matched.filter((w) =>
      candidates.some((c) => c.toLowerCase() === w.toLowerCase())
    );
  } catch (error) {
    console.error("Gemini matching error:", error);
    return candidates; // fallback: return all candidates on error
  }
}
