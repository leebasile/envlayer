import fs from "fs";
import path from "path";
import { Command } from "commander";
import { EnvCopyResult, EnvCopyOptions } from "./env-copy.types";

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    map.set(key, value);
  }
  return map;
}

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}

export function envCopyFile(
  sourcePath: string,
  destPath: string,
  options: EnvCopyOptions
): EnvCopyResult {
  const source = parseEnvFile(sourcePath);
  const dest = fs.existsSync(destPath) ? parseEnvFile(destPath) : new Map<string, string>();

  const keysCopied: string[] = [];
  const keysSkipped: string[] = [];
  const overwritten: string[] = [];

  const targetKeys = options.keys && options.keys.length > 0
    ? options.keys
    : Array.from(source.keys());

  for (const key of targetKeys) {
    if (!source.has(key)) {
      keysSkipped.push(key);
      continue;
    }
    if (dest.has(key) && !options.overwrite) {
      keysSkipped.push(key);
      continue;
    }
    if (dest.has(key) && options.overwrite) {
      overwritten.push(key);
    }
    if (!options.dryRun) {
      dest.set(key, source.get(key)!);
    }
    keysCopied.push(key);
  }

  if (!options.dryRun && keysCopied.length > 0) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, serializeEnvMap(dest), "utf-8");
  }

  return {
    source: sourcePath,
    destination: destPath,
    keysCopied,
    keysSkipped,
    overwritten,
  };
}

export function buildEnvCopyCommand(): Command {
  const cmd = new Command("env-copy");
  cmd
    .description("Copy specific keys from one .env file to another")
    .argument("<source>", "Source .env file")
    .argument("<destination>", "Destination .env file")
    .option("--overwrite", "Overwrite existing keys in destination", false)
    .option("--keys <keys>", "Comma-separated list of keys to copy")
    .option("--dry-run", "Preview changes without writing", false)
    .option("--json", "Output as JSON", false)
    .action((source, destination, opts) => {
      const keys = opts.keys ? opts.keys.split(",").map((k: string) => k.trim()) : undefined;
      const result = envCopyFile(source, destination, {
        overwrite: opts.overwrite,
        keys,
        dryRun: opts.dryRun,
      });
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Copied ${result.keysCopied.length} key(s) from ${source} → ${destination}`);
        if (result.overwritten.length) console.log(`Overwritten: ${result.overwritten.join(", ")}`);
        if (result.keysSkipped.length) console.log(`Skipped: ${result.keysSkipped.join(", ")}`);
        if (opts.dryRun) console.log("(dry run — no files written)");
      }
    });
  return cmd;
}
