import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getContainerLogStream } from "@/lib/docker";
import { getServerContext, isError } from "@/lib/api-server-context";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const { server } = ctx;

  try {
    const logStream = getContainerLogStream(server.container_name, 200);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        logStream.on("data", (chunk: Buffer) => {
          const lines = chunk.toString().split("\n").filter(Boolean);
          for (const line of lines) {
            const clean = line.length > 8 ? line.slice(8) : line;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(clean)}\n\n`));
          }
        });

        logStream.on("end", () => {
          controller.close();
        });

        logStream.on("error", () => {
          controller.close();
        });
      },
      cancel() {
        if ("destroy" in logStream && typeof logStream.destroy === "function") {
          logStream.destroy();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to stream logs" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
