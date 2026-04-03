import { arkAdapter } from "./ark";
import { minecraftAdapter } from "./minecraft";
import type { GameAdapter } from "./types";

const adapters: Record<string, GameAdapter> = {
  ark: arkAdapter,
  minecraft: minecraftAdapter,
};

export function getAdapter(gameId: string): GameAdapter {
  const adapter = adapters[gameId];
  if (!adapter) throw new Error(`Unknown game adapter: ${gameId}`);
  return adapter;
}

export function getAllAdapters(): GameAdapter[] {
  return Object.values(adapters);
}

export function getAdapterIds(): string[] {
  return Object.keys(adapters);
}
