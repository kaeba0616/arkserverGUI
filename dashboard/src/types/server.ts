export interface ServerStatus {
  state: "running" | "stopped" | "restarting" | "paused" | "unknown";
  uptime: number | null; // seconds
  startedAt: string | null;
}

export interface ContainerStats {
  cpuPercent: number;
  memUsageMb: number;
  memLimitMb: number;
}

export interface PlayerInfo {
  index: number;
  name: string;
  steamId: string;
}

export interface ServerOverview {
  status: ServerStatus;
  stats: ContainerStats | null;
  players: PlayerInfo[];
  playerCount: number;
}
