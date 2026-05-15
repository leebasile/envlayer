import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

export interface TimestampEntry {
  key: string;
  value: string;
  timestamp: string;
}

export interface TimestampResult {
  file: string;
  entries: TimestampEntry[];
  count: number;
}

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
    map.set(key, value);
  }
  return map;
}

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}

export function timestampEnvFile(
  filePath: string,
  keys: string[],
  format: "iso" | "unix" | "utc" = "iso"
): TimestampResult {
  const map = parseEnvFile(filePath);
  const now = new Date();
  const timestamp =
    format === "unix"
      ? String(Math.floor(now.getTime() / 1000))
      : format === "utc"
      ? now.toUTCString()
      : now.toISOString();

  const entries: TimestampEntry[] = [];
  const targetKeys = keys.length > 0 ? keys : Array.from(map.keys());

  for (const key of targetKeys) {
    if (!map.has(key)) continue;
    const tsKey = `${key}_TIMESTAMP`;
    map.set(tsKey, timestamp);
    entries.push({ key, value: map.get(key)!, timestamp });
  }

  fs.writeFileSync(filePath, serializeEnvMap(map), "utf-8");
  return { file: path.basename(filePath), entries, count: entries.length };
}

export function buildTimestampCommand(): Command {
  const cmd = new Command("timestamp");
  cmd
    .description("Append timestamp metadata keys for specified env variables")
    .argument("<file>", "Path to the .env file")
    .option("-k, --keys <keys>", "Comma-separated list of keys to timestamp", "")
    .option("-f, --format <format>", "Timestamp format: iso | unix | utc", "iso")
    .option("--json", "Output as JSON")
    .action((file: string, options: { keys: string; format: string; json?: boolean }) => {
      const keys = options.keys ? options.keys.split(",").map((k) => k.trim()) : [];
      const format = (options.format as "iso" | "unix" | "utc") || "iso";
      const result = timestampEnvFile(file, keys, format);
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Timestamped ${result.count} key(s) in ${result.file}`);
        for (const e of result.entries) {
          console.log(`  ${e.key}_TIMESTAMP = ${e.timestamp}`);
        }
      }
    });
  return cmd;
}
