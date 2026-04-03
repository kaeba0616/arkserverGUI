import fs from "fs";
import ini from "ini";

export function readIniFile(filePath: string): Record<string, Record<string, string>> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  return ini.parse(content);
}

export function writeIniFile(filePath: string, data: Record<string, Record<string, string>>): void {
  const content = ini.stringify(data, { whitespace: false });
  fs.writeFileSync(filePath, content);
}
