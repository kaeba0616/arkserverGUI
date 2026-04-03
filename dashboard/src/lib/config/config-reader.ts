import fs from "fs";
import { readIniFile, writeIniFile } from "./ini-parser";

export function readConfigFile(filePath: string, format: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) return {};

  switch (format) {
    case "ini":
      return readIniFile(filePath);
    case "properties": {
      const content = fs.readFileSync(filePath, "utf-8");
      const result: Record<string, string> = {};
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1) continue;
        result[trimmed.substring(0, eqIndex).trim()] = trimmed.substring(eqIndex + 1).trim();
      }
      return result;
    }
    case "json": {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
    case "yaml":
      // Future: add yaml support
      return {};
    default:
      return {};
  }
}

export function writeConfigFile(filePath: string, format: string, data: Record<string, unknown>): void {
  switch (format) {
    case "ini":
      writeIniFile(filePath, data as Record<string, Record<string, string>>);
      break;
    case "properties": {
      const lines: string[] = [];
      for (const [key, value] of Object.entries(data)) {
        lines.push(`${key}=${value}`);
      }
      fs.writeFileSync(filePath, lines.join("\n") + "\n");
      break;
    }
    case "json":
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      break;
  }
}
