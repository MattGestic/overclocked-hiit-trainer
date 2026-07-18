-- OVERCLOCKED HIIT FIT — canonical schema
-- Run this whole file in the Supabase SQL Editor for project xilnfrswpirjhzitxahh.
-- Safe to re-run: every statement is idempotent (CREATE ... IF NOT EXISTS /
-- CREATE OR REPLACE / DROP ... IF EXISTS before CREATE TRIGGER).

-- ── programmes ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS programmes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name           TEXT NOT NULL DEFAULT 'New Programme',
  type           TEXT NOT NULL DEFAULT 'HIIT'
                   CHECK (type IN ('HIIT', 'TABATA', 'CIRCUIT', 'AMRAP', 'EMOM')),
  intro_enabled  BOOLEAN NOT NULL DEFAULT true,
  intro_seconds  INT NOT NULL DEFAULT 10 CHECK (intro_seconds BETWEEN 5 AND 60),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── blocks ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id     UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  position         INT NOT NULL DEFAULT 1,
  name             TEXT,                          -- optional label, e.g. "A — Legs and Core"
  repeat_count     INT NOT NULL DEFAULT 3 CHECK (repeat_count >= 1),
  active_seconds   INT NOT NULL DEFAULT 45 CHECK (active_seconds > 0),
  recover_seconds  INT NOT NULL DEFAULT 30 CHECK (recover_seconds >= 0),
  UNIQUE (programme_id, position)
);

-- ── activities ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id    UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  position    INT NOT NULL DEFAULT 1,
  name        TEXT NOT NULL DEFAULT 'Exercise',
  reps        TEXT,                                -- free text: "20", "45s", "10 ea/side"
  weight      TEXT,                                -- free text: "40", "BW"
  notes       TEXT,
  UNIQUE (block_id, position)
);

-- ── session_logs ────────────────────────────────────────────────────────
-- Minimal completed-run record. Drives the Library weekly heatmap (a day
-- with a logged session renders as "done") and History's computed stats
-- (this-week count, streak, all-time hours). Intentionally does not model
-- "missed" / "planned" scheduling — there's no workout-scheduling feature
-- in scope yet, so days without a session render as neutral, not missed.
CREATE TABLE IF NOT EXISTS session_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  programme_id  UUID REFERENCES programmes(id) ON DELETE SET NULL,
  programme_name TEXT NOT NULL,                    -- snapshot at run time, survives programme deletion
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'completed'
                  CHECK (status IN ('completed', 'stopped'))
);

-- ── RLS ─────────────────────────────────────────────────────────────────
ALTER TABLE programmes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own programmes" ON programmes;
CREATE POLICY "Own programmes" ON programmes USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Own blocks" ON blocks;
CREATE POLICY "Own blocks" ON blocks USING (
  programme_id IN (SELECT id FROM programmes WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Own activities" ON activities;
CREATE POLICY "Own activities" ON activities USING (
  block_id IN (SELECT b.id FROM blocks b JOIN programmes p ON p.id = b.programme_id WHERE p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Own session logs" ON session_logs;
CREATE POLICY "Own session logs" ON session_logs USING (user_id = auth.uid());

-- ── updated_at trigger ──────────────────────────────────────────────────
-- programmes.updated_at was never bumped on UPDATE in the original DDL.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS programmes_set_updated_at ON programmes;
CREATE TRIGGER programmes_set_updated_at
BEFORE UPDATE ON programmes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
