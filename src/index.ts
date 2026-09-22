export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return Response.json({
        service: "d1-runtime-prototype",
        status: "alive",
      });
    }

    return Response.json(
      {
        error: "NOT_FOUND",
      },
      { status: 404 },
    );
  },
};
