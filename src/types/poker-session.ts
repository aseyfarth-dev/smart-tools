export interface LiveSession {
  id: string;
  user_id: string;
  status: "active" | "settled";
  created_at: string;
  settled_at: string | null;
  exported_to_results: boolean;
}

export interface LiveSessionPlayer {
  id: string;
  session_id: string;
  name: string;
  created_at: string;
}

export interface LiveSessionBuyin {
  id: string;
  player_id: string;
  amount: number;
  paid_cash: boolean;
  created_at: string;
}

export interface LiveSessionCashout {
  id: string;
  player_id: string;
  chip_count: number;
  created_at: string;
}

export interface LiveSessionSettlement {
  id: string;
  session_id: string;
  from_player: string;
  to_player: string;
  amount: number;
  completed: boolean;
}

/** Aggregated player data for the UI */
export interface PlayerWithDetails {
  id: string;
  name: string;
  buyins: LiveSessionBuyin[];
  totalBuyins: number;
  cashPaid: number;
  cashout: LiveSessionCashout | null;
  netResult: number | null; // null if not yet cashed out
}

/** Settlement transaction output from the algorithm */
export interface SettlementTransaction {
  fromPlayer: string;
  toPlayer: string;
  amount: number;
}
