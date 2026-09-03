-- InstaAds Fase 1: profiles, generations, activity_events

CREATE TYPE profile_status AS ENUM ('active', 'blocked');

CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  image TEXT,
  status profile_status NOT NULL DEFAULT 'active',
  blocked_at TIMESTAMPTZ,
  blocked_reason TEXT,
  blocked_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

CREATE TABLE generations (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_email TEXT,
  user_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error')),
  ad_category TEXT NOT NULL,
  ad_style TEXT NOT NULL,
  main_message TEXT NOT NULL DEFAULT '',
  publish_target TEXT NOT NULL,
  headline TEXT NOT NULL,
  subheadline TEXT NOT NULL DEFAULT '',
  benefits TEXT[] NOT NULL CHECK (cardinality(benefits) = 3),
  cta TEXT NOT NULL,
  original_path TEXT NOT NULL,
  feed_path TEXT,
  stories_path TEXT,
  error_message TEXT,
  ai_cost JSONB
);

CREATE INDEX idx_generations_user_created ON generations (user_id, created_at DESC);
CREATE INDEX idx_generations_created ON generations (created_at DESC);

CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_created ON activity_events (created_at DESC);
CREATE INDEX idx_activity_user ON activity_events (user_id, created_at DESC);
CREATE INDEX idx_activity_type ON activity_events (type, created_at DESC);

CREATE INDEX idx_profiles_email ON profiles (email);
CREATE INDEX idx_profiles_status ON profiles (status);
CREATE INDEX idx_profiles_created ON profiles (created_at DESC);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- App uses service role on the server (bypasses RLS).

-- Storage: create private bucket "generations" in Supabase Dashboard
-- (Storage → New bucket → name: generations → Public: off)
