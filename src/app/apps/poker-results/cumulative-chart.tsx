"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { PokerSession, ChartDataPoint } from "@/types/poker-results";

const PLAYER_COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe",
  "#00C49F", "#FFBB28", "#FF8042", "#a4de6c", "#d0ed57",
];

interface CumulativeChartProps {
  sessions: PokerSession[];
}

export function CumulativeChart({ sessions }: CumulativeChartProps) {
  if (sessions.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        No sessions yet. Add your first poker session to see the chart.
      </p>
    );
  }

  // Sort sessions chronologically (oldest first)
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Collect all unique player names
  const allPlayers = new Set<string>();
  for (const s of sorted) {
    for (const r of s.poker_results) {
      allPlayers.add(r.player_name);
    }
  }
  const playerNames = Array.from(allPlayers);

  // Build cumulative data points
  const cumulative: Record<string, number> = {};
  for (const name of playerNames) {
    cumulative[name] = 0;
  }

  const chartData: ChartDataPoint[] = sorted.map((s) => {
    // Add this session's amounts to cumulative totals
    for (const r of s.poker_results) {
      cumulative[r.player_name] = (cumulative[r.player_name] ?? 0) + Number(r.amount);
    }

    const point: ChartDataPoint = {
      date: formatDate(s.date),
    };

    for (const name of playerNames) {
      point[name] = cumulative[name] ?? 0;
    }

    return point;
  });

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {playerNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={PLAYER_COLORS[i % PLAYER_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}
