import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    map.set(key, value);
  }
  return map;
}

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}

export interface HeadersResult {
  file: string;
  added: string[];
  skipped: string[];
}

export function addHeaders(
  filePath: string,
  headers: Record<string, string>,
  overwrite: boolean
): HeadersResult {
  const map = parseEnvFile(filePath);
  const added: string[] = [];
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(headers)) {
    if (map.has(key) && !overwrite) {
      skipped.push(key);
    } else {
      map.set(key, value);
      added.push(key);
    }
  }

  const newMap = new Map<string, string>();
  for (const [k, v] of Object.entries(headers)) {
    if (added.includes(k)) newMap.set(k, v);
  }
  for (const [k, v] of map.entries()) {
    if (!newMap.has(k)) newMap.set(k, v);
  }

  fs.writeFileSync(filePath, serializeEnvMap(newMap), "utf-8");
  return { file: path.basename(filePath), added, skipped };
}

export function buildHeadersCommand(): Command {
  const cmd = new Command("headers");
  cmd
    .description("Prepend key=value header entries to an env file")
    .argument("<file>", "Target .env file")
    .option("-s, --set <entries...>", "KEY=VALUE pairs to prepend")
    .option("--overwrite", "Overwrite existing keys", false)
    .option("--json", "Output result as JSON", false)
    .action((file: string, opts: { set?: string[]; overwrite: boolean; json: boolean }) => {
      const headers: Record<string, string> = {};
      for (const entry of opts.set ?? []) {
        const eqIdx = entry.indexOf("=");
        if (eqIdx === -1) {
          console.error(`Invalid entry: ${entry}`);
          process.exit(1);
        }
        headers[entry.slice(0, eqIdx)] = entry.slice(eqIdx + 1);
      }
      const result = addHeaders(file, headers, opts.overwrite);
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        if (result.added.length > 0) console.log(`Added: ${result.added.join(", ")}`);
        if (result.skipped.length > 0) console.log(`Skipped (already exist): ${result.skipped.join(", ")}`);
        if (result.added.length === 0 && result.skipped.length === 0) console.log("No headers specified.");
      }
    });
  return cmd;
}
