import type { GameAdapter, PlayerInfo } from "./types";

export const dstAdapter: GameAdapter = {
  id: "dst",
  displayName: "Don't Starve Together",
  icon: "dst",

  docker: {
    image: "jamesits/dst-server:latest",
    stopTimeout: 30,
    volumes: [
      { hostRelative: "server-data", container: "/data" },
    ],
    defaultEnv: {
      DST_CLUSTER_TOKEN: "",
      DST_CLUSTER_NAME: "My DST Server",
      DST_CLUSTER_GAMEMODE: "endless",
      DST_CLUSTER_MAX_PLAYERS: "6",
      DST_CLUSTER_PVP: "false",
    },
    resources: { memLimitGb: 4, cpus: 2 },
  },

  ports: [
    { name: "Master", default: 10999, protocol: "udp", required: true },
    { name: "Caves", default: 10998, protocol: "udp", required: false },
  ],

  rcon: { defaultPort: 0, supported: false },

  configFiles: [
    { name: "cluster.ini", relativePath: "server-data/DoNotStarveTogether/Cluster_1/cluster.ini", format: "ini" },
  ],

  settingsFields: [
    { key: "DST_CLUSTER_TOKEN", label: "클러스터 토큰 (Klei 계정)", type: "text", defaultValue: "", category: "기본" },
    { key: "DST_CLUSTER_NAME", label: "서버 이름", type: "text", defaultValue: "My DST Server", category: "기본" },
    { key: "DST_CLUSTER_DESCRIPTION", label: "서버 설명", type: "text", defaultValue: "", category: "기본" },
    { key: "DST_CLUSTER_PASSWORD", label: "서버 비밀번호", type: "text", defaultValue: "", category: "기본" },
    { key: "DST_CLUSTER_MAX_PLAYERS", label: "최대 접속자", type: "number", defaultValue: "6", category: "기본" },
    { key: "DST_CLUSTER_GAMEMODE", label: "게임 모드", type: "select", category: "게임플레이", options: [
      { value: "survival", label: "Survival" },
      { value: "endless", label: "Endless" },
      { value: "wilderness", label: "Wilderness" },
    ]},
    { key: "DST_CLUSTER_PVP", label: "PvP", type: "boolean", defaultValue: "false", category: "게임플레이" },
    { key: "DST_CLUSTER_INTENTION", label: "서버 성격", type: "select", category: "게임플레이", options: [
      { value: "cooperative", label: "협동 (Cooperative)" },
      { value: "competitive", label: "경쟁 (Competitive)" },
      { value: "social", label: "소셜 (Social)" },
      { value: "madness", label: "혼돈 (Madness)" },
    ]},
  ],

  savePathRelative: "server-data/DoNotStarveTogether/Cluster_1",
  backupPrefix: "dst-backup",

  parsePlayers(_response: string): PlayerInfo[] {
    return [];
  },

  listPlayersCommand: "",
  saveCommand: null,
  broadcastCommand: null,
  updateCommand: null,

  extraNavItems: [],

  quickCommands: [],

  rconEnvKeys: {
    password: "DST_CLUSTER_PASSWORD",
  },
};
