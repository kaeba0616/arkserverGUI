import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { readEnv, writeEnv } from "@/lib/config/env-parser";
import { envUpdateSchema } from "@/lib/validators";
import { getServerContext, isError } from "@/lib/api-server-context";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  const envPath = path.join(ctx.server.data_dir, "config", ".env");
  const env = readEnv(envPath);
  return NextResponse.json(env);
}

export async function PUT(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const ctx = getServerContext(req);
  if (isError(ctx)) return ctx;

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = envUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const envPath = path.join(ctx.server.data_dir, "config", ".env");
  writeEnv(envPath, parsed.data);
  return NextResponse.json({ success: true, message: "설정이 저장되었습니다. 서버를 재시작하세요." });
}
