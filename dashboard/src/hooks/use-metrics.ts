"use client";

import useSWR from "swr";
import { useServerApiUrl } from "./use-server-context";

interface MetricPoint {
  timestamp: number;
  cpuPercent: number;
  memUsageMb: number;
  memLimitMb: number;
  playerCount: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMetrics(range: string = "1h") {
  const url = useServerApiUrl("/api/metrics", { range });

  const { data, error, isLoading } = useSWR<MetricPoint[]>(
    url,
    fetcher,
    { refreshInterval: 30000 }
  );

  return { data: data || [], error, isLoading };
}
