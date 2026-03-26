"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSession, updateSession } from "./actions";
import type { PokerSession, PlayerRow } from "@/types/poker-results";

interface AddResultFormProps {
  editSession?: PokerSession | null;
  onDone: () => void;
}

let nextId = 0;
function makeId() {
  return `row-${++nextId}`;
}

function createEmptyRow(): PlayerRow {
  return { id: makeId(), name: "", amount: "" };
}

export function AddResultForm({ editSession, onDone }: AddResultFormProps) {
  const isEditing = !!editSession;

  const [date, setDate] = useState(
    editSession?.date ?? new Date().toISOString().split("T")[0]
  );
  const [players, setPlayers] = useState<PlayerRow[]>(() => {
    if (editSession) {
      return editSession.poker_results.map((r) => ({
        id: makeId(),
        name: r.player_name,
        amount: String(r.amount),
      }));
    }
    return [createEmptyRow(), createEmptyRow()];
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addPlayer() {
    setPlayers((prev) => [...prev, createEmptyRow()]);
  }

  function removePlayer(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  function updatePlayer(id: string, field: "name" | "amount", value: string) {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate
    if (!date) {
      setError("Date is required");
      return;
    }

    const validPlayers = players.filter((p) => p.name.trim() || p.amount.trim());
    if (validPlayers.length === 0) {
      setError("Add at least one player");
      return;
    }

    for (const p of validPlayers) {
      if (!p.name.trim()) {
        setError("All players need a name");
        return;
      }
      if (!p.amount.trim() || isNaN(Number(p.amount))) {
        setError(`Invalid amount for ${p.name}`);
        return;
      }
    }

    const input = {
      date,
      players: validPlayers.map((p) => ({
        name: p.name.trim(),
        amount: Number(p.amount),
      })),
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateSession(editSession!.id, input)
        : await createSession(input);

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
      } else {
        onDone();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing ? "Edit Session" : "New Session"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="session-date">Date</Label>
            <Input
              id="session-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Players</Label>
            {players.map((player, index) => (
              <div key={player.id} className="flex items-center gap-2">
                <Input
                  placeholder="Name"
                  value={player.name}
                  onChange={(e) =>
                    updatePlayer(player.id, "name", e.target.value)
                  }
                  disabled={isPending}
                  className="flex-1"
                />
                <Input
                  placeholder="+/- amount"
                  type="number"
                  step="0.01"
                  value={player.amount}
                  onChange={(e) =>
                    updatePlayer(player.id, "amount", e.target.value)
                  }
                  disabled={isPending}
                  className="w-28"
                />
                {players.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0 shrink-0"
                    onClick={() => removePlayer(player.id)}
                    disabled={isPending}
                    aria-label={`Remove player ${index + 1}`}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPlayer}
              disabled={isPending}
              className="self-start"
            >
              + Add Player
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Update Session"
                  : "Save Session"}
            </Button>
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={onDone}
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
