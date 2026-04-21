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

export function includeEnvKeys(
  base: Map<string, string>,
  source: Map<string, string>,
  keys: string[]
): { result: Map<string, string>; included: string[]; missing: string[] } {
  const result = new Map(base);
  const included: string[] = [];
  const missing: string[] = [];

  for (const key of keys) {
    if (source.has(key)) {
      result.set(key, source.get(key)!);
      included.push(key);
    } else {
      missing.push(key);
    }
  }

  return { result, included, missing };
}

export function buildIncludeCommand(): Command {
  const cmd = new Command("include");
  cmd
    .description("Include specific keys from a source env file into a target env file")
    .argument("<source>", "Source .env file to pull keys from")
    .argument("<target>", "Target .env file to write into")
    .requiredOption("-k, --keys <keys>", "Comma-separated list of keys to include")
    .option("--dry-run", "Preview changes without writing", false)
    .option("--json", "Output as JSON", false)
    .action((source: string, target: string, opts) => {
      const keys = opts.keys.split(",").map((k: string) => k.trim()).filter(Boolean);
      const sourceMap = parseEnvFile(path.resolve(source));
      const targetMap = fs.existsSync(path.resolve(target))
        ? parseEnvFile(path.resolve(target))
        : new Map<string, string>();

      const { result, included, missing } = includeEnvKeys(targetMap, sourceMap, keys);

      if (opts.json) {
        console.log(JSON.stringify({ included, missing, dryRun: opts.dryRun }, null, 2));
      } else {
        if (included.length > 0) console.log(`Included: ${included.join(", ")}`);
        if (missing.length > 0) console.warn(`Missing in source: ${missing.join(", ")}`);
      }

      if (!opts.dryRun) {
        fs.writeFileSync(path.resolve(target), serializeEnvMap(result), "utf-8");
      }
    });
  return cmd;
}
