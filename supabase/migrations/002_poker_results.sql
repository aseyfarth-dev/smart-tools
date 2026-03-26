-- Poker Results Tracker: stores poker session results per player
-- Run this in the Supabase SQL Editor (SQL > New Query)

-- Sessions table: one entry per poker session (date)
CREATE TABLE poker_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for listing sessions by date
CREATE INDEX poker_sessions_user_date_idx ON poker_sessions (user_id, date DESC);

-- Results table: one entry per player per session
CREATE TABLE poker_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES poker_sessions(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL
);

-- Index for fetching results by session
CREATE INDEX poker_results_session_idx ON poker_results (session_id);

-- Row Level Security: users can only access their own sessions
ALTER TABLE poker_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON poker_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON poker_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON poker_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON poker_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Row Level Security for results: access through session ownership
ALTER TABLE poker_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results"
  ON poker_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM poker_sessions
      WHERE poker_sessions.id = poker_results.session_id
      AND poker_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own results"
  ON poker_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM poker_sessions
      WHERE poker_sessions.id = poker_results.session_id
      AND poker_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own results"
  ON poker_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM poker_sessions
      WHERE poker_sessions.id = poker_results.session_id
      AND poker_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own results"
  ON poker_results FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM poker_sessions
      WHERE poker_sessions.id = poker_results.session_id
      AND poker_sessions.user_id = auth.uid()
    )
  );
