import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

export function parseEnvFile(content: string): Map<string, string> {
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

export interface DedupeResult {
  removed: string[];
  kept: Map<string, string>;
}

export function dedupeEnvFile(content: string): DedupeResult {
  const removed: string[] = [];
  const kept = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (kept.has(key)) {
      removed.push(key);
    } else {
      kept.set(key, value);
    }
  }
  return { removed, kept };
}

export function buildDedupeCommand(): Command {
  const cmd = new Command("dedupe");
  cmd
    .description("Remove duplicate keys from an env file, keeping the first occurrence")
    .argument("<file>", "Path to the .env file")
    .option("--json", "Output result as JSON")
    .option("--dry-run", "Preview changes without writing")
    .action((file: string, options: { json?: boolean; dryRun?: boolean }) => {
      const resolved = path.resolve(file);
      const content = fs.readFileSync(resolved, "utf-8");
      const { removed, kept } = dedupeEnvFile(content);
      if (options.json) {
        console.log(JSON.stringify({ removed, kept: Object.fromEntries(kept) }, null, 2));
      } else {
        if (removed.length === 0) {
          console.log("No duplicate keys found.");
        } else {
          console.log(`Removed ${removed.length} duplicate key(s): ${removed.join(", ")}`);
        }
      }
      if (!options.dryRun) {
        fs.writeFileSync(resolved, serializeEnvMap(kept), "utf-8");
      }
    });
  return cmd;
}
