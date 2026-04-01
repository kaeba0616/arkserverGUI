import { Rcon } from "rcon-client";
import type { PlayerInfo } from "@/types/server";

const RCON_CONFIG = {
  host: process.env.RCON_HOST || "127.0.0.1",
  port: parseInt(process.env.RCON_PORT || "27020"),
  password: process.env.RCON_PASSWORD || process.env.ADMIN_PASSWORD || "",
};

async function withRcon<T>(fn: (rcon: Rcon) => Promise<T>): Promise<T> {
  const rcon = await Rcon.connect(RCON_CONFIG);
  try {
    return await fn(rcon);
  } finally {
    rcon.end();
  }
}

export async function sendCommand(command: string): Promise<string> {
  return withRcon(async (rcon) => {
    const response = await rcon.send(command);
    return response;
  });
}

export async function getPlayers(): Promise<PlayerInfo[]> {
  try {
    const response = await sendCommand("listplayers");
    if (!response || response.includes("No Players")) {
      return [];
    }

    const players: PlayerInfo[] = [];
    const lines = response.split("\n").filter((l) => l.trim());

    for (const line of lines) {
      // Format: "0. PlayerName, 76561198012345678"
      const match = line.match(/^(\d+)\.\s+(.+?),\s+(\d+)/);
      if (match) {
        players.push({
          index: parseInt(match[1]),
          name: match[2],
          steamId: match[3],
        });
      }
    }

    return players;
  } catch {
    return [];
  }
}

export async function saveWorld(): Promise<string> {
  return sendCommand("saveworld");
}

export async function broadcast(message: string): Promise<string> {
  return sendCommand(`broadcast ${message}`);
}
