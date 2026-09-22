# D1 Runtime Prototype

Prototype-only Cloudflare Worker project for testing a shared runtime path before any WorkOS integration.

## Current scope

This repository currently proves only the deployment path:

GitHub -> Cloudflare Worker

The Worker exposes one health endpoint:

- `GET /` -> JSON with `status: "alive"`

D1, persistence operations, authentication, MCP, Chat/Work adapters, and scheduled execution are not implemented yet.

## Local commands

```bash
npm install
npm run typecheck
npm run dev
```

Deploy through Cloudflare after connecting this repository, or manually with:

```bash
npm run deploy
```

## Authority boundary

- GitHub: source code
- Cloudflare Worker: runtime execution
- D1: persistent data authority, once added
