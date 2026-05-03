-- Supabase migration for Shared Games feature
-- Run in Supabase SQL Editor

-- Create shared_games table
CREATE TABLE IF NOT EXISTS public.shared_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) NOT NULL UNIQUE,
  share_token VARCHAR(64) NOT NULL UNIQUE,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  game_settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  team_settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on code for fast lookups
CREATE INDEX IF NOT EXISTS idx_shared_games_code ON public.shared_games(code);

-- Create index on share_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_shared_games_share_token ON public.shared_games(share_token);

-- Create index on created_by_user_id
CREATE INDEX IF NOT EXISTS idx_shared_games_created_by_user_id ON public.shared_games(created_by_user_id);

-- Create shared_game_card_sets join table
CREATE TABLE IF NOT EXISTS public.shared_game_card_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_game_id UUID NOT NULL REFERENCES public.shared_games(id) ON DELETE CASCADE,
  card_set_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on shared_game_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_shared_game_card_sets_shared_game_id ON public.shared_game_card_sets(shared_game_id);

-- Create index on card_set_id
CREATE INDEX IF NOT EXISTS idx_shared_game_card_sets_card_set_id ON public.shared_game_card_sets(card_set_id);

-- Create composite unique index to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_shared_game_card_sets_unique ON public.shared_game_card_sets(shared_game_id, card_set_id);

-- Enable Row Level Security
ALTER TABLE public.shared_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_game_card_sets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read shared games (they need the code/token to find them anyway)
CREATE POLICY "shared_games_select_all"
ON public.shared_games
FOR SELECT
USING (true);

-- Policy: Authenticated users can create shared games
CREATE POLICY "shared_games_insert_authenticated"
ON public.shared_games
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Only creator can update their shared games
CREATE POLICY "shared_games_update_own"
ON public.shared_games
FOR UPDATE
USING (auth.uid() = created_by_user_id)
WITH CHECK (auth.uid() = created_by_user_id);

-- Policy: Only creator can delete their shared games
CREATE POLICY "shared_games_delete_own"
ON public.shared_games
FOR DELETE
USING (auth.uid() = created_by_user_id);

-- Policy: Anyone can read shared_game_card_sets (access controlled via shared_games)
CREATE POLICY "shared_game_card_sets_select_all"
ON public.shared_game_card_sets
FOR SELECT
USING (true);

-- Policy: Authenticated users can insert card sets for their shared games
CREATE POLICY "shared_game_card_sets_insert_own"
ON public.shared_game_card_sets
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shared_games
    WHERE id = shared_game_id
    AND created_by_user_id = auth.uid()
  )
);

-- Policy: Users can delete card sets from their shared games
CREATE POLICY "shared_game_card_sets_delete_own"
ON public.shared_game_card_sets
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.shared_games
    WHERE id = shared_game_id
    AND created_by_user_id = auth.uid()
  )
);

-- Function to generate unique game code
CREATE OR REPLACE FUNCTION generate_game_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  chars VARCHAR(32) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(8) := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM public.shared_games WHERE code = result) INTO code_exists;
    
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS VARCHAR(64) AS $$
DECLARE
  result VARCHAR(64);
  token_exists BOOLEAN;
BEGIN
  LOOP
    result := encode(gen_random_bytes(32), 'hex');
    
    SELECT EXISTS(SELECT 1 FROM public.shared_games WHERE share_token = result) INTO token_exists;
    
    IF NOT token_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shared_games_updated_at
BEFORE UPDATE ON public.shared_games
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
