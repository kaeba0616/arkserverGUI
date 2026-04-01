"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ServerOverview } from "@/types/server";

function formatUptime(seconds: number | null): string {
  if (!seconds) return "-";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}일 ${h}시간 ${m}분`;
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

function StatusBadge({ state }: { state: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    running: { label: "실행 중", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    stopped: { label: "중지됨", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    restarting: { label: "재시작 중", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    paused: { label: "일시정지", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    unknown: { label: "알 수 없음", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  };
  const v = variants[state] || variants.unknown;
  return <Badge variant="outline" className={v.className}>{v.label}</Badge>;
}

export function StatusCards({ data }: { data: ServerOverview | undefined }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">서버 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusBadge state={data?.status.state || "unknown"} />
          <p className="mt-2 text-xs text-muted-foreground">
            업타임: {formatUptime(data?.status.uptime ?? null)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">접속자</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data?.playerCount ?? 0}</div>
          <p className="text-xs text-muted-foreground">명 접속 중</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">CPU</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data?.stats?.cpuPercent?.toFixed(1) ?? "-"}%</div>
          <div className="mt-2 h-2 rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(data?.stats?.cpuPercent ?? 0, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">메모리</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data?.stats ? `${(data.stats.memUsageMb / 1024).toFixed(1)} GB` : "-"}
          </div>
          <p className="text-xs text-muted-foreground">
            / {data?.stats ? `${(data.stats.memLimitMb / 1024).toFixed(1)} GB` : "-"}
          </p>
          <div className="mt-2 h-2 rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${data?.stats ? (data.stats.memUsageMb / data.stats.memLimitMb) * 100 : 0}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
