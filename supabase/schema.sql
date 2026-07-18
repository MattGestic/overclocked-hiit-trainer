-- OVERCLOCKED HIIT FIT — canonical schema
-- Run this whole file in the Supabase SQL Editor for project xilnfrswpirjhzitxahh.
-- Safe to re-run: every statement is idempotent (CREATE ... IF NOT EXISTS /
-- CREATE OR REPLACE / DROP ... IF EXISTS before CREATE TRIGGER).
--
-- IMPORTANT: `CREATE TABLE IF NOT EXISTS` only creates a table that's
-- entirely missing — it does NOT add new columns to a table that already
-- exists from an earlier, narrower version of this file (this bit a real
-- run: `programmes` was created before `type` was added here, and re-running
-- the file silently left the column missing). Every column below also has
-- a matching `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, so re-running this
-- file heals column drift too, not just missing tables.

-- ── programmes ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS programmes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE
);

ALTER TABLE programmes ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'New Programme';
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'HIIT'
  CHECK (type IN ('HIIT', 'TABATA', 'CIRCUIT', 'AMRAP', 'EMOM'));
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS intro_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS intro_seconds INT NOT NULL DEFAULT 10
  CHECK (intro_seconds BETWEEN 5 AND 60);
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE programmes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ── blocks ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id   UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE
);

ALTER TABLE blocks ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 1;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS name TEXT; -- optional label, e.g. "A — Legs and Core"
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS repeat_count INT NOT NULL DEFAULT 3 CHECK (repeat_count >= 1);
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS active_seconds INT NOT NULL DEFAULT 45 CHECK (active_seconds > 0);
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS recover_seconds INT NOT NULL DEFAULT 30 CHECK (recover_seconds >= 0);

DO $$ BEGIN
  ALTER TABLE blocks ADD CONSTRAINT blocks_programme_id_position_key UNIQUE (programme_id, position);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── activities ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id    UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE
);

ALTER TABLE activities ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 1;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Exercise';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS reps TEXT;   -- free text: "20", "45s", "10 ea/side"
ALTER TABLE activities ADD COLUMN IF NOT EXISTS weight TEXT; -- free text: "40", "BW"
ALTER TABLE activities ADD COLUMN IF NOT EXISTS notes TEXT;

DO $$ BEGIN
  ALTER TABLE activities ADD CONSTRAINT activities_block_id_position_key UNIQUE (block_id, position);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
