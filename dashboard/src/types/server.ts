export interface ServerStatus {
  state: "running" | "stopped" | "restarting" | "paused" | "unknown";
  uptime: number | null;
  startedAt: string | null;
}

export interface ContainerStats {
  cpuPercent: number;
  memUsageMb: number;
  memLimitMb: number;
}

export interface PlayerInfo {
  index?: number;
  name: string;
  id: string;
}

export interface ServerOverview {
  status: ServerStatus;
  stats: ContainerStats | null;
  players: PlayerInfo[];
  playerCount: number;
}

export interface ServerInstance {
  id: string;
  name: string;
  gameId: string;
  containerName: string;
  status?: ServerStatus;
  stats?: ContainerStats | null;
  playerCount?: number;
}
