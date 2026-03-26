"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { deleteWord } from "./actions";
import type { Word } from "@/types/word-tracker";

interface WordListProps {
  words: Word[];
}

export function WordList({ words }: WordListProps) {
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = words.filter((w) =>
    w.word.toLowerCase().includes(search.toLowerCase())
  );

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      await deleteWord(id);
      setDeletingId(null);
    });
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words..."
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {filtered.length} word{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          {words.length === 0
            ? "No words yet — add the first one!"
            : "No words match your search."}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {filtered.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="font-medium">{w.word}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(w.created_at)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                onClick={() => handleDelete(w.id)}
                disabled={isPending && deletingId === w.id}
                aria-label={`Delete "${w.word}"`}
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
