import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getServerContext, isError } from "@/lib/api-server-context";
import fs from "fs";
import path from "path";

function safePath(dataDir: string, reqPath: string): string | null {
  const resolved = path.resolve(dataDir, reqPath.replace(/^\//, ""));
  if (!resolved.startsWith(path.resolve(dataDir))) return null;
  return resolved;
}

export async function PUT(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const reqPath = req.nextUrl.searchParams.get("path") || "";
  if (!reqPath) {
    return NextResponse.json({ error: "Path required" }, { status: 400 });
  }

  const fullPath = safePath(ctx.server.data_dir, reqPath);
  if (!fullPath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const { content } = await req.json();
  if (typeof content !== "string") {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  // Ensure parent directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content);
  return NextResponse.json({ success: true, message: "파일이 저장되었습니다." });
}
