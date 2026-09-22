interface Env {
  DB: {
    prepare(query: string): {
      first<T = Record<string, unknown>>(): Promise<T | null>;
    };
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return Response.json({
        service: "d1-runtime-prototype",
        status: "alive",
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

    return Response.json(
      {
        error: "NOT_FOUND",
      },
      { status: 404 },
    );
  },
};
