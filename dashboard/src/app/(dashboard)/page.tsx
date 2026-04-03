"use client";

import { useServerStatus } from "@/hooks/use-server-status";
import { useServerContext } from "@/hooks/use-server-context";
import { StatusCards } from "@/components/status-card";
import { ServerControlPanel } from "@/components/server-control-panel";
import { PlayerTable } from "@/components/player-table";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { data, mutate } = useServerStatus();
  const { serverId } = useServerContext();

  const { data: serverInfo } = useSWR(
    serverId ? `/api/servers/${serverId}` : null,
    fetcher
  );

  const hasUpdateCommand = !!serverInfo?.adapter?.updateCommand;

  if (!serverId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">서버가 없습니다</p>
          <p>서버 관리 페이지에서 새 서버를 추가하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">대시보드</h2>
      <StatusCards data={data} />
      <div className="grid gap-4 md:grid-cols-2">
        <ServerControlPanel
          serverState={data?.status.state || "unknown"}
          hasUpdateCommand={hasUpdateCommand}
          onAction={() => mutate()}
        />
        <PlayerTable players={data?.players || []} />
      </div>
    </div>
  );
}
