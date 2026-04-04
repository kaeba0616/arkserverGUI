import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getServer, updateServer, deleteServer } from "@/lib/server-registry";
import { removeContainer, containerExists } from "@/lib/docker";
import { getAdapter } from "@/lib/adapters";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const server = getServer(id);
  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  const adapter = getAdapter(server.game_id);

  return NextResponse.json({
    ...server,
    gameName: adapter.displayName,
    adapter: {
      id: adapter.id,
      displayName: adapter.displayName,
      settingsFields: adapter.settingsFields,
      configFiles: adapter.configFiles,
      extraNavItems: adapter.extraNavItems,
      quickCommands: adapter.quickCommands,
      rcon: adapter.rcon,
      updateCommand: adapter.updateCommand,
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();

  const updated = updateServer(id, body);
  if (!updated) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, server: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const server = getServer(id);
  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  const deleteData = req.nextUrl.searchParams.get("deleteData") === "true";

  // Remove Docker container
  try {
    if (await containerExists(server.container_name)) {
      await removeContainer(server.container_name);
    }
  } catch {
    // Container may not exist
  }

  // Delete from DB
  deleteServer(id);

  // Optionally delete data directory
  if (deleteData && fs.existsSync(server.data_dir)) {
    fs.rmSync(server.data_dir, { recursive: true, force: true });
  }

  return NextResponse.json({ success: true, message: `서버 "${server.name}"이 삭제되었습니다.` });
}
