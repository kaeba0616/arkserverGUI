"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useServerContext } from "@/hooks/use-server-context";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const GAME_ICONS: Record<string, string> = {
  ark: "A",
  minecraft: "M",
  valheim: "V",
  palworld: "P",
};

function StatusBadge({ state }: { state: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    running: "default",
    stopped: "destructive",
    unknown: "outline",
  };
  const labels: Record<string, string> = {
    running: "실행 중",
    stopped: "중지됨",
    restarting: "재시작 중",
    unknown: "알 수 없음",
  };
  return <Badge variant={variants[state] || "outline"}>{labels[state] || state}</Badge>;
}

export default function ServersPage() {
  const router = useRouter();
  const { data: servers = [], mutate } = useSWR("/api/servers", fetcher, { refreshInterval: 5000 });
  const { setServerId } = useServerContext();

  const handleQuickAction = async (serverId: string, action: string) => {
    await fetch(`/api/server/control?serverId=${serverId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    mutate();
  };

  const handleDelete = async (serverId: string, serverName: string) => {
    if (!window.confirm(`"${serverName}" 서버를 삭제하시겠습니까?\n컨테이너가 제거됩니다.`)) return;
    const deleteData = window.confirm("서버 데이터도 함께 삭제하시겠습니까?");
    await fetch(`/api/servers/${serverId}?deleteData=${deleteData}`, { method: "DELETE" });
    mutate();
  };

  const handleSelect = (serverId: string) => {
    setServerId(serverId);
    router.push("/");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">서버 관리</h2>
        <Button onClick={() => router.push("/servers/new")}>새 서버 추가</Button>
      </div>

      {servers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-lg mb-2">등록된 서버가 없습니다</p>
            <p className="mb-4">새 서버를 추가해서 시작하세요.</p>
            <Button onClick={() => router.push("/servers/new")}>새 서버 추가</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server: { id: string; name: string; gameId: string; gameName: string; status: { state: string }; stats: { cpuPercent: number; memUsageMb: number } | null }) => (
            <Card key={server.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleSelect(server.id)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded bg-muted text-sm font-bold">
                      {GAME_ICONS[server.gameId] || "?"}
                    </span>
                    <div>
                      <CardTitle className="text-sm">{server.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{server.gameName}</p>
                    </div>
                  </div>
                  <StatusBadge state={server.status?.state || "unknown"} />
                </div>
              </CardHeader>
              <CardContent>
                {server.stats && (
                  <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                    <span>CPU: {server.stats.cpuPercent}%</span>
                    <span>RAM: {Math.round(server.stats.memUsageMb)}MB</span>
                  </div>
                )}
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {server.status?.state !== "running" ? (
                    <Button size="sm" variant="outline" onClick={() => handleQuickAction(server.id, "start")}>
                      시작
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleQuickAction(server.id, "stop")}>
                      중지
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(server.id, server.name)}>
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
