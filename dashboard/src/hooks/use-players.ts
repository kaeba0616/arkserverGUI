"use client";

import useSWR from "swr";
import type { PlayerInfo } from "@/types/server";
import { useServerApiUrl } from "./use-server-context";
import { fetcher } from "@/lib/fetcher";

export function usePlayers() {
  const url = useServerApiUrl("/api/players");

  const { data, error, isLoading } = useSWR<{ players: PlayerInfo[]; count: number }>(
    url,
    fetcher,
    { refreshInterval: 5000 }
  );

  return { players: data?.players || [], count: data?.count || 0, error, isLoading };
}
