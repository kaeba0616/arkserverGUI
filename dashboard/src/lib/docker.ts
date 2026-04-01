import { execSync, spawn } from "child_process";
import { PassThrough } from "stream";
import type { ServerStatus, ContainerStats } from "@/types/server";

const CONTAINER_NAME = process.env.ARK_CONTAINER_NAME || "ark-server";

function exec(cmd: string): string {
  return execSync(cmd, { timeout: 30000, encoding: "utf-8" }).trim();
}

export async function getContainerStatus(): Promise<ServerStatus> {
  try {
    const json = exec(`docker inspect ${CONTAINER_NAME} --format '{{json .State}}'`);
    const state = JSON.parse(json);

    let serverState: ServerStatus["state"] = "unknown";
    if (state.Running) serverState = "running";
    else if (state.Restarting) serverState = "restarting";
    else if (state.Paused) serverState = "paused";
    else serverState = "stopped";

    const startedAt = state.StartedAt || null;
    let uptime: number | null = null;
    if (serverState === "running" && startedAt) {
      uptime = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    }

    return { state: serverState, uptime, startedAt };
  } catch {
    return { state: "unknown", uptime: null, startedAt: null };
  }
}

export async function getContainerStats(): Promise<ContainerStats | null> {
  try {
    const output = exec(`docker stats ${CONTAINER_NAME} --no-stream --format '{{json .}}'`);
    const stats = JSON.parse(output);

    // Parse CPU percentage (e.g., "5.23%")
    const cpuPercent = parseFloat(stats.CPUPerc?.replace("%", "") || "0");

    // Parse memory (e.g., "2.5GiB / 8GiB")
    const memParts = (stats.MemUsage || "").split("/").map((s: string) => s.trim());
    const memUsageMb = parseMemory(memParts[0] || "0");
    const memLimitMb = parseMemory(memParts[1] || "0");

    return {
      cpuPercent: Math.round(cpuPercent * 100) / 100,
      memUsageMb: Math.round(memUsageMb),
      memLimitMb: Math.round(memLimitMb),
    };
  } catch {
    return null;
  }
}

function parseMemory(str: string): number {
  const num = parseFloat(str);
  if (str.includes("GiB")) return num * 1024;
  if (str.includes("MiB")) return num;
  if (str.includes("KiB")) return num / 1024;
  return num;
}

export async function startContainer(): Promise<void> {
  exec(`docker start ${CONTAINER_NAME}`);
}

export async function stopContainer(): Promise<void> {
  exec(`docker stop -t 120 ${CONTAINER_NAME}`);
}

export async function restartContainer(): Promise<void> {
  exec(`docker restart -t 120 ${CONTAINER_NAME}`);
}

export async function execInContainer(cmd: string[]): Promise<string> {
  const cmdStr = cmd.map((c) => `'${c}'`).join(" ");
  return exec(`docker exec ${CONTAINER_NAME} ${cmdStr}`);
}

export function getContainerLogStream(tail: number = 200): NodeJS.ReadableStream {
  const proc = spawn("docker", ["logs", "-f", "--tail", String(tail), CONTAINER_NAME], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  // Merge stdout and stderr
  const merged = new PassThrough();
  proc.stdout.pipe(merged, { end: false });
  proc.stderr.pipe(merged, { end: false });

  proc.on("close", () => merged.end());
  proc.on("error", () => merged.end());

  // Cleanup on stream end
  merged.on("close", () => {
    proc.kill();
  });

  return merged;
}
