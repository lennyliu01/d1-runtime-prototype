# Migrations

Prototype database migrations live here.

- `0001_create_prototype_invocations.sql` creates the Prototype 0 TIME_ROUNDTRIP invocation table.
- `0002_create_prototype_state_versions.sql` creates the Prototype 1 append-only authoritative state-version table.

Apply pending migrations to the remote D1 database with:

```bash
npx wrangler d1 migrations apply d1-runtime-prototype-db --remote
```

The runtime does not create, alter, reset, or delete schema dynamically. Schema changes remain explicit repository-controlled migrations.
