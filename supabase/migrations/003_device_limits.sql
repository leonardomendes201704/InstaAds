-- InstaAds Fase 2b: limite por dispositivo (Free), whitelist e solicitações de acesso

CREATE TABLE IF NOT EXISTS device_usage (
  device_id TEXT NOT NULL,
  period_start DATE NOT NULL,
  generation_count INTEGER NOT NULL DEFAULT 0 CHECK (generation_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (device_id, period_start)
);

CREATE TABLE IF NOT EXISTS device_users (
  device_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (device_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_device_users_user ON device_users (user_id);
CREATE INDEX IF NOT EXISTS idx_device_users_device ON device_users (device_id, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS device_whitelist (
  user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE device_access_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS device_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_email TEXT,
  status device_access_request_status NOT NULL DEFAULT 'pending',
  message TEXT NOT NULL DEFAULT '',
  admin_note TEXT NOT NULL DEFAULT '',
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_access_requests_status
  ON device_access_requests (status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_device_access_pending_unique
  ON device_access_requests (device_id, user_id)
  WHERE status = 'pending';

ALTER TABLE device_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_access_requests ENABLE ROW LEVEL SECURITY;
