import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    map.set(key, value);
  }
  return map;
}

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}

export interface EnvInjectResult {
  injected: string[];
  skipped: string[];
  output: string;
}

export function injectEnvFile(
  filePath: string,
  overrides: Record<string, string>,
  options: { overwrite?: boolean } = {}
): EnvInjectResult {
  const map = parseEnvFile(filePath);
  const injected: string[] = [];
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(overrides)) {
    if (map.has(key) && !options.overwrite) {
      skipped.push(key);
    } else {
      map.set(key, value);
      injected.push(key);
    }
  }

  return { injected, skipped, output: serializeEnvMap(map) };
}

export function buildEnvCommand(): Command {
  const cmd = new Command("env");
  cmd
    .description("Inject key=value pairs into an env file")
    .argument("<file>", "Target .env file")
    .option("-s, --set <pairs...>", "Key=value pairs to inject")
    .option("-o, --overwrite", "Overwrite existing keys", false)
    .option("--format <fmt>", "Output format: text|json", "text")
    .option("--dry-run", "Preview changes without writing", false)
    .action((file: string, opts: { set?: string[]; overwrite: boolean; format: string; dryRun: boolean }) => {
      const overrides: Record<string, string> = {};
      for (const pair of opts.set ?? []) {
        const eqIdx = pair.indexOf("=");
        if (eqIdx === -1) {
          console.error(`Invalid pair (missing '='): ${pair}`);
          process.exit(1);
        }
        overrides[pair.slice(0, eqIdx)] = pair.slice(eqIdx + 1);
      }

      const result = injectEnvFile(file, overrides, { overwrite: opts.overwrite });

      if (!opts.dryRun) {
        fs.writeFileSync(file, result.output, "utf-8");
      }

      if (opts.format === "json") {
        console.log(JSON.stringify({ injected: result.injected, skipped: result.skipped, dryRun: opts.dryRun }, null, 2));
      } else {
        if (result.injected.length) console.log(`Injected: ${result.injected.join(", ")}`);
        if (result.skipped.length) console.log(`Skipped (already exist): ${result.skipped.join(", ")}`);
        if (opts.dryRun) console.log("(dry-run — no changes written)");
      }
    });
  return cmd;
}
