export interface PlayerInfo {
  name: string;
  id: string;
  index?: number;
}

export interface ConfigFileDefinition {
  name: string;
  relativePath: string;
  format: "ini" | "properties" | "yaml" | "json" | "env";
}

export interface PortDefinition {
  name: string;
  default: number;
  protocol: "tcp" | "udp" | "both";
  required: boolean;
}

export interface DockerDefaults {
  image: string;
  stopTimeout: number;
  volumes: { hostRelative: string; container: string; readonly?: boolean }[];
  defaultEnv: Record<string, string>;
  resources?: { memLimitGb?: number; cpus?: number };
  networkMode?: string;
}

export interface SettingsFieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  options?: { value: string; label: string }[];
  defaultValue?: string;
  category?: string;
}

export interface GameAdapter {
  id: string;
  displayName: string;
  icon: string;

  docker: DockerDefaults;
  ports: PortDefinition[];

  rcon: {
    defaultPort: number;
    supported: boolean;
  };

  configFiles: ConfigFileDefinition[];
  settingsFields: SettingsFieldDef[];

  savePathRelative: string;
  backupPrefix: string;

  parsePlayers(rconResponse: string): PlayerInfo[];
  listPlayersCommand: string;
  saveCommand: string | null;
  broadcastCommand: string | null;
  updateCommand: string[] | null;

  extraNavItems: { href: string; label: string }[];

  quickCommands: { label: string; cmd: string }[];

  rconEnvKeys: {
    password: string;
    enable?: string;
  };
}
