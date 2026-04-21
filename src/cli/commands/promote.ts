import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

/**
 * Promotes environment variables from one environment file to another,
 * copying keys that are missing or optionally overwriting existing ones.
 */

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

export interface PromoteResult {
  promoted: string[];
  skipped: string[];
  overwritten: string[];
}

/**
 * Promotes keys from `source` into `target`.
 * - Keys missing in target are always added.
 * - Keys already present in target are skipped unless `overwrite` is true.
 */
export function promoteEnvFile(
  source: Map<string, string>,
  target: Map<string, string>,
  options: { overwrite?: boolean; keys?: string[] } = {}
): { result: Map<string, string>; report: PromoteResult } {
  const report: PromoteResult = { promoted: [], skipped: [], overwritten: [] };
  const result = new Map(target);

  const keysToPromote = options.keys && options.keys.length > 0
    ? options.keys
    : Array.from(source.keys());

  for (const key of keysToPromote) {
    if (!source.has(key)) continue;
    const value = source.get(key)!;
    if (!result.has(key)) {
      result.set(key, value);
      report.promoted.push(key);
    } else if (options.overwrite) {
      result.set(key, value);
      report.overwritten.push(key);
    } else {
      report.skipped.push(key);
    }
  }

  return { result, report };
}

export function buildPromoteCommand(): Command {
  const cmd = new Command("promote");

  cmd
    .description("Promote environment variables from a source file to a target file")
    .argument("<source>", "Source .env file to promote from")
    .argument("<target>", "Target .env file to promote into")
    .option("-o, --overwrite", "Overwrite existing keys in the target file", false)
    .option("-k, --keys <keys>", "Comma-separated list of keys to promote (default: all)")
    .option("--dry-run", "Preview changes without writing to disk", false)
    .option("--json", "Output result as JSON", false)
    .action((sourcePath: string, targetPath: string, opts) => {
      const resolvedSource = path.resolve(sourcePath);
      const resolvedTarget = path.resolve(targetPath);

      if (!fs.existsSync(resolvedSource)) {
        console.error(`Error: source file not found: ${resolvedSource}`);
        process.exit(1);
      }
      if (!fs.existsSync(resolvedTarget)) {
        console.error(`Error: target file not found: ${resolvedTarget}`);
        process.exit(1);
      }

      const source = parseEnvFile(resolvedSource);
      const target = parseEnvFile(resolvedTarget);
      const keys = opts.keys ? (opts.keys as string).split(",").map((k: string) => k.trim()) : [];

      const { result, report } = promoteEnvFile(source, target, {
        overwrite: opts.overwrite,
        keys,
      });

      if (opts.json) {
        console.log(JSON.stringify({ source: sourcePath, target: targetPath, ...report }, null, 2));
        return;
      }

      if (report.promoted.length > 0) {
        console.log(`Promoted (${report.promoted.length}): ${report.promoted.join(", ")}`);
      }
      if (report.overwritten.length > 0) {
        console.log(`Overwritten (${report.overwritten.length}): ${report.overwritten.join(", ")}`);
      }
      if (report.skipped.length > 0) {
        console.log(`Skipped (${report.skipped.length}): ${report.skipped.join(", ")}`);
      }
      if (report.promoted.length === 0 && report.overwritten.length === 0) {
        console.log("Nothing to promote.");
        return;
      }

      if (!opts.dryRun) {
        fs.writeFileSync(resolvedTarget, serializeEnvMap(result), "utf-8");
        console.log(`\nWrote updated file: ${resolvedTarget}`);
      } else {
        console.log("\n[dry-run] No files were modified.");
      }
    });

  return cmd;
}
