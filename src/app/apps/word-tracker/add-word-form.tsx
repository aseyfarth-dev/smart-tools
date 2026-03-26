"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addWord, type AddWordResult } from "./actions";

export function AddWordForm() {
  const [word, setWord] = useState("");
  const [result, setResult] = useState<AddWordResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent, force = false) {
    e.preventDefault();
    if (!word.trim()) return;

    startTransition(async () => {
      const res = await addWord(word, force);
      setResult(res);
      if (res.success) {
        setWord("");
        // Clear success message after a moment
        setTimeout(() => setResult(null), 2000);
      }
    });
  }

  function handleDismissFuzzy() {
    setResult(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={word}
          onChange={(e) => {
            setWord(e.target.value);
            if (result) setResult(null);
          }}
          placeholder="Enter a new word..."
          disabled={isPending}
          autoFocus
          className="flex-1"
        />
        <Button type="submit" disabled={isPending || !word.trim()}>
          {isPending ? "Adding..." : "Add"}
        </Button>
      </form>

      {/* Success feedback */}
      {result?.success && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Word added!
        </p>
      )}

      {/* Error feedback */}
      {result?.error && !result.fuzzyMatches && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}

      {/* Fuzzy match warning */}
      {result?.fuzzyMatches && result.fuzzyMatches.length > 0 && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-950">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Similar words found:
          </p>
          <ul className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            {result.fuzzyMatches.map((match) => (
              <li key={match}>&bull; {match}</li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isPending}
            >
              Add anyway
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismissFuzzy}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
