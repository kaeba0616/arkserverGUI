import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { readGameIni, writeGameIni } from "@/lib/config/ini-parser";
import { iniUpdateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const settings = readGameIni();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await req.json();
  const parsed = iniUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  writeGameIni(parsed.data);
  return NextResponse.json({ success: true, message: "설정이 저장되었습니다. 서버를 재시작하세요." });
}
