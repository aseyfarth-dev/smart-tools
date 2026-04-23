"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PokerSession, ChartDataPoint } from "@/types/poker-results";

// Tableau 10 — designed for maximum perceptual distinguishability
const PLAYER_COLORS = [
  "#4e79a7", // steel blue
  "#f28e2b", // orange
  "#e15759", // red
  "#76b7b2", // teal
  "#59a14f", // green
  "#edc948", // gold
  "#b07aa1", // purple
  "#ff9da7", // pink
  "#9c755f", // brown
  "#bab0ac", // gray
];

const DEMO_PLAYER_POOL = ["Alice", "Bob", "Charlie", "Diana", "Erik", "Fiona", "Georg", "Hannah"];

function generateDemoSessions(): PokerSession[] {
  const numPlayers = 4 + Math.floor(Math.random() * 4); // 4–7 players
  const players = DEMO_PLAYER_POOL.slice(0, numPlayers);
  const numSessions = 6 + Math.floor(Math.random() * 7); // 6–12 sessions

  const sessions: PokerSession[] = [];
  let date = new Date("2025-09-01");

  for (let i = 0; i < numSessions; i++) {
    // 1–3 weeks between sessions
    date = new Date(date.getTime() + (7 + Math.floor(Math.random() * 14)) * 86400000);

    // Generate random amounts that sum to zero
    const amounts: number[] = [];
    let running = 0;
    for (let p = 0; p < players.length - 1; p++) {
      const amount = (Math.round((Math.random() * 20 - 10)) * 5); // multiples of 5, −50..+50
      amounts.push(amount);
      running += amount;
    }
    amounts.push(-running); // last player balances the pot

    sessions.push({
      id: `d${i}`,
      user_id: "demo",
      date: date.toISOString().split("T")[0],
      created_at: date.toISOString(),
      poker_results: players.map((name, j) => ({
        id: `r${i}-${j}`,
        session_id: `d${i}`,
        player_name: name,
        amount: amounts[j],
      })),
    });
  }

  return sessions;
}

function formatCurrency(val: number): string {
  const abs = Math.abs(val).toFixed(2);
  return val >= 0 ? `+€${abs}` : `-€${abs}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

interface CumulativeChartProps {
  sessions: PokerSession[];
}

export function CumulativeChart({ sessions }: CumulativeChartProps) {
  const [demoSessions, setDemoSessions] = useState<PokerSession[] | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());

  const activeSessions = demoSessions ?? sessions;

  function handleDemoToggle() {
    if (demoSessions) {
      setDemoSessions(null);
      setSelectedPlayers(new Set());
    } else {
      setDemoSessions(generateDemoSessions());
      setSelectedPlayers(new Set());
    }
  }

  if (activeSessions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p className="text-center text-sm text-muted-foreground">
          No sessions yet. Add your first poker session to see the chart.
        </p>
        <button
          onClick={handleDemoToggle}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Preview with random demo data
        </button>
      </div>
    );
  }

  // Sort sessions chronologically
  const sorted = [...activeSessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Collect all unique player names
  const allPlayers = new Set<string>();
  for (const s of sorted) {
    for (const r of s.poker_results) allPlayers.add(r.player_name);
  }
  const playerNames = Array.from(allPlayers);

  // Build cumulative data points
  const cumulative: Record<string, number> = {};
  for (const name of playerNames) cumulative[name] = 0;

  const chartData: ChartDataPoint[] = sorted.map((s) => {
    for (const r of s.poker_results) {
      cumulative[r.player_name] = (cumulative[r.player_name] ?? 0) + Number(r.amount);
    }
    const point: ChartDataPoint = { date: formatDate(s.date) };
    for (const name of playerNames) point[name] = cumulative[name] ?? 0;
    return point;
  });

  const finalValues: Record<string, number> = { ...cumulative };

  // Color map: stable per player name
  const colorMap: Record<string, string> = {};
  playerNames.forEach((name, i) => {
    colorMap[name] = PLAYER_COLORS[i % PLAYER_COLORS.length];
  });

  // Legend entries sorted best → worst
  const legendEntries = playerNames
    .map((name) => ({ name, color: colorMap[name], value: finalValues[name] ?? 0 }))
    .sort((a, b) => b.value - a.value);

  const hasSelection = selectedPlayers.size > 0;

  function togglePlayer(name: string) {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  const lastIndex = chartData.length - 1;
  const showEndLabels = playerNames.length <= 6;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Demo toggle */}
      <div className="flex justify-end">
        <button
          onClick={handleDemoToggle}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          {demoSessions ? "Show real data" : "Preview with random demo data"}
        </button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: showEndLabels ? 70 : 10, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          {playerNames.map((name) => {
            const color = colorMap[name];
            const isHidden = hasSelection && !selectedPlayers.has(name);
            return (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                hide={isHidden}
                label={
                  showEndLabels && !isHidden
                    ? (props: { x?: number; y?: number; index?: number }) => {
                        if (props.index !== lastIndex)
                          return <g key={`empty-${props.index}`} />;
                        return (
                          <text
                            key={`endlabel-${name}`}
                            x={(props.x ?? 0) + 8}
                            y={props.y ?? 0}
                            fill={color}
                            fontSize={10}
                            dominantBaseline="middle"
                          >
                            {name}
                          </text>
                        );
                      }
                    : undefined
                }
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>

      {/* Custom vertical legend — clickable to filter */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 px-1">
        {legendEntries.map(({ name, color, value }) => {
          const isActive = !hasSelection || selectedPlayers.has(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => togglePlayer(name)}
              className={`flex items-center gap-2 min-w-0 rounded px-1 py-0.5 text-left transition-opacity hover:bg-accent ${
                isActive ? "opacity-100" : "opacity-35"
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="truncate text-xs text-muted-foreground">{name}</span>
              <span
                className={`ml-auto text-xs font-semibold tabular-nums shrink-0 ${
                  value >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
                }`}
              >
                {formatCurrency(value)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Clear selection hint */}
      {hasSelection && (
        <button
          onClick={() => setSelectedPlayers(new Set())}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground self-center"
        >
          Show all players
        </button>
      )}
    </div>
  );
}
