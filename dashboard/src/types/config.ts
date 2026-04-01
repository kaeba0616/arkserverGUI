export interface EnvConfig {
  SESSION_NAME: string;
  SERVER_MAP: string;
  SERVER_PASSWORD: string;
  ADMIN_PASSWORD: string;
  MAX_PLAYERS: string;
  UPDATE_ON_START: string;
  BACKUP_ON_STOP: string;
  WARN_ON_STOP: string;
  ARK_MODS: string;
  GAME_MOD_IDS: string;
  RCON_HOST: string;
  RCON_PORT: string;
  RCON_PASSWORD: string;
  BACKUP_DIR: string;
  BACKUP_RETENTION_DAYS: string;
  BACKUP_COUNT_MAX: string;
  [key: string]: string;
}

export interface IniSection {
  [key: string]: string;
}

export interface IniFile {
  [section: string]: IniSection;
}
