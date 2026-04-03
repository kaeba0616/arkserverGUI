import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { readConfigFile, writeConfigFile } from "@/lib/config/config-reader";
import { iniUpdateSchema } from "@/lib/validators";
import { getServerContext, isError } from "@/lib/api-server-context";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const fileIndex = parseInt(req.nextUrl.searchParams.get("fileIndex") || "0");
  const configFile = ctx.adapter.configFiles[fileIndex];
  if (!configFile) {
    return NextResponse.json({ error: "Config file not found" }, { status: 404 });
  }

  const filePath = path.join(ctx.server.data_dir, configFile.relativePath);
  const data = readConfigFile(filePath, configFile.format);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const fileIndex = parseInt(req.nextUrl.searchParams.get("fileIndex") || "0");
  const configFile = ctx.adapter.configFiles[fileIndex];
  if (!configFile) {
    return NextResponse.json({ error: "Config file not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = iniUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const filePath = path.join(ctx.server.data_dir, configFile.relativePath);
  writeConfigFile(filePath, configFile.format, parsed.data);
  return NextResponse.json({ success: true, message: "설정이 저장되었습니다. 서버를 재시작하세요." });
}
