import fs from "fs";
import path from "path";
import ini from "ini";

const CONFIG_DIR = path.join(process.env.ARK_PROJECT_DIR || "/home/hidi/dev/arkSurv", "ark-config");

export function readIniFile(filename: string): Record<string, Record<string, string>> {
  const filePath = path.join(CONFIG_DIR, filename);
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  return ini.parse(content);
}

export function writeIniFile(filename: string, data: Record<string, Record<string, string>>): void {
  const filePath = path.join(CONFIG_DIR, filename);
  const content = ini.stringify(data, { whitespace: false });
  fs.writeFileSync(filePath, content);
}

export function readGameUserSettings(): Record<string, Record<string, string>> {
  return readIniFile("GameUserSettings.ini");
}

export function writeGameUserSettings(data: Record<string, Record<string, string>>): void {
  writeIniFile("GameUserSettings.ini", data);
}

export function readGameIni(): Record<string, Record<string, string>> {
  return readIniFile("Game.ini");
}

export function writeGameIni(data: Record<string, Record<string, string>>): void {
  writeIniFile("Game.ini", data);
}
