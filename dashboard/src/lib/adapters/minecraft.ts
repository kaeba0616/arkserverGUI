import type { GameAdapter, PlayerInfo } from "./types";

export const minecraftAdapter: GameAdapter = {
  id: "minecraft",
  displayName: "Minecraft",
  icon: "minecraft",

  docker: {
    image: "itzg/minecraft-server:latest",
    stopTimeout: 60,
    volumes: [
      { hostRelative: "server-data", container: "/data" },
    ],
    defaultEnv: {
      EULA: "TRUE",
      TYPE: "VANILLA",
      VERSION: "LATEST",
      MEMORY: "4G",
    },
    resources: { memLimitGb: 6, cpus: 4 },
  },

  ports: [
    { name: "Game", default: 25565, protocol: "tcp", required: true },
    { name: "RCON", default: 25575, protocol: "tcp", required: true },
  ],

  rcon: { defaultPort: 25575, supported: true },

  configFiles: [
    { name: "server.properties", relativePath: "server-data/server.properties", format: "properties" },
  ],

  settingsFields: [
    { key: "SERVER_NAME", label: "서버 이름", type: "text", defaultValue: "MyMinecraftServer", category: "기본" },
    { key: "TYPE", label: "서버 타입", type: "select", category: "기본", options: [
      { value: "VANILLA", label: "Vanilla" },
      { value: "PAPER", label: "Paper" },
      { value: "SPIGOT", label: "Spigot" },
      { value: "FORGE", label: "Forge" },
      { value: "FABRIC", label: "Fabric" },
    ]},
    { key: "VERSION", label: "버전", type: "text", defaultValue: "LATEST", category: "기본" },
    { key: "MEMORY", label: "메모리", type: "text", defaultValue: "4G", category: "기본" },
    { key: "MAX_PLAYERS", label: "최대 접속자", type: "number", defaultValue: "20", category: "기본" },
    { key: "DIFFICULTY", label: "난이도", type: "select", category: "게임플레이", options: [
      { value: "peaceful", label: "Peaceful" },
      { value: "easy", label: "Easy" },
      { value: "normal", label: "Normal" },
      { value: "hard", label: "Hard" },
    ]},
    { key: "GAMEMODE", label: "게임 모드", type: "select", category: "게임플레이", options: [
      { value: "survival", label: "Survival" },
      { value: "creative", label: "Creative" },
      { value: "adventure", label: "Adventure" },
      { value: "spectator", label: "Spectator" },
    ]},
    { key: "ONLINE_MODE", label: "온라인 모드", type: "boolean", defaultValue: "true", category: "기본" },
  ],

  savePathRelative: "server-data/world",
  backupPrefix: "mc-backup",

  parsePlayers(response: string): PlayerInfo[] {
    // "There are X of a max of Y players online: Player1, Player2"
    if (!response || response.includes("0 of")) return [];
    const colonIndex = response.indexOf(":");
    if (colonIndex === -1) return [];
    const names = response.slice(colonIndex + 1).split(",").map((s) => s.trim()).filter(Boolean);
    return names.map((name, i) => ({ name, id: name, index: i }));
  },

  listPlayersCommand: "list",
  saveCommand: "save-all",
  broadcastCommand: "say {message}",
  updateCommand: null,

  extraNavItems: [],
};
