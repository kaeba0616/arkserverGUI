"use client";

import useSWR from "swr";

interface MetricPoint {
  timestamp: number;
  cpuPercent: number;
  memUsageMb: number;
  memLimitMb: number;
  playerCount: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMetrics(range: string = "1h") {
  const { data, error, isLoading } = useSWR<MetricPoint[]>(
    `/api/metrics?range=${range}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  return { data: data || [], error, isLoading };
}
