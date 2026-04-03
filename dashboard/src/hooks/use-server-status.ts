"use client";

import useSWR from "swr";
import type { ServerOverview } from "@/types/server";
import { useServerApiUrl } from "./use-server-context";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useServerStatus() {
  const url = useServerApiUrl("/api/server/status");

  const { data, error, isLoading, mutate } = useSWR<ServerOverview>(
    url,
    fetcher,
    { refreshInterval: 5000 }
  );

  return { data, error, isLoading, mutate };
}
