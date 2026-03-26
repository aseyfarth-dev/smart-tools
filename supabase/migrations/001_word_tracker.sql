-- Word Tracker: stores toddler's first words
-- Run this in the Supabase SQL Editor (SQL > New Query)

-- Enable the pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Words table
CREATE TABLE words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  word_normalized TEXT GENERATED ALWAYS AS (LOWER(TRIM(word))) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Unique constraint: one user can't have the same word twice (case-insensitive)
CREATE UNIQUE INDEX words_user_word_unique ON words (user_id, word_normalized);

-- Index for fuzzy search using trigrams
CREATE INDEX words_word_trgm_idx ON words USING GIN (word_normalized gin_trgm_ops);

-- Index for listing words by date
CREATE INDEX words_user_created_idx ON words (user_id, created_at DESC);

-- Row Level Security: users can only access their own words
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own words"
  ON words FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own words"
  ON words FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own words"
  ON words FOR DELETE
  USING (auth.uid() = user_id);
