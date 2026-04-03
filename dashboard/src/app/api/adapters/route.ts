import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getAllAdapters } from "@/lib/adapters";

export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const adapters = getAllAdapters().map((a) => ({
    id: a.id,
    displayName: a.displayName,
    icon: a.icon,
    ports: a.ports,
    rcon: a.rcon,
    settingsFields: a.settingsFields,
    docker: {
      image: a.docker.image,
      resources: a.docker.resources,
    },
  }));

  return NextResponse.json(adapters);
}
