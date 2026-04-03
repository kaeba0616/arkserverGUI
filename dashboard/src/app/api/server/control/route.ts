import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { serverControlSchema } from "@/lib/validators";
import { startContainer, stopContainer, restartContainer, execInContainer } from "@/lib/docker";
import { saveWorld, broadcast } from "@/lib/rcon";
import { getServerContext, isError, getRconConfig } from "@/lib/api-server-context";

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const { server, adapter } = ctx;
  const rconConfig = getRconConfig(server);

  const body = await req.json();
  const parsed = serverControlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { action } = parsed.data;

  try {
    switch (action) {
      case "start":
        await startContainer(server.container_name);
        return NextResponse.json({ message: "서버를 시작합니다." });

      case "stop":
        if (adapter.rcon.supported) {
          try {
            await saveWorld(rconConfig, adapter);
            await broadcast(rconConfig, adapter, "서버가 30초 후 종료됩니다...");
            await new Promise((r) => setTimeout(r, 30000));
          } catch {
            // RCON may not be available
          }
        }
        await stopContainer(server.container_name, adapter.docker.stopTimeout);
        return NextResponse.json({ message: "서버를 종료했습니다." });

      case "restart":
        if (adapter.rcon.supported) {
          try {
            await broadcast(rconConfig, adapter, "서버가 60초 후 재시작됩니다...");
            await new Promise((r) => setTimeout(r, 60000));
            await saveWorld(rconConfig, adapter);
          } catch {
            // RCON may not be available
          }
        }
        await restartContainer(server.container_name, adapter.docker.stopTimeout);
        return NextResponse.json({ message: "서버를 재시작합니다." });

      case "update":
        if (!adapter.updateCommand) {
          return NextResponse.json({ error: "이 게임은 업데이트 명령을 지원하지 않습니다." }, { status: 400 });
        }
        await execInContainer(server.container_name, adapter.updateCommand);
        return NextResponse.json({ message: "서버 업데이트를 시작했습니다. 완료 후 재시작하세요." });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
