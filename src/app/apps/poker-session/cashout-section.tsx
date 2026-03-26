"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { setCashout, removeCashout } from "./actions";
import type { PlayerWithDetails } from "@/types/poker-session";

interface CashoutSectionProps {
  players: PlayerWithDetails[];
}

export function CashoutSection({ players }: CashoutSectionProps) {
  const [chipCounts, setChipCounts] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function handleSetCashout(playerId: string) {
    const value = parseFloat(chipCounts[playerId] ?? "");
    if (isNaN(value) || value < 0) return;

    startTransition(async () => {
      await setCashout(playerId, value);
      setChipCounts((prev) => ({ ...prev, [playerId]: "" }));
    });
  }

  function handleRemoveCashout(playerId: string) {
    startTransition(async () => {
      await removeCashout(playerId);
    });
  }

  if (players.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cashout</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-2">
            Add players and buy-ins first
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatAmount = (val: number) =>
    val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const allCashedOut =
    players.length > 0 &&
    players.every((p) => p.cashout !== null) &&
    players.some((p) => p.buyins.length > 0);

  // Validate that total cashout equals total buy-ins (zero-sum check)
  const totalBuyins = players.reduce((sum, p) => sum + p.totalBuyins, 0);
  const totalCashouts = players.reduce(
    (sum, p) => sum + (p.cashout?.chip_count ?? 0),
    0
  );
  const difference = Math.abs(totalCashouts - totalBuyins);
  const isBalanced = difference < 0.01;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cashout</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {players.map((player) => {
          const hasBuyins = player.buyins.length > 0;

          return (
            <div
              key={player.id}
              className="flex flex-col gap-1 border-b border-border pb-2 last:border-0 last:pb-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{player.name}</span>
                <span className="text-xs text-muted-foreground">
                  Buy-ins: {formatAmount(player.totalBuyins)}
                </span>
              </div>

              {player.cashout ? (
                <div className="flex items-center justify-between pl-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      Chips: {formatAmount(player.cashout.chip_count)}
                    </span>
                    {player.netResult !== null && (
                      <Badge
                        variant={
                          player.netResult > 0
                            ? "default"
                            : player.netResult < 0
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {player.netResult >= 0 ? "+" : ""}
                        {formatAmount(player.netResult)}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                    onClick={() => handleRemoveCashout(player.id)}
                    disabled={isPending}
                    aria-label="Remove cashout"
                  >
                    &times;
                  </Button>
                </div>
              ) : hasBuyins ? (
                <div className="flex gap-2 pl-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={chipCounts[player.id] ?? ""}
                    onChange={(e) =>
                      setChipCounts((prev) => ({
                        ...prev,
                        [player.id]: e.target.value,
                      }))
                    }
                    placeholder="Final chips"
                    disabled={isPending}
                    className="w-28"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSetCashout(player.id)}
                    disabled={
                      isPending || !chipCounts[player.id]
                    }
                  >
                    Set
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground pl-2">
                  No buy-ins recorded
                </p>
              )}
            </div>
          );
        })}

        {/* Summary */}
        {allCashedOut && (
          <div className="mt-2 rounded-lg border p-3 text-sm">
            <div className="flex justify-between">
              <span>Total buy-ins:</span>
              <span>{formatAmount(totalBuyins)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total cashouts:</span>
              <span>{formatAmount(totalCashouts)}</span>
            </div>
            {!isBalanced && (
              <p className="mt-1 text-xs text-destructive">
                Warning: difference of {formatAmount(difference)} — chip counts
                may be incorrect.
              </p>
            )}
            {isBalanced && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                Balanced — ready for settlement.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
