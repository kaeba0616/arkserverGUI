import fs from "fs";
import path from "path";

const ENV_PATH = path.join(process.env.ARK_PROJECT_DIR || "/home/hidi/dev/arkSurv", ".env");

interface EnvEntry {
  type: "comment" | "empty" | "value";
  raw: string;
  key?: string;
  value?: string;
}

function parseEnvFile(content: string): EnvEntry[] {
  return content.split("\n").map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return { type: "empty", raw: line };
    if (trimmed.startsWith("#")) return { type: "comment", raw: line };
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) return { type: "comment", raw: line };
    const key = line.substring(0, eqIndex).trim();
    const value = line.substring(eqIndex + 1).trim();
    return { type: "value", raw: line, key, value };
  });
}

export function readEnv(): Record<string, string> {
  if (!fs.existsSync(ENV_PATH)) return {};
  const content = fs.readFileSync(ENV_PATH, "utf-8");
  const entries = parseEnvFile(content);
  const result: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.type === "value" && entry.key) {
      result[entry.key] = entry.value || "";
    }
  }
  return result;
}

export function writeEnv(updates: Record<string, string>): void {
  const content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf-8") : "";
  const entries = parseEnvFile(content);
  const updatedKeys = new Set<string>();

  const lines = entries.map((entry) => {
    if (entry.type === "value" && entry.key && entry.key in updates) {
      updatedKeys.add(entry.key);
      return `${entry.key}=${updates[entry.key]}`;
    }
    return entry.raw;
  });

  // Add new keys not in original file
  for (const [key, value] of Object.entries(updates)) {
    if (!updatedKeys.has(key)) {
      lines.push(`${key}=${value}`);
    }
  }

  fs.writeFileSync(ENV_PATH, lines.join("\n"));
}
