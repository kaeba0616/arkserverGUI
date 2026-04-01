"use client";

import useSWR from "swr";
import type { ServerOverview } from "@/types/server";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useServerStatus() {
  const { data, error, isLoading, mutate } = useSWR<ServerOverview>(
    "/api/server/status",
    fetcher,
    { refreshInterval: 5000 }
  );

  return { data, error, isLoading, mutate };
}
