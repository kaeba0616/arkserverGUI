import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rconCommandSchema } from "@/lib/validators";
import { sendCommand } from "@/lib/rcon";

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await req.json();
  const parsed = rconCommandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid command" }, { status: 400 });
  }

  try {
    const response = await sendCommand(parsed.data.command);
    return NextResponse.json({ response });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "RCON error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
