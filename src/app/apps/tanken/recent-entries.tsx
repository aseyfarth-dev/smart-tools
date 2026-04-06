"use client";

import type { RefuelEntry } from "@/types/tanken";

interface RecentEntriesProps {
  entries: RefuelEntry[];
}

export function RecentEntries({ entries }: RecentEntriesProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Keine Einträge vorhanden.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-2 pr-3 font-medium">Datum</th>
            <th className="pb-2 pr-3 font-medium">Ort</th>
            <th className="pb-2 pr-3 font-medium text-right">Liter</th>
            <th className="pb-2 pr-3 font-medium text-right">EUR</th>
            <th className="pb-2 font-medium text-right">L/100km</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="py-2 pr-3 whitespace-nowrap">{entry.datum}</td>
              <td className="py-2 pr-3">{entry.ort}</td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {entry.liter.toFixed(1)}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {entry.preis.toFixed(2)}
              </td>
              <td className="py-2 text-right tabular-nums">
                {entry.verbrauch != null ? entry.verbrauch.toFixed(1) : "–"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
