import type { GameAdapter, PlayerInfo } from "./types";

export const arkAdapter: GameAdapter = {
  id: "ark",
  displayName: "ARK: Survival Evolved",
  icon: "ark",

  docker: {
    image: "hermsi/ark-server:latest",
    stopTimeout: 120,
    volumes: [
      { hostRelative: "server-data", container: "/ark" },
    ],
    defaultEnv: {
      UPDATE_ON_START: "true",
      BACKUP_ON_STOP: "true",
      WARN_ON_STOP: "true",
    },
    resources: { memLimitGb: 8, cpus: 6 },
    networkMode: "host",
  },

  ports: [
    { name: "Game", default: 7777, protocol: "udp", required: true },
    { name: "Game (내부)", default: 7778, protocol: "udp", required: true },
    { name: "Query", default: 27015, protocol: "udp", required: true },
    { name: "RCON", default: 27020, protocol: "tcp", required: true },
  ],

  rcon: { defaultPort: 27020, supported: true },

  configFiles: [
    { name: "GameUserSettings.ini", relativePath: "config/GameUserSettings.ini", format: "ini" },
    { name: "Game.ini", relativePath: "config/Game.ini", format: "ini" },
  ],

  settingsFields: [
    { key: "SESSION_NAME", label: "서버 이름", type: "text", defaultValue: "MyARKServer", category: "기본" },
    { key: "SERVER_MAP", label: "맵", type: "select", category: "기본", options: [
      { value: "TheIsland", label: "The Island" },
      { value: "Ragnarok", label: "Ragnarok" },
      { value: "TheCenter", label: "The Center" },
      { value: "Valguero_P", label: "Valguero" },
      { value: "CrystalIsles", label: "Crystal Isles" },
      { value: "LostIsland", label: "Lost Island" },
      { value: "Fjordur", label: "Fjordur" },
    ]},
    { key: "SERVER_PASSWORD", label: "서버 비밀번호", type: "text", category: "기본" },
    { key: "ADMIN_PASSWORD", label: "관리자 비밀번호", type: "text", category: "기본" },
    { key: "MAX_PLAYERS", label: "최대 접속자", type: "number", defaultValue: "20", category: "기본" },
    { key: "ARK_MODS", label: "모드 ID (쉼표 구분)", type: "text", category: "모드" },
    { key: "GAME_MOD_IDS", label: "게임 모드 ID", type: "text", category: "모드" },
    { key: "UPDATE_ON_START", label: "시작 시 업데이트", type: "boolean", defaultValue: "true", category: "동작" },
    { key: "BACKUP_ON_STOP", label: "종료 시 백업", type: "boolean", defaultValue: "true", category: "동작" },
    { key: "WARN_ON_STOP", label: "종료 시 경고", type: "boolean", defaultValue: "true", category: "동작" },
  ],

  savePathRelative: "server-data/server/ShooterGame/Saved",
  backupPrefix: "ark-backup",

  parsePlayers(response: string): PlayerInfo[] {
    if (!response || response.includes("No Players")) return [];
    const players: PlayerInfo[] = [];
    for (const line of response.split("\n").filter((l) => l.trim())) {
      const match = line.match(/^(\d+)\.\s+(.+?),\s+(\d+)/);
      if (match) {
        players.push({ index: parseInt(match[1]), name: match[2], id: match[3] });
      }
    }
    return players;
  },

  listPlayersCommand: "listplayers",
  saveCommand: "saveworld",
  broadcastCommand: "broadcast {message}",
  updateCommand: ["arkmanager", "update", "--force"],

  extraNavItems: [
    { href: "/mods", label: "모드" },
  ],
};
