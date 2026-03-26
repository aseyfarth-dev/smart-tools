"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CumulativeChart } from "./cumulative-chart";
import { AddResultForm } from "./add-result-form";
import { SessionList } from "./session-list";
import type { PokerSession } from "@/types/poker-results";

interface PokerResultsClientProps {
  sessions: PokerSession[];
}

export function PokerResultsClient({ sessions }: PokerResultsClientProps) {
  const [activeTab, setActiveTab] = useState<string | number>("overview");
  const [editSession, setEditSession] = useState<PokerSession | null>(null);

  function handleEdit(session: PokerSession) {
    setEditSession(session);
    setActiveTab("add");
  }

  function handleDone() {
    setEditSession(null);
    setActiveTab("overview");
  }

  function handleTabChange(value: string | number | null) {
    if (value !== null) {
      setActiveTab(value);
      // Clear edit mode when switching away from add tab
      if (value !== "add") {
        setEditSession(null);
      }
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="w-full">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="add">
          {editSession ? "Edit" : "Add Result"}
        </TabsTrigger>
        <TabsTrigger value="data">Data</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="pt-4">
        <CumulativeChart sessions={sessions} />
      </TabsContent>

      <TabsContent value="add" className="pt-4">
        <AddResultForm
          key={editSession?.id ?? "new"}
          editSession={editSession}
          onDone={handleDone}
        />
      </TabsContent>

      <TabsContent value="data" className="pt-4">
        <SessionList sessions={sessions} onEdit={handleEdit} />
      </TabsContent>
    </Tabs>
  );
}
