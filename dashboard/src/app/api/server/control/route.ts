import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { serverControlSchema } from "@/lib/validators";
import { startContainer, stopContainer, restartContainer, execInContainer } from "@/lib/docker";
import { saveWorld, broadcast } from "@/lib/rcon";

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await req.json();
  const parsed = serverControlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { action } = parsed.data;

  try {
    switch (action) {
      case "start":
        await startContainer();
        return NextResponse.json({ message: "서버를 시작합니다." });

      case "stop":
        try {
          await saveWorld();
          await broadcast("서버가 30초 후 종료됩니다...");
          await new Promise((r) => setTimeout(r, 30000));
        } catch {
          // RCON may not be available
        }
        await stopContainer();
        return NextResponse.json({ message: "서버를 종료했습니다." });

      case "restart":
        try {
          await broadcast("서버가 60초 후 재시작됩니다...");
          await new Promise((r) => setTimeout(r, 60000));
          await saveWorld();
        } catch {
          // RCON may not be available
        }
        await restartContainer();
        return NextResponse.json({ message: "서버를 재시작합니다." });

      case "update":
        await execInContainer(["arkmanager", "update", "--force"]);
        return NextResponse.json({ message: "서버 업데이트를 시작했습니다. 완료 후 재시작하세요." });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
