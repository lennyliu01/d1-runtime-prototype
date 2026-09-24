-- WorkOS D1 candidate persistence schema.
-- Non-authoritative until the accepted WorkOS D1 cutover lifecycle reaches T0.
-- Business semantics remain owned by existing Dataset / Workflow / Role contracts.

CREATE TABLE workos_append_records (
  append_seq INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_id TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  record_key TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  invocation_id TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  db_written_at TEXT NOT NULL,
  UNIQUE (dataset_id, instance_id, record_key)
);

CREATE INDEX idx_workos_append_stream
  ON workos_append_records (dataset_id, instance_id, append_seq);

CREATE TABLE workos_current_state_versions (
  dataset_id TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 1),
  previous_version INTEGER NOT NULL CHECK (previous_version >= 0),
  payload_json TEXT NOT NULL,
  invocation_id TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  db_written_at TEXT NOT NULL,
  PRIMARY KEY (dataset_id, instance_id, version),
  CHECK (
    (version = 1 AND previous_version = 0)
    OR
    (version > 1 AND previous_version = version - 1)
  )
);

CREATE INDEX idx_workos_current_lookup
  ON workos_current_state_versions (dataset_id, instance_id, version DESC);
