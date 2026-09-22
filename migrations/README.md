# Migrations

Prototype 0 database migrations live here.

- `0001_create_prototype_invocations.sql` creates the single logical Prototype 0 invocation table.
- The migration is applied to the remote D1 database with:

```bash
npx wrangler d1 migrations apply d1-runtime-prototype-db --remote
```

The runtime does not create or alter schema dynamically. Schema changes remain explicit repository-controlled migrations.
