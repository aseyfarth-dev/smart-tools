"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  generateSettlements,
  toggleSettlementCompleted,
  settleSession,
} from "./actions";
import type {
  LiveSessionSettlement,
  PlayerWithDetails,
} from "@/types/poker-session";

interface SettlementSectionProps {
  sessionId: string;
  players: PlayerWithDetails[];
  settlements: LiveSessionSettlement[];
}

export function SettlementSection({
  sessionId,
  players,
  settlements,
}: SettlementSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newRoundOpen, setNewRoundOpen] = useState(false);

  const allCashedOut =
    players.length > 0 &&
    players.every((p) => p.cashout !== null) &&
    players.some((p) => p.buyins.length > 0);

  const allSettled =
    settlements.length > 0 && settlements.every((s) => s.completed);

  function handleGenerateSettlements() {
    startTransition(async () => {
      const result = await generateSettlements(sessionId, players);
      if (!result.success) {
        setError(result.error ?? "Failed to generate settlements");
      } else {
        setError(null);
      }
    });
  }

  function handleToggle(settlementId: string, currentCompleted: boolean) {
    startTransition(async () => {
      await toggleSettlementCompleted(settlementId, !currentCompleted);
    });
  }

  function handleNewRound() {
    startTransition(async () => {
      const result = await settleSession(sessionId);
      if (result.success) {
        setNewRoundOpen(false);
      } else {
        setError(result.error ?? "Failed to settle session");
      }
    });
  }

  const formatAmount = (val: number) =>
    val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Settlement</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!allCashedOut ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            All players must cash out before settling
          </p>
        ) : settlements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-sm text-muted-foreground">
              Ready to calculate settlements
            </p>
            <Button
              onClick={handleGenerateSettlements}
              disabled={isPending}
              size="sm"
            >
              {isPending ? "Calculating..." : "Calculate Settlements"}
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {settlements.map((s) => (
                <li
                  key={s.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                    s.completed
                      ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                      : "border-border"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(s.id, s.completed)}
                    disabled={isPending}
                    className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                      s.completed
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-muted-foreground"
                    }`}
                    aria-label={
                      s.completed
                        ? "Mark as incomplete"
                        : "Mark as completed"
                    }
                  >
                    {s.completed && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      s.completed
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    <span className="font-medium">{s.from_player}</span> pays{" "}
                    <span className="font-medium">{s.to_player}</span>:{" "}
                    <span className="font-semibold">
                      {formatAmount(s.amount)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {settlements.filter((s) => s.completed).length}/
                {settlements.length} completed
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSettlements}
                disabled={isPending}
              >
                Recalculate
              </Button>
            </div>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* New Round */}
        {allSettled && (
          <div className="mt-2 border-t border-border pt-3">
            <Dialog open={newRoundOpen} onOpenChange={setNewRoundOpen}>
              <DialogTrigger
                render={
                  <Button className="w-full" variant="default" />
                }
              >
                Start New Round
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Round?</DialogTitle>
                  <DialogDescription>
                    This will mark the current session as settled. You can then
                    start a fresh session with new players and buy-ins.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                    Cancel
                  </DialogClose>
                  <Button
                    onClick={handleNewRound}
                    disabled={isPending}
                    variant="default"
                  >
                    {isPending ? "Settling..." : "Confirm"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
