"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addPlayer, removePlayer } from "./actions";
import type { LiveSessionPlayer } from "@/types/poker-session";

interface PlayerManagementProps {
  sessionId: string;
  players: LiveSessionPlayer[];
  knownPlayers: string[]; // all known names, alphabetical — for autocomplete
  recentPlayers: string[]; // up to 10 most recent, alphabetical — for chips
}

export function PlayerManagement({
  sessionId,
  players,
  knownPlayers,
  recentPlayers,
}: PlayerManagementProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentNames = players.map((p) => p.name.toLowerCase());

  function handleNameChange(value: string) {
    setName(value);
    if (error) setError(null);

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = knownPlayers.filter(
      (n) =>
        n.toLowerCase().includes(value.toLowerCase()) &&
        !currentNames.includes(n.toLowerCase())
    );
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }

  function handleSelectSuggestion(selected: string) {
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);

    startTransition(async () => {
      const result = await addPlayer(sessionId, selected);
      if (result.success) {
        setName("");
      } else {
        setError(result.error ?? "Failed to add player");
      }
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setSuggestions([]);
    setShowSuggestions(false);

    startTransition(async () => {
      const result = await addPlayer(sessionId, trimmed);
      if (result.success) {
        setName("");
        setError(null);
      } else {
        setError(result.error ?? "Failed to add player");
      }
    });
  }

  function handleRemove(playerId: string) {
    startTransition(async () => {
      await removePlayer(playerId);
    });
  }

  function handleBlur() {
    // Delay so onMouseDown on suggestions fires first
    setTimeout(() => setShowSuggestions(false), 150);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Players</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Input with autocomplete */}
        <div className="relative">
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              ref={inputRef}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Player name..."
              disabled={isPending}
              autoComplete="off"
              className="flex-1"
            />
            <Button type="submit" disabled={isPending || !name.trim()} size="sm">
              Add
            </Button>
          </form>

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card shadow-md">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={() => handleSelectSuggestion(s)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent first:rounded-t-lg last:rounded-b-lg"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Recent players collapsible */}
        {recentPlayers.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setRecentOpen((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{recentOpen ? "▼" : "▶"}</span>
              <span>Recent players</span>
            </button>
            {recentOpen && (
              <div className="mt-2 flex flex-wrap gap-2">
                {recentPlayers.map((p) => {
                  const alreadyAdded = currentNames.includes(p.toLowerCase());
                  return (
                    <button
                      key={p}
                      type="button"
                      disabled={isPending || alreadyAdded}
                      onClick={() => handleSelectSuggestion(p)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        alreadyAdded
                          ? "cursor-default border-border text-muted-foreground opacity-50"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Player list */}
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No players yet
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-3 py-2"
              >
                <span className="font-medium">{p.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                  onClick={() => handleRemove(p.id)}
                  disabled={isPending}
                  aria-label={`Remove ${p.name}`}
                >
                  &times;
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
