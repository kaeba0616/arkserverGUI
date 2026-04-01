import { requireAuth } from "@/lib/api-auth";
import { getContainerLogStream } from "@/lib/docker";

export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const logStream = getContainerLogStream(200);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        logStream.on("data", (chunk: Buffer) => {
          const lines = chunk.toString().split("\n").filter(Boolean);
          for (const line of lines) {
            // Docker log stream has 8-byte header per line, skip it
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
