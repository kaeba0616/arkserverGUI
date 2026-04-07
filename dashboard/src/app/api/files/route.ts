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

export const dynamic = "force-dynamic";

// List directory
export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const reqPath = req.nextUrl.searchParams.get("path") || "/";
  const fullPath = safePath(ctx.server.data_dir, reqPath);
  if (!fullPath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: "Path not found" }, { status: 404 });
  }

  const stat = fs.statSync(fullPath);
  if (!stat.isDirectory()) {
    return NextResponse.json({ error: "Not a directory" }, { status: 400 });
  }

  const entries = fs.readdirSync(fullPath).map((name) => {
    try {
      const entryPath = path.join(fullPath, name);
      const entryStat = fs.statSync(entryPath);
      return {
        name,
        type: entryStat.isDirectory() ? "directory" : "file",
        size: entryStat.size,
        modifiedAt: entryStat.mtime.toISOString(),
      };
    } catch {
      return { name, type: "file", size: 0, modifiedAt: "" };
    }
  });

  // Sort: directories first, then alphabetical
  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ path: reqPath, entries });
}

// Delete file or directory
export async function DELETE(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const { path: reqPath } = await req.json();
  if (!reqPath || reqPath === "/" || reqPath === ".") {
    return NextResponse.json({ error: "Cannot delete root" }, { status: 400 });
  }

  const fullPath = safePath(ctx.server.data_dir, reqPath);
  if (!fullPath) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(fullPath);
  }

  return NextResponse.json({ success: true });
}
