/**
 * Simple Levenshtein distance between two strings.
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
 * Find similar words from a list of existing words.
 * A word is considered similar if:
 * - One is a substring of the other
 * - Edit distance is <= 2
 */
export function findSimilarWords(
  newWord: string,
  existingWords: string[]
): string[] {
  const normalized = newWord.toLowerCase();

  return existingWords.filter((existing) => {
    const existingLower = existing.toLowerCase();
    if (existingLower === normalized) return false; // exact match handled separately

    return (
      existingLower.includes(normalized) ||
      normalized.includes(existingLower) ||
      editDistance(existingLower, normalized) <= 2
    );
  });
}
