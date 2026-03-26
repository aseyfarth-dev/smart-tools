export interface PokerResult {
  id: string;
  session_id: string;
  player_name: string;
  amount: number;
}

export interface PokerSession {
  id: string;
  user_id: string;
  date: string;
  created_at: string;
  poker_results: PokerResult[];
}

/** Player row in the add/edit form (client-side only) */
export interface PlayerRow {
  id: string; // client-side key for React
  name: string;
  amount: string;
}

/** Data point for cumulative chart */
export interface ChartDataPoint {
  date: string;
  [playerName: string]: number | string;
}
