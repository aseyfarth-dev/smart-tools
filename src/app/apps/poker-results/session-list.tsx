"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { deleteSession } from "./actions";
import type { PokerSession } from "@/types/poker-results";

interface SessionListProps {
  sessions: PokerSession[];
  onEdit: (session: PokerSession) => void;
}

export function SessionList({ sessions, onEdit }: SessionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (sessions.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        No sessions recorded yet.
      </p>
    );
  }

  // Sort newest first
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  function handleDelete(sessionId: string) {
    setDeletingId(sessionId);
    startTransition(async () => {
      await deleteSession(sessionId);
      setDeletingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((session) => {
        // Sort results: highest win to highest loss
        const sortedResults = [...session.poker_results].sort(
          (a, b) => Number(b.amount) - Number(a.amount)
        );

        return (
          <Card key={session.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">
                  {formatDate(session.date)}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(session)}
                    className="h-7 px-2 text-xs"
                  >
                    Edit
                  </Button>
                  <DeleteDialog
                    sessionDate={formatDate(session.date)}
                    onConfirm={() => handleDelete(session.id)}
                    isPending={isPending && deletingId === session.id}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sortedResults.map((result) => {
                  const amount = Number(result.amount);
                  const isPositive = amount >= 0;
                  return (
                    <Badge
                      key={result.id}
                      variant={isPositive ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {result.player_name}:{" "}
                      {isPositive ? "+" : ""}
                      {amount.toFixed(2)}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DeleteDialog({
  sessionDate,
  onConfirm,
  isPending,
}: {
  sessionDate: string;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
          />
        }
      >
        Delete
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Session</DialogTitle>
          <DialogDescription>
            Delete the session from {sessionDate}? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" disabled={isPending} />
            }
          >
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
