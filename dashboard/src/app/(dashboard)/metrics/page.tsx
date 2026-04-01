"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMetrics } from "@/hooks/use-metrics";
import { CpuChart, MemoryChart, PlayerChart } from "@/components/metrics-chart";

const RANGES = [
  { label: "1시간", value: "1h" },
  { label: "6시간", value: "6h" },
  { label: "24시간", value: "24h" },
  { label: "7일", value: "7d" },
];

export default function MetricsPage() {
  const [range, setRange] = useState("1h");
  const { data, isLoading } = useMetrics(range);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">메트릭</h2>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={range === r.value ? "default" : "outline"}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">로딩 중...</p>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground">데이터가 없습니다. 메트릭 수집이 시작되면 표시됩니다.</p>
      ) : (
        <div className="space-y-4">
          <CpuChart data={data} />
          <MemoryChart data={data} />
          <PlayerChart data={data} />
        </div>
      )}
    </div>
  );
}
