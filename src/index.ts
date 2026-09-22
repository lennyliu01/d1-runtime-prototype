type ExecutionSurface = "CHAT" | "WORK";
type TriggerMode = "HUMAN" | "SCHEDULE";

interface D1RunResult {
  success: boolean;
  error?: string;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1RunResult>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface Env {
  DB: D1Database;
  RUNTIME_SECRET?: string;
}

interface TimeRoundtripRequest {
  execution_surface: ExecutionSurface;
  trigger_mode: TriggerMode;
  operation: "TIME_ROUNDTRIP";
  model?: string;
  reasoning_level?: string;
  source_run_key?: string;
}

interface StoredInvocation {
  invocation_id: string;
  execution_surface: ExecutionSurface;
  trigger_mode: TriggerMode;
  operation: "TIME_ROUNDTRIP";
  db_written_at: string;
  status: "RECORDED";
  model: string | null;
  reasoning_level: string | null;
  source_run_key: string | null;
  db_read_at: string;
}

const ALLOWED_REQUEST_FIELDS = new Set([
  "execution_surface",
  "trigger_mode",
  "operation",
  "model",
  "reasoning_level",
  "source_run_key",
]);

function jsonError(error: string, statusCode: number): Response {
  return Response.json(
    {
      status: "FAILED",
      error,
    },
    { status: statusCode },
  );
}

function isOptionalBoundedString(value: unknown, maxLength = 256): boolean {
  return value === undefined || (typeof value === "string" && value.length <= maxLength);
}

function validateRequestBody(body: unknown): body is TimeRoundtripRequest {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return false;
  }

  const record = body as Record<string, unknown>;

  for (const key of Object.keys(record)) {
    if (!ALLOWED_REQUEST_FIELDS.has(key)) {
      return false;
    }
  }

  if (record.execution_surface !== "CHAT" && record.execution_surface !== "WORK") {
    return false;
  }

  if (record.trigger_mode !== "HUMAN" && record.trigger_mode !== "SCHEDULE") {
    return false;
  }

  if (record.operation !== "TIME_ROUNDTRIP") {
    return false;
  }

  return (
    isOptionalBoundedString(record.model) &&
    isOptionalBoundedString(record.reasoning_level) &&
    isOptionalBoundedString(record.source_run_key)
  );
}

async function handleTimeRoundtrip(request: Request, env: Env): Promise<Response> {
  if (!env.RUNTIME_SECRET) {
    return jsonError("RUNTIME_NOT_CONFIGURED", 503);
  }

  const authorization = request.headers.get("Authorization");
  if (authorization !== `Bearer ${env.RUNTIME_SECRET}`) {
    return jsonError("UNAUTHORIZED", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_REQUEST", 400);
  }

  if (!validateRequestBody(body)) {
    return jsonError("INVALID_REQUEST", 400);
  }

  const invocationId = crypto.randomUUID();

  try {
    const writeResult = await env.DB.prepare(
      `INSERT INTO prototype_invocations (
        invocation_id,
        execution_surface,
        trigger_mode,
        operation,
        db_written_at,
        status,
        model,
        reasoning_level,
        source_run_key
      ) VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'RECORDED', ?, ?, ?)`,
    )
      .bind(
        invocationId,
        body.execution_surface,
        body.trigger_mode,
        body.operation,
        body.model ?? null,
        body.reasoning_level ?? null,
        body.source_run_key ?? null,
      )
      .run();

    if (!writeResult.success) {
      return jsonError("PERSISTENCE_WRITE_FAILED", 500);
    }
  } catch {
    return jsonError("PERSISTENCE_WRITE_FAILED", 500);
  }

  let stored: StoredInvocation | null;
  try {
    stored = await env.DB.prepare(
      `SELECT
        invocation_id,
        execution_surface,
        trigger_mode,
        operation,
        db_written_at,
        status,
        model,
        reasoning_level,
        source_run_key,
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now') AS db_read_at
      FROM prototype_invocations
      WHERE invocation_id = ?
      LIMIT 1`,
    )
      .bind(invocationId)
      .first<StoredInvocation>();
  } catch {
    return jsonError("READBACK_FAILED", 500);
  }

  if (!stored) {
    return jsonError("READBACK_NOT_FOUND", 500);
  }

  if (
    stored.invocation_id !== invocationId ||
    stored.execution_surface !== body.execution_surface ||
    stored.trigger_mode !== body.trigger_mode ||
    stored.operation !== body.operation ||
    stored.status !== "RECORDED"
  ) {
    return jsonError("READBACK_MISMATCH", 500);
  }

  return Response.json({
    status: "SUCCESS",
    invocation_id: stored.invocation_id,
    execution_surface: stored.execution_surface,
    trigger_mode: stored.trigger_mode,
    operation: stored.operation,
    db_written_at: stored.db_written_at,
    db_read_at: stored.db_read_at,
    stored_status: stored.status,
    model: stored.model,
    reasoning_level: stored.reasoning_level,
    source_run_key: stored.source_run_key,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return Response.json({
        service: "d1-runtime-prototype",
        status: "alive",
        version: "prototype0-persistence-core",
      });
    }

    if (request.method === "GET" && url.pathname === "/d1-check") {
      try {
        const result = await env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();

        return Response.json({
          service: "d1-runtime-prototype",
          d1: result?.ok === 1 ? "connected" : "unexpected_result",
        });
      } catch {
        return Response.json(
          {
            service: "d1-runtime-prototype",
            d1: "error",
          },
          { status: 500 },
        );
      }
    }

    if (request.method === "POST" && url.pathname === "/prototype/time-roundtrip") {
      return handleTimeRoundtrip(request, env);
    }

    return Response.json(
      {
        error: "NOT_FOUND",
      },
      { status: 404 },
    );
  },
};
