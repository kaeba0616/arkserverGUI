"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ServerInfo {
  id: string;
  name: string;
  gameId: string;
  gameName: string;
  containerName: string;
  status: { state: string; uptime: number | null; startedAt: string | null };
  stats: { cpuPercent: number; memUsageMb: number; memLimitMb: number } | null;
}

interface ServerContextValue {
  serverId: string | null;
  serverName: string;
  gameId: string;
  servers: ServerInfo[];
  setServerId: (id: string) => void;
  isLoading: boolean;
}

const ServerContext = createContext<ServerContextValue>({
  serverId: null,
  serverName: "",
  gameId: "",
  servers: [],
  setServerId: () => {},
  isLoading: true,
});

export function ServerProvider({ children }: { children: ReactNode }) {
  const [serverId, setServerIdState] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { data: servers = [], isLoading } = useSWR<ServerInfo[]>(
    "/api/servers",
    fetcher,
    { refreshInterval: 10000 }
  );

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("selectedServerId");
    if (stored) {
      setServerIdState(stored);
    }
    setInitialized(true);
  }, []);

  // Auto-select first server if none selected
  useEffect(() => {
    if (initialized && !serverId && servers.length > 0) {
      setServerIdState(servers[0].id);
      localStorage.setItem("selectedServerId", servers[0].id);
    }
  }, [initialized, serverId, servers]);

  const setServerId = useCallback((id: string) => {
    setServerIdState(id);
    localStorage.setItem("selectedServerId", id);
  }, []);

  const currentServer = servers.find((s) => s.id === serverId);

  return (
    <ServerContext.Provider
      value={{
        serverId,
        serverName: currentServer?.name || "",
        gameId: currentServer?.gameId || "",
        servers,
        setServerId,
        isLoading,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
}

export function useServerContext() {
  return useContext(ServerContext);
}

export function useServerApiUrl(basePath: string, extraParams?: Record<string, string>) {
  const { serverId } = useServerContext();
  if (!serverId) return null;

  const params = new URLSearchParams({ serverId, ...extraParams });
  return `${basePath}?${params.toString()}`;
}
