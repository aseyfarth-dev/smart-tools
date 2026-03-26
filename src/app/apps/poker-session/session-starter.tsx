"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createSession } from "./actions";

export function SessionStarter() {
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    startTransition(async () => {
      await createSession();
    });
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <Button onClick={handleStart} disabled={isPending} size="lg">
        {isPending ? "Starting..." : "Start New Session"}
      </Button>
    </div>
  );
}
