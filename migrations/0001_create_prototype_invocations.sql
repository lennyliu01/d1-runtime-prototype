CREATE TABLE prototype_invocations (
  invocation_id TEXT PRIMARY KEY NOT NULL,
  execution_surface TEXT NOT NULL CHECK (execution_surface IN ('CHAT', 'WORK')),
  trigger_mode TEXT NOT NULL CHECK (trigger_mode IN ('HUMAN', 'SCHEDULE')),
  operation TEXT NOT NULL CHECK (operation = 'TIME_ROUNDTRIP'),
  db_written_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status = 'RECORDED'),
  model TEXT,
  reasoning_level TEXT,
  source_run_key TEXT
);
