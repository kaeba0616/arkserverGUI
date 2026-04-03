import { Rcon } from "rcon-client";
import type { PlayerInfo } from "@/lib/adapters/types";
import type { GameAdapter } from "@/lib/adapters/types";

export interface RconConfig {
  host: string;
  port: number;
  password: string;
}

async function withRcon<T>(config: RconConfig, fn: (rcon: Rcon) => Promise<T>): Promise<T> {
  const rcon = await Rcon.connect(config);
  try {
    return await fn(rcon);
  } finally {
    rcon.end();
  }
}

export async function sendCommand(config: RconConfig, command: string): Promise<string> {
  return withRcon(config, async (rcon) => {
    const response = await rcon.send(command);
    return response;
  });
}

export async function getPlayers(config: RconConfig, adapter: GameAdapter): Promise<PlayerInfo[]> {
  try {
    const response = await sendCommand(config, adapter.listPlayersCommand);
    return adapter.parsePlayers(response);
  } catch {
    return [];
  }
}

export async function saveWorld(config: RconConfig, adapter: GameAdapter): Promise<string | null> {
  if (!adapter.saveCommand) return null;
  return sendCommand(config, adapter.saveCommand);
}

export async function broadcast(config: RconConfig, adapter: GameAdapter, message: string): Promise<string | null> {
  if (!adapter.broadcastCommand) return null;
  const command = adapter.broadcastCommand.replace("{message}", message);
  return sendCommand(config, command);
}
