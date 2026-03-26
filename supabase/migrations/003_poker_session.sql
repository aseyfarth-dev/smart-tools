-- Poker Session Manager: live session tracking with buy-ins, cashouts, and settlements
-- Run this in the Supabase SQL Editor (SQL > New Query)

-- ============================================================
-- Tables
-- ============================================================

-- Live sessions
CREATE TABLE live_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  settled_at TIMESTAMPTZ
);

-- Players in a session
CREATE TABLE live_session_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Buy-ins per player (supports multiple)
CREATE TABLE live_session_buyins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES live_session_players(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  paid_cash BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Final chip counts at cashout
CREATE TABLE live_session_cashouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES live_session_players(id) ON DELETE CASCADE,
  chip_count DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Settlement transactions between players
CREATE TABLE live_session_settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  from_player TEXT NOT NULL,
  to_player TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  completed BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX live_sessions_user_status_idx ON live_sessions (user_id, status);
CREATE INDEX live_sessions_user_created_idx ON live_sessions (user_id, created_at DESC);
CREATE INDEX live_session_players_session_idx ON live_session_players (session_id);
CREATE INDEX live_session_buyins_player_idx ON live_session_buyins (player_id);
CREATE INDEX live_session_cashouts_player_idx ON live_session_cashouts (player_id);
CREATE INDEX live_session_settlements_session_idx ON live_session_settlements (session_id);

-- ============================================================
-- Row Level Security
-- ============================================================

-- live_sessions: direct user_id check
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON live_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON live_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON live_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON live_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- live_session_players: access through session ownership
ALTER TABLE live_session_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session players"
  ON live_session_players FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM live_sessions
    WHERE live_sessions.id = live_session_players.session_id
      AND live_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own session players"
  ON live_session_players FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM live_sessions
    WHERE live_sessions.id = live_session_players.session_id
      AND live_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own session players"
  ON live_session_players FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM live_sessions
    WHERE live_sessions.id = live_session_players.session_id
      AND live_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own session players"
  ON live_session_players FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM live_sessions
    WHERE live_sessions.id = live_session_players.session_id
      AND live_sessions.user_id = auth.uid()
  ));

-- live_session_buyins: access through player -> session ownership
ALTER TABLE live_session_buyins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session buyins"
  ON live_session_buyins FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM live_session_players
    JOIN live_sessions ON live_sessions.id = live_session_players.session_id
    WHERE live_session_players.id = live_session_buyins.player_id
      AND live_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own session buyins"
  ON live_session_buyins FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM live_session_players
    JOIN live_sessions ON live_sessions.id = live_session_players.session_id
    WHERE live_session_players.id = live_session_buyins.player_id
      AND live_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own session buyins"
  ON live_session_buyins FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM live_session_players
    JOIN live_sessions ON live_sessions.id = live_session_players.session_id
    WHERE live_session_players.id = live_session_buyins.player_id
      AND live_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own session buyins"
  ON live_session_buyins FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM live_session_players
    JOIN live_sessions ON live_sessions.id = live_session_players.session_id
    WHERE live_session_players.id = live_session_buyins.player_id
      AND live_sessions.user_id = auth.uid()
  ));

-- live_session_cashouts: access through player -> session ownership
ALTER TABLE live_session_cashouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session cashouts"
  ON live_session_cashouts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM live_session_players
    JOIN live_sessions ON live_sessions.id = live_session_players.session_id
    WHERE live_session_players.id = live_session_cashouts.player_id
      AND live_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own session cashouts"
  ON live_session_cashouts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM live_session_players
    JOIN live_sessions ON live_sessions.id = live_session_players.session_id
    WHERE live_session_players.id = live_session_cashouts.player_id
      AND live_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own session cashouts"
  ON live_session_cashouts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM live_session_players
    JOIN live_sessions ON live_sessions.id = live_session_players.session_id
    WHERE live_session_players.id = live_session_cashouts.player_id
      AND live_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own session cashouts"
  ON live_session_cashouts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM live_session_players
    JOIN live_sessions ON live_sessions.id = live_session_players.session_id
    WHERE live_session_players.id = live_session_cashouts.player_id
      AND live_sessions.user_id = auth.uid()
  ));

-- live_session_settlements: access through session ownership
ALTER TABLE live_session_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session settlements"
  ON live_session_settlements FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM live_sessions
    WHERE live_sessions.id = live_session_settlements.session_id
      AND live_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own session settlements"
  ON live_session_settlements FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM live_sessions
    WHERE live_sessions.id = live_session_settlements.session_id
      AND live_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own session settlements"
  ON live_session_settlements FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM live_sessions
    WHERE live_sessions.id = live_session_settlements.session_id
      AND live_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own session settlements"
  ON live_session_settlements FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM live_sessions
    WHERE live_sessions.id = live_session_settlements.session_id
      AND live_sessions.user_id = auth.uid()
  ));
