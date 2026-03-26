"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addPlayer, removePlayer } from "./actions";
import type { LiveSessionPlayer } from "@/types/poker-session";

interface PlayerManagementProps {
  sessionId: string;
  players: LiveSessionPlayer[];
}

export function PlayerManagement({
  sessionId,
  players,
}: PlayerManagementProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const result = await addPlayer(sessionId, name);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Players</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Player name..."
            disabled={isPending}
            className="flex-1"
          />
          <Button type="submit" disabled={isPending || !name.trim()} size="sm">
            Add
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}

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
