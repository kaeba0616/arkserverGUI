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

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.oldPath || !body.newPath) {
    return NextResponse.json({ error: "oldPath and newPath required" }, { status: 400 });
  }

  const fullOld = safePath(ctx.server.data_dir, body.oldPath);
  const fullNew = safePath(ctx.server.data_dir, body.newPath);
  if (!fullOld || !fullNew) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    if (!fs.existsSync(fullOld)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    fs.renameSync(fullOld, fullNew);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Rename failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
