-- Add exported_to_results flag to prevent duplicate pushes to Poker Results
ALTER TABLE live_sessions
  ADD COLUMN IF NOT EXISTS exported_to_results BOOLEAN NOT NULL DEFAULT FALSE;
