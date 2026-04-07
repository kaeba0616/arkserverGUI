import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getServerContext, isError } from "@/lib/api-server-context";
import fs from "fs";
import path from "path";

const EDITABLE_EXTENSIONS = new Set([
  ".txt", ".json", ".yml", ".yaml", ".properties", ".ini", ".cfg",
  ".conf", ".log", ".sh", ".bat", ".xml", ".toml", ".env", ".md",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function safePath(dataDir: string, reqPath: string): string | null {
  const resolved = path.resolve(dataDir, reqPath.replace(/^\//, ""));
  if (!resolved.startsWith(path.resolve(dataDir))) return null;
  return resolved;
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    return NextResponse.json({ error: "Is a directory" }, { status: 400 });
  }

  if (stat.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "파일이 너무 큽니다 (최대 5MB)" }, { status: 400 });
  }

  const ext = path.extname(fullPath).toLowerCase();
  const editable = EDITABLE_EXTENSIONS.has(ext);

  if (!editable) {
    return NextResponse.json({
      editable: false,
      size: stat.size,
      message: "바이너리 파일은 편집할 수 없습니다.",
    });
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  return NextResponse.json({ editable: true, content, size: stat.size });
}
