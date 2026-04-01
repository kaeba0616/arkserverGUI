"use client";

import { useServerStatus } from "@/hooks/use-server-status";
import { StatusCards } from "@/components/status-card";
import { ServerControlPanel } from "@/components/server-control-panel";
import { PlayerTable } from "@/components/player-table";

export default function DashboardPage() {
  const { data, mutate } = useServerStatus();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">대시보드</h2>
      <StatusCards data={data} />
      <div className="grid gap-4 md:grid-cols-2">
        <ServerControlPanel
          serverState={data?.status.state || "unknown"}
          onAction={() => mutate()}
        />
        <PlayerTable players={data?.players || []} />
      </div>
    </div>
  );
}
