CREATE TABLE prototype_state_versions (
  state_key TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 1),
  state_value TEXT NOT NULL,
  previous_version INTEGER NOT NULL CHECK (previous_version >= 0),
  previous_state TEXT,
  invocation_id TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  execution_surface TEXT NOT NULL CHECK (execution_surface IN ('CHAT', 'WORK')),
  trigger_mode TEXT NOT NULL CHECK (trigger_mode IN ('HUMAN', 'SCHEDULE')),
  operation TEXT NOT NULL CHECK (operation = 'STATE_COMPARE_AND_SET'),
  db_written_at TEXT NOT NULL,
  source_run_key TEXT,
  PRIMARY KEY (state_key, version)
);
