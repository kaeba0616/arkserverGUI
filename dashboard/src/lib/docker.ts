import { execSync, spawn } from "child_process";
import { PassThrough } from "stream";
import type { ServerStatus, ContainerStats } from "@/types/server";

function exec(cmd: string): string {
  return execSync(cmd, { timeout: 30000, encoding: "utf-8" }).trim();
}

export async function getContainerStatus(containerName: string): Promise<ServerStatus> {
  try {
    const json = exec(`docker inspect ${containerName} --format '{{json .State}}'`);
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

export async function getContainerStats(containerName: string): Promise<ContainerStats | null> {
  try {
    const output = exec(`docker stats ${containerName} --no-stream --format '{{json .}}'`);
    const stats = JSON.parse(output);

    const cpuPercent = parseFloat(stats.CPUPerc?.replace("%", "") || "0");
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

export async function startContainer(containerName: string): Promise<void> {
  exec(`docker start ${containerName}`);
}

export async function stopContainer(containerName: string, timeout: number = 120): Promise<void> {
  exec(`docker stop -t ${timeout} ${containerName}`);
}

export async function restartContainer(containerName: string, timeout: number = 120): Promise<void> {
  exec(`docker restart -t ${timeout} ${containerName}`);
}

export async function execInContainer(containerName: string, cmd: string[]): Promise<string> {
  const cmdStr = cmd.map((c) => `'${c}'`).join(" ");
  return exec(`docker exec ${containerName} ${cmdStr}`);
}

export function getContainerLogStream(containerName: string, tail: number = 200): NodeJS.ReadableStream {
  const proc = spawn("docker", ["logs", "-f", "--tail", String(tail), containerName], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  const merged = new PassThrough();
  proc.stdout.pipe(merged, { end: false });
  proc.stderr.pipe(merged, { end: false });

  proc.on("close", () => merged.end());
  proc.on("error", () => merged.end());

  merged.on("close", () => {
    proc.kill();
  });

  return merged;
}

export async function createContainer(opts: {
  name: string;
  image: string;
  env: Record<string, string>;
  ports: { host: number; container: number; protocol: string }[];
  volumes: { host: string; container: string; readonly?: boolean }[];
  resources?: { memLimit?: string; cpus?: number };
  networkMode?: string;
}): Promise<void> {
  const args = ["docker", "create", "--name", opts.name, "--restart", "unless-stopped", "--tty", "--interactive"];

  for (const [k, v] of Object.entries(opts.env)) {
    args.push("-e", `${k}=${v}`);
  }

  if (opts.networkMode === "host") {
    args.push("--network", "host");
  } else {
    for (const p of opts.ports) {
      args.push("-p", `${p.host}:${p.container}/${p.protocol}`);
    }
  }

  for (const v of opts.volumes) {
    args.push("-v", `${v.host}:${v.container}${v.readonly ? ":ro" : ""}`);
  }

  if (opts.resources?.memLimit) args.push("--memory", opts.resources.memLimit);
  if (opts.resources?.cpus) args.push("--cpus", String(opts.resources.cpus));

  args.push(opts.image);

  exec(args.join(" "));
}

export async function removeContainer(containerName: string): Promise<void> {
  try {
    exec(`docker stop -t 10 ${containerName}`);
  } catch {
    // Already stopped
  }
  exec(`docker rm ${containerName}`);
}

export async function containerExists(containerName: string): Promise<boolean> {
  try {
    exec(`docker inspect ${containerName}`);
    return true;
  } catch {
    return false;
  }
}
