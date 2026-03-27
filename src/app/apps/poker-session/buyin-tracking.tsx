"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addBuyin, removeBuyin, toggleBuyinPaidCash } from "./actions";
import type { PlayerWithDetails } from "@/types/poker-session";

interface BuyinTrackingProps {
  players: PlayerWithDetails[];
}

export function BuyinTracking({ players }: BuyinTrackingProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAddBuyin(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!selectedPlayerId || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Select a player and enter a valid amount");
      return;
    }

    startTransition(async () => {
      const result = await addBuyin(selectedPlayerId, parsedAmount);
      if (result.success) {
        setAmount("");
        setError(null);
      } else {
        setError(result.error ?? "Failed to add buy-in");
      }
    });
  }

  function handleRemoveBuyin(buyinId: string) {
    startTransition(async () => {
      await removeBuyin(buyinId);
    });
  }

  function handleTogglePaidCash(buyinId: string, currentValue: boolean) {
    startTransition(async () => {
      await toggleBuyinPaidCash(buyinId, !currentValue);
    });
  }

  if (players.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buy-ins</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-2">
            Add players first
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalCashInBank = players.reduce((sum, p) => sum + p.cashPaid, 0);

  const formatAmount = (val: number) =>
    val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Buy-ins</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Add buy-in form */}
        <form onSubmit={handleAddBuyin} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isPending}
            >
              <option value="">Select player...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Amount"
              disabled={isPending}
              className="w-28"
            />
            <Button
              type="submit"
              disabled={isPending || !selectedPlayerId || !amount}
              size="sm"
            >
              Add
            </Button>
          </div>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Buy-ins per player */}
        <div className="flex flex-col gap-3">
          {players.map((player) => (
            <div key={player.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{player.name}</span>
                <span className="text-sm text-muted-foreground">
                  Total: {formatAmount(player.totalBuyins)}
                </span>
              </div>
              {player.buyins.length > 0 ? (
                <ul className="flex flex-col gap-1">
                  {player.buyins.map((buyin) => (
                    <li
                      key={buyin.id}
                      className="flex items-center gap-2 pl-2 text-sm"
                    >
                      <span className="flex-1">
                        {formatAmount(buyin.amount)}
                      </span>
                      <Button
                        variant={buyin.paid_cash ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() =>
                          handleTogglePaidCash(buyin.id, buyin.paid_cash)
                        }
                        disabled={isPending}
                      >
                        {buyin.paid_cash ? "Cash paid" : "Mark cash"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                        onClick={() => handleRemoveBuyin(buyin.id)}
                        disabled={isPending}
                        aria-label="Remove buy-in"
                      >
                        &times;
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground pl-2">
                  No buy-ins yet
                </p>
              )}
              {player.cashPaid > 0 && (
                <p className="text-xs text-muted-foreground pl-2">
                  Cash paid to bank: {formatAmount(player.cashPaid)}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Bank balance summary */}
        {totalCashInBank > 0 && (
          <div className="rounded-lg border border-border bg-muted/50 p-3 flex items-center justify-between">
            <span className="text-sm font-medium">Bank balance</span>
            <span className="text-sm font-semibold">
              {formatAmount(totalCashInBank)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
