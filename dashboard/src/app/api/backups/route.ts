import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getServerContext, isError, getRconConfig } from "@/lib/api-server-context";
import { sendCommand } from "@/lib/rcon";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import type { BackupInfo } from "@/types/backup";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const backupDir = path.join(ctx.server.data_dir, "backups");

  if (!fs.existsSync(backupDir)) {
    return NextResponse.json([]);
  }

  const files = fs.readdirSync(backupDir)
    .filter((f) => f.endsWith(".tar.gz"))
    .map((filename): BackupInfo => {
      const stat = fs.statSync(path.join(backupDir, filename));
      return {
        filename,
        size: stat.size,
        createdAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(files);
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const { server, adapter } = ctx;
  const backupDir = path.join(server.data_dir, "backups");
  const saveDir = path.join(server.data_dir, adapter.savePathRelative);

  try {
    // Try to save world via RCON first
    if (adapter.rcon.supported && adapter.saveCommand) {
      try {
        const rconConfig = getRconConfig(server);
        await sendCommand(rconConfig, adapter.saveCommand);
        await new Promise((r) => setTimeout(r, 5000));
      } catch {
        // RCON may not be available
      }
    }

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15).replace(/(\d{8})(\d{6})/, "$1_$2");
    const filename = `${adapter.backupPrefix}-${timestamp}.tar.gz`;
    const backupPath = path.join(backupDir, filename);

    execSync(
      `tar -czf "${backupPath}" -C "${saveDir}" . 2>/dev/null || true`,
      { timeout: 120000 }
    );

    return NextResponse.json({ success: true, filename, message: "백업이 생성되었습니다." });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Backup failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const backupDir = path.join(ctx.server.data_dir, "backups");
  const { filename } = await req.json();

  if (!filename || !filename.endsWith(".tar.gz")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const filePath = path.join(backupDir, path.basename(filename));
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  fs.unlinkSync(filePath);
  return NextResponse.json({ success: true, message: "백업이 삭제되었습니다." });
}
