import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getServerContext, isError } from "@/lib/api-server-context";
import { stopContainer } from "@/lib/docker";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const { server, adapter } = ctx;
  const backupDir = path.join(server.data_dir, "backups");
  const saveDir = path.join(server.data_dir, adapter.savePathRelative);

  const { filename } = await req.json();
  if (!filename || !filename.endsWith(".tar.gz")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const backupPath = path.join(backupDir, path.basename(filename));
  if (!fs.existsSync(backupPath)) {
    return NextResponse.json({ error: "Backup not found" }, { status: 404 });
  }

  try {
    // Stop server
    try {
      await stopContainer(server.container_name, adapter.docker.stopTimeout);
    } catch {
      // May already be stopped
    }

    // Create pre-restore backup
    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15).replace(/(\d{8})(\d{6})/, "$1_$2");
    const preRestoreName = `pre-restore-${timestamp}.tar.gz`;
    try {
      execSync(`tar -czf "${path.join(backupDir, preRestoreName)}" -C "${saveDir}" .`, { timeout: 120000 });
    } catch {
      // Pre-restore backup is best-effort
    }

    // Restore
    execSync(`tar -xzf "${backupPath}" -C "${saveDir}"`, { timeout: 120000 });

    return NextResponse.json({
      success: true,
      message: "백업이 복원되었습니다. 서버를 시작하세요.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Restore failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
